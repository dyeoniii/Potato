"""전체 자동 판독(analyze-all)과 YouTube 전체 댓글 수 안내 테스트. 모든 데이터는 가상."""
import threading
import time

from app.api import adapters, analyze_all
from tests.test_api import add_text, mk_case


class RateLimited(Exception):
    http_status = 429
    code = "LLM_RATE_LIMITED"


def level_for(content: str) -> str:
    if "죽여" in content:
        return "legal_review"
    if "사기꾼" in content:
        return "needs_context"
    return "low_risk"


def fake_analyze(comments, context=None):
    return [
        {"comment_id": c["comment_id"], "level": level_for(c["content"]), "issues": [],
         "flagged_phrases": [], "reason": "가상 판독", "check_points": []}
        for c in comments
    ]


def make_lines(n: int) -> str:
    kinds = ["죽여버린다 가상{}", "그 사람은 사기꾼 가상{}", "오늘 날씨 좋다 가상{}"]
    return "\n".join(kinds[i % 3].format(i) for i in range(n))


def wait_done(client, case_id, timeout=30):
    deadline = time.time() + timeout
    while time.time() < deadline:
        s = client.get(f"/api/cases/{case_id}/analyze-all/status").json()
        if not s["running"]:
            return s
        time.sleep(0.02)
    raise AssertionError("analyze-all did not finish")


def test_batches_of_50_with_at_most_3_concurrent_and_results_saved(client, monkeypatch):
    lock = threading.Lock()
    state = {"active": 0, "peak": 0, "sizes": []}

    def analyzer(comments, context=None):
        with lock:
            state["active"] += 1
            state["peak"] = max(state["peak"], state["active"])
            state["sizes"].append(len(comments))
        time.sleep(0.05)
        with lock:
            state["active"] -= 1
        return fake_analyze(comments, context)

    monkeypatch.setattr(adapters, "analyze_comments", analyzer)
    cid = mk_case(client)
    originals = add_text(client, cid, make_lines(260))["comments"]

    r = client.post(f"/api/cases/{cid}/analyze-all")
    assert r.status_code == 202
    assert r.json()["total"] == 260
    s = wait_done(client, cid)

    assert sorted(state["sizes"], reverse=True) == [50] * 5 + [10]
    assert state["peak"] == 3
    assert s["total"] == 260 and s["analyzed"] == 260 and s["pending"] == 0 and s["failed"] == 0
    # 가상 줄 i % 3: 0=legal_review, 1=needs_context, 2=low_risk (260개: 87/87/86)
    assert s["counts"] == {"legal_review": 87, "needs_context": 87, "low_risk": 86}

    detail = client.get(f"/api/cases/{cid}").json()
    assert all(c["analysis"] is not None for c in detail["comments"])
    assert [c["content"] for c in detail["comments"]] == [c["content"] for c in originals]  # 원문 불변
    assert detail["comments"][0]["analysis"]["disclaimer"] == "AI 분석은 법률 자문이 아닙니다."


def test_only_unanalyzed_comments_are_sent(client, monkeypatch):
    seen = []

    def analyzer(comments, context=None):
        seen.extend(c["comment_id"] for c in comments)
        return fake_analyze(comments, context)

    monkeypatch.setattr(adapters, "analyze_comments", analyzer)
    cid = mk_case(client)
    comments = add_text(client, cid, make_lines(6))["comments"]
    manual = [comments[0]["id"], comments[1]["id"]]
    r = client.post(f"/api/cases/{cid}/analyze", json={"comment_ids": manual})  # 기존 선택 판독은 그대로 동작
    assert r.status_code == 200
    seen.clear()

    client.post(f"/api/cases/{cid}/analyze-all")
    s = wait_done(client, cid)
    assert sorted(seen) == sorted(c["id"] for c in comments[2:])
    assert s["analyzed"] == 6

    seen.clear()
    r = client.post(f"/api/cases/{cid}/analyze-all")  # 남은 것이 없으면 호출 없음
    assert r.status_code == 202 and r.json()["running"] is False
    assert seen == []


