"""가상 샘플 생성기. 실존 인물/계정/게시물과 무관한 합성 데이터만 만든다.
실행: python samples/make_samples.py  (이미지 생성에는 Pillow 필요)
"""
import json
from pathlib import Path

OUT = Path(__file__).parent
SHA = "9f2c1a7d4b6e8035ac91d27f0e4b8a63d15c7e2908fb4a6d3c15e7a9b0d24f68"  # 가상 해시 (실제 파일 아님)

# (author, content, posted_at, level, issues, flagged, reason, checks)
RAW = [
 ("가상계정01", "오늘 영상 편집 진짜 깔끔하네요", None, "low_risk", [], [], "비판·욕설 없는 일반 감상입니다.", []),
 ("가상계정02", "이번 기획은 좀 별로였어요. 다음엔 더 기대할게요", "2026-11-13T09:10:00Z", "low_risk", [], [], "의견 표현으로 보이며 모욕적 표현이 없습니다.", []),
 ("가상계정03", "그 사람은 사기꾼이다", "2026-11-13T09:12:00Z", "needs_context", ["명예훼손(사실 적시)"], ["사기꾼이다"], "사실관계와 문맥 확인이 필요합니다.", ["발언 대상이 특정되는지 확인", "사기 사실의 근거 유무 확인"]),
 ("가상계정04", "저 인간 완전 쓰레기네 ㅋㅋ", "2026-11-13T09:15:00Z", "legal_review", ["모욕"], ["쓰레기네"], "대상을 직접 비하하는 표현입니다.", ["대상 특정 여부", "반복·공연성 여부"]),
 ("가상계정05", "채널 주인 돈 빼돌려서 집 샀다던데", "2026-11-13T09:20:00Z", "needs_context", ["명예훼손(허위사실 가능성)"], ["돈 빼돌려서"], "출처 없는 사실 주장입니다. 진위 확인이 필요합니다.", ["주장의 출처 확인", "사실 여부 자료 확인"]),
 ("가상계정06", "또 시작이네 이 채널 수준 ㅋ", None, "needs_context", ["모욕 가능성"], ["수준"], "비꼬는 표현으로 수위 판단에 맥락이 필요합니다.", ["이전 대화 맥락 확인"]),
 ("가상계정07", "영상 잘 봤습니다 구독했어요", "2026-11-13T10:01:00Z", "low_risk", [], [], "긍정적 일반 댓글입니다.", []),
 ("가상계정08", "너 같은 건 사라져라", "2026-11-13T10:05:00Z", "legal_review", ["협박·모욕 가능성"], ["사라져라"], "상대를 향한 위협적 표현이 포함됩니다.", ["반복 여부", "다른 댓글과의 연관성"]),
 ("가상계정09", "편집자 바꿔야겠다 영상 느려요", "2026-11-13T10:08:00Z", "low_risk", [], [], "서비스 품질에 대한 의견입니다.", []),
 ("가상계정10", "이 사람 과거에 폭행했다는 얘기 있음", None, "needs_context", ["명예훼손(사실 적시)"], ["폭행했다는"], "구체적 사실 주장이며 근거가 제시되지 않았습니다.", ["근거 자료 유무", "게시 시점 확인"]),
 ("가상계정11", "ㅋㅋㅋ 웃기네", "2026-11-13T10:12:00Z", "low_risk", [], [], "문맥상 위험 신호가 없습니다.", []),
 ("가상계정12", "얼굴이 그게 뭐냐 못생김", "2026-11-13T10:15:00Z", "legal_review", ["모욕"], ["못생김"], "외모 비하 표현입니다.", ["대상 특정 여부"]),
 ("가상계정13", "다음 영상은 언제 올라와요?", "2026-11-13T10:20:00Z", "low_risk", [], [], "단순 질문입니다.", []),
 ("가상계정14", "저 사람 가족까지 다 알고 있다 조심해라", "2026-11-13T10:25:00Z", "legal_review", ["협박 가능성"], ["가족까지 다 알고 있다"], "위협으로 읽힐 수 있는 표현입니다.", ["실제 위해 정황 확인", "보존 필요 자료 확인"]),
]
LABEL = {"legal_review": "법적 검토 필요", "needs_context": "추가 맥락 확인 필요", "low_risk": "낮은 위험"}
SAVED = {3, 4, 5, 8, 10, 12, 14}  # 번호(1부터): 증거함에 저장된 댓글