def test_rate_limit_429_waits_then_retries(client, monkeypatch):
    waits = []
    monkeypatch.setattr(analyze_all, "_sleep", lambda s: waits.append(s))
    calls = {"n": 0}

    def analyzer(comments, context=None):
        calls["n"] += 1
        if calls["n"] <= 2:
            raise RateLimited()
        return fake_analyze(comments, context)

    monkeypatch.setattr(adapters, "analyze_comments", analyzer)
    cid = mk_case(client)
    add_text(client, cid, make_lines(10))
    client.post(f"/api/cases/{cid}/analyze-all")
    s = wait_done(client, cid)
    assert s["analyzed"] == 10 and s["failed"] == 0 and s["error"] is None
    assert waits == [5, 10]  # 점점 길게 대기


def test_rate_limit_gives_up_and_rerun_picks_up_rest(client, monkeypatch):
    monkeypatch.setattr(analyze_all, "_sleep", lambda s: None)
    monkeypatch.setattr(analyze_all, "RATE_LIMIT_WAITS", (1, 1))
    broken = {"on": True}

    def analyzer(comments, context=None):
        if broken["on"]:
            raise RateLimited()
        return fake_analyze(comments, context)

    monkeypatch.setattr(adapters, "analyze_comments", analyzer)
    cid = mk_case(client)
    add_text(client, cid, make_lines(8))
    client.post(f"/api/cases/{cid}/analyze-all")
    s = wait_done(client, cid)
    assert s["analyzed"] == 0 and s["failed"] == 8 and s["pending"] == 8
    assert "다시 실행" in s["message"]

    broken["on"] = False
    client.post(f"/api/cases/{cid}/analyze-all")
    s = wait_done(client, cid)
    assert s["analyzed"] == 8 and s["failed"] == 0 and s["message"] is None


def test_module_not_connected_reports_error_without_fake_results(client):
    cid = mk_case(client)  # conftest가 AI 판독을 stub(미연결)으로 고정
    add_text(client, cid, make_lines(5))
    client.post(f"/api/cases/{cid}/analyze-all")
    s = wait_done(client, cid)
    assert s["analyzed"] == 0 and s["failed"] == 5
    assert "연결되지" in s["error"]


def test_invalid_model_output_retried_once_then_counted_failed(client, monkeypatch):
    calls = {"n": 0}

    def analyzer(comments, context=None):
        calls["n"] += 1
        return [{"comment_id": comments[0]["comment_id"], "level": "guilty"}]

    monkeypatch.setattr(adapters, "analyze_comments", analyzer)
    cid = mk_case(client)
    add_text(client, cid, make_lines(3))
    client.post(f"/api/cases/{cid}/analyze-all")
    s = wait_done(client, cid)
    assert calls["n"] == 2 and s["failed"] == 3 and s["analyzed"] == 0


def test_second_start_while_running_does_not_duplicate(client, monkeypatch):
    gate = threading.Event()
    calls = {"n": 0}

    def analyzer(comments, context=None):
        calls["n"] += 1
        gate.wait(5)
        return fake_analyze(comments, context)

    monkeypatch.setattr(adapters, "analyze_comments", analyzer)
    cid = mk_case(client)
    add_text(client, cid, make_lines(10))
    assert client.post(f"/api/cases/{cid}/analyze-all").json()["running"] is True
    assert client.post(f"/api/cases/{cid}/analyze-all").json()["running"] is True
    gate.set()
    wait_done(client, cid)
    assert calls["n"] == 1


def test_case_deleted_during_run_stops_cleanly(client, monkeypatch):
    gate = threading.Event()

    def analyzer(comments, context=None):
        gate.wait(5)
        return fake_analyze(comments, context)

    monkeypatch.setattr(adapters, "analyze_comments", analyzer)
    cid = mk_case(client)
    add_text(client, cid, make_lines(120))
    client.post(f"/api/cases/{cid}/analyze-all")
    assert client.delete(f"/api/cases/{cid}").status_code == 204
    gate.set()
    deadline = time.time() + 10
    while time.time() < deadline and analyze_all._jobs[cid].running:
        time.sleep(0.02)
    assert analyze_all._jobs[cid].running is False
    assert client.get(f"/api/cases/{cid}/analyze-all/status").status_code == 404


def test_unknown_case_is_404(client):
    assert client.post("/api/cases/nope/analyze-all").status_code == 404
    assert client.get("/api/cases/nope/analyze-all/status").status_code == 404


def test_mock_provider_1000_comments_end_to_end(client, monkeypatch):
    """실제 classify(LLM_PROVIDER=mock)로 가상 댓글 1000개를 판독하고 걸린 시간을 확인한다."""
    from app.analysis import classify

    monkeypatch.setenv("LLM_PROVIDER", "mock")
    monkeypatch.setattr(adapters, "analyze_comments", classify.analyze_comments)
    cid = mk_case(client)
    lines = "\n".join(
        ["너는 쓰레기다 가상{}", "그 사람 사기꾼이다 가상{}", "영상 잘 봤습니다 가상{}", "오늘 날씨 좋다 가상{}"][i % 4].format(i)
        for i in range(1000)
    )
    add_text(client, cid, lines)

    t0 = time.perf_counter()
    client.post(f"/api/cases/{cid}/analyze-all")
    s = wait_done(client, cid, timeout=60)
    elapsed = time.perf_counter() - t0
    print(f"\n[perf] mock 1000 comments analyzed in {elapsed:.2f}s")

    assert s["total"] == 1000 and s["analyzed"] == 1000 and s["failed"] == 0
    assert s["counts"] == {"legal_review": 250, "needs_context": 250, "low_risk": 500}
    assert elapsed < 30


# ---------------------------------------------------------------- YouTube 전체 댓글 수 / 한도 안내
def _fake_comments(n):
    return [{"content": f"가상 댓글 {i}", "author": None, "posted_at": None, "comment_url": None,
             "parent_id": None, "like_count": None} for i in range(n)]


def test_youtube_input_reports_total_available_and_limit_notice(client, monkeypatch):
    monkeypatch.setenv("YOUTUBE_MAX_COMMENTS", "5")
    seen = {}

    def fake_fetch(video_id, limit=None):
        seen["limit"] = limit
        return _fake_comments(5)

    monkeypatch.setattr(adapters, "fetch_youtube_comments", fake_fetch)
    monkeypatch.setattr(adapters, "fetch_youtube_comment_count", lambda vid: 4000)
    cid = mk_case(client)
    r = client.post(f"/api/cases/{cid}/inputs/url", json={"url": "https://youtu.be/dQw4w9WgXcQ"})
    body = r.json()
    assert r.status_code == 200 and seen["limit"] == 5
    assert body["total_available"] == 4000 and len(body["comments"]) == 5
    assert body["notice"] == "댓글이 4,000개라 최근 5개만 분석합니다."
    assert body["source"]["message"] == body["notice"]  # 사건 상세에서도 보이도록 저장


def test_youtube_input_no_notice_when_under_limit_or_unlimited(client, monkeypatch):
    seen = {}

    def fake_fetch(video_id, limit=None):
        seen["limit"] = limit
        return _fake_comments(3)

    monkeypatch.setattr(adapters, "fetch_youtube_comments", fake_fetch)
    monkeypatch.setattr(adapters, "fetch_youtube_comment_count", lambda vid: 3)
    cid = mk_case(client)
    monkeypatch.setenv("YOUTUBE_MAX_COMMENTS", "10")
    body = client.post(f"/api/cases/{cid}/inputs/url", json={"url": "https://youtu.be/dQw4w9WgXcQ"}).json()
    assert body["total_available"] == 3 and body["notice"] is None

    monkeypatch.setenv("YOUTUBE_MAX_COMMENTS", "0")  # 무제한
    monkeypatch.setattr(adapters, "fetch_youtube_comment_count", lambda vid: 99999)
    body = client.post(f"/api/cases/{cid}/inputs/url", json={"url": "https://youtu.be/dQw4w9WgXcQ"}).json()
    assert seen["limit"] == 0 and body["total_available"] == 99999 and body["notice"] is None


def test_youtube_count_failure_does_not_block_collection(client, monkeypatch):
    def boom(vid):
        raise RuntimeError("quota")

    monkeypatch.setattr(adapters, "fetch_youtube_comment_count", boom)
    monkeypatch.setattr(adapters, "fetch_youtube_comments", lambda vid, limit=None: _fake_comments(2))
    cid = mk_case(client)
    body = client.post(f"/api/cases/{cid}/inputs/url", json={"url": "https://youtu.be/dQw4w9WgXcQ"}).json()
    assert len(body["comments"]) == 2 and body["total_available"] is None and body["notice"] is None