comments = []
for i, (au, ct, ts, lv, iss, fl, rs, ck) in enumerate(RAW, 1):
    comments.append({
        "id": f"cmt_{i}", "source_id": "src_1", "author": au, "content": ct, "posted_at": ts,
        "comment_url": f"https://www.youtube.com/watch?v=EXAMPLE0001&lc=sample{i:02d}" if i % 2 else None,
        "platform": "youtube", "like_count": None, "parent_id": None,
        "saved": i in SAVED, "user_note": "시연용 메모" if i == 4 else None, "user_confirmed": i in {3, 4},
        "analysis": {"level": lv, "level_label": LABEL[lv], "issues": iss, "flagged_phrases": fl,
                     "reason": rs, "check_points": ck, "disclaimer": "AI 분석은 법률 자문이 아닙니다."},
    })

case = {
    "id": "case_demo", "title": "시연용 가상 사건 (실존 정보 없음)", "description": "합성 데이터로 만든 시연 사건입니다.",
    "created_at": "2026-11-14T03:00:00Z",
    "sources": [
        {"id": "src_1", "type": "youtube", "url": "https://www.youtube.com/watch?v=EXAMPLE0001", "file_sha256": None,
         "collected_at": "2026-11-14T03:05:00Z", "needs_manual_input": False, "message": None},
        {"id": "src_2", "type": "image", "url": None, "file_sha256": SHA,
         "collected_at": "2026-11-14T03:10:00Z", "needs_manual_input": False, "message": None},
    ],
    "comments": comments,
    "answers": [{"question_id": "q1", "question": "실제 어떤 피해가 있었나요?", "answer": "(가상) 댓글 확인 후 불안을 느꼈다."}],
}
# 이미지 출처 댓글: 작성자/시각을 읽지 못한 경우 null
case["comments"].append({
    "id": "cmt_15", "source_id": "src_2", "author": None, "content": "(가상) 이미지 속 댓글: 다 알고 있으니 각오해라",
    "posted_at": None, "comment_url": None, "platform": "image", "like_count": None, "parent_id": None,
    "saved": True, "user_note": None, "user_confirmed": False, "analysis": None})

(OUT / "sample_comments.json").write_text(json.dumps(comments, ensure_ascii=False, indent=2), encoding="utf-8")
(OUT / "sample_case.json").write_text(json.dumps(case, ensure_ascii=False, indent=2), encoding="utf-8")

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Pillow 없음: 이미지 생성 생략")
    raise SystemExit
font_path = next((p for p in ["/System/Library/Fonts/Supplemental/AppleGothic.ttf",
                              "/usr/share/fonts/truetype/nanum/NanumGothic.ttf",
                              "C:/Windows/Fonts/malgun.ttf"] if Path(p).is_file()), None)
f = ImageFont.truetype(font_path, 26) if font_path else ImageFont.load_default()
fs = ImageFont.truetype(font_path, 20) if font_path else f

def shot(name, items, with_meta=True):
    img = Image.new("RGB", (720, 140 * len(items) + 90), "white")
    d = ImageDraw.Draw(img)
    d.text((24, 24), "가상 SNS 댓글 화면 (합성 이미지)", fill="#555", font=fs)
    y = 80
    for author, text, when in items:
        d.ellipse((24, y, 76, y + 52), fill="#c9d3e3")
        d.text((92, y), author if with_meta else "", fill="#222", font=f)
        if with_meta and when:
            d.text((92, y + 36), when, fill="#888", font=fs)
        d.text((92, y + 70), text, fill="#111", font=f)
        y += 140
    img.save(OUT / name)

shot("sample_screenshot_1.png", [("가상계정03", "그 사람은 사기꾼이다", "2026-11-13 18:12"),
                                 ("가상계정04", "저 인간 완전 쓰레기네 ㅋㅋ", "2026-11-13 18:15")])
shot("sample_screenshot_2_no_meta.png", [("", "작성자와 시각이 보이지 않는 가상 댓글", None)], with_meta=False)
print("ok")
