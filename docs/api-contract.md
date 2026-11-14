# REST API 계약 v2 — 프론트/백 공용 · 합의 후 변경

Base `/api`; 날짜는 ISO-8601 UTC `...Z`, 프론트에서 KST 렌더. JSON에 원문 미확인 필드를 임의로 채우지 말 것. 성공 시 표의 형식을 따르고, 실패는 `{"error":{"code":"VALIDATION_ERROR","message":"설명"}}` + 적절한 HTTP status.

## 공통
| Method | Path | 설명 |
|---|---|---|
| GET | `/health` | `{ "status": "ok" }` |

## 1. 사건(증거함)
| Method | Path | 요청 / 응답 |
|---|---|---|
| POST | `/cases` | `{ "title": "...", "description": "..." }` → `{ "id": "case_1", "title": "...", "description": "...", "created_at": "...Z" }` |
| GET | `/cases` | `[{ "id":"case_1", "title":"...", "created_at":"...Z", "saved_count":2 }]` |
| GET | `/cases/{case_id}` | 사건 상세(아래 예시), 404 처리 |
| DELETE | `/cases/{case_id}` | 삭제 성공 시 204, 연관 소스·원본 파일까지 삭제 |

GET 상세 예시:
```json
{
 "id":"case_1", "title":"SNS 비방 댓글", "description":"시연용 가상 사건", "created_at":"2026-11-14T03:00:00Z",
 "sources":[{"id":"src_1","type":"text","url":null,"file_sha256":null,"collected_at":"2026-11-14T03:01:00Z","needs_manual_input":false,"message":null}],
 "comments":[{"id":"cmt_1","source_id":"src_1","author":null,"content":"그 사람은 사기꾼이다","posted_at":null,"comment_url":null,"platform":"text","like_count":null,"parent_id":null,"saved":true,"user_note":null,"user_confirmed":false,"analysis":{"level":"needs_context","level_label":"추가 맥락 확인 필요","issues":["명예훼손(사실 적시)"],"flagged_phrases":["사기꾼이다"],"reason":"실제 문맥과 사실관계 확인이 필요합니다.","check_points":["발언 대상이 특정되는지 확인"],"disclaimer":"AI 분석은 법률 자문이 아닙니다."}}],
 "answers":[]
}
```

## 2. 입력 → 댓글 추출
| Method | Path | 요청 / 설명 |
|---|---|---|
| POST | `/cases/{case_id}/inputs/url` | JSON `{ "url":"https://www.youtube.com/watch?v=..." }` → 영상 ID 추출, YouTube 공개 댓글을 최신순으로 `YOUTUBE_MAX_COMMENTS`개까지(답글 포함, 기본 10000, `0`=무제한). 그 외 URL은 출처만 기록. |
| POST | `/cases/{case_id}/inputs/text` | JSON `{ "text":"...", "source_url":null, "context":null }` → 댓글 단위 추출; 사용자가 확인/수정 가능한 리스트 |
| POST | `/cases/{case_id}/inputs/image` | `multipart/form-data`: `file`(필수), `source_url`(선택), `context`(선택); 파일 형식/10MB 제한 |

공통 응답 (각 입력별 조회 성공, 또는 수동 입력 필요):
```json
{
 "source":{"id":"src_2","type":"youtube","url":"https://www.youtube.com/watch?v=example","file_sha256":null,"collected_at":"2026-11-14T03:05:00Z","needs_manual_input":false,"message":null},
 "comments":[{"id":"cmt_2","source_id":"src_2","author":"예시계정","content":"시연용 가상 댓글","posted_at":null,"comment_url":null,"platform":"youtube","like_count":null,"parent_id":null,"saved":false,"user_note":null,"user_confirmed":false}]
}
```
- source.type: `youtube | text | image | url_only`; 댓글이 0개일 수도 있음.
- YouTube 입력 응답에는 최상위 필드 `total_available`(videos.list `commentCount`, 답글 포함 전체 댓글 수. 조회 실패·비공개 통계는 `null`)와 `notice`가 추가된다. `total_available`이 한도보다 크면 `notice`는 `"댓글이 4,000개라 최근 10,000개만 분석합니다"` 형식의 안내이고(같은 문구가 `source.message`에도 저장), 아니면 `null`. 다른 입력 종류에서는 둘 다 `null`.
- YouTube API 실패: `503` 등 적절한 오류 응답 + 수동입력 안내. 외부 URL은 **스크래핑 없이 출처 URL만 저장**해 `type=url_only`, `needs_manual_input=true` 반환.
- img에서 OCR로 찾지 못한 작성자/시각은 `null`, 없는 게시물 URL을 창작하지 말 것.

## 3. 판독 / 증거 저장
| Method | Path | 요청 / 응답 |
|---|---|---|
| POST | `/cases/{case_id}/analyze` | `{ "comment_ids":["cmt_1","cmt_2"] }` → results 배열; 한 번에 최대 20건 권장 |
| PATCH | `/comments/{comment_id}` | `{ "saved":true, "user_note":"...", "user_confirmed":true }` (필드 선택적) → 갱신된 댓글 객체 |
| PATCH | `/comments/bulk` | 증거함 일괄 저장/해제. `{ "saved":true, "comment_ids":["cmt_1","cmt_2"] }` 또는 `{ "saved":true, "case_id":"case_1", "level":"legal_review" }`(둘 중 하나만, `comment_ids`는 최대 20000개, 선택적으로 `case_id`로 범위 제한) → `{ "saved":true, "updated":2, "comment_ids":["cmt_1","cmt_2"], "missing":[] }`. `saved`만 바꾸며 `user_confirmed`·`user_note`·원문은 건드리지 않는다(일괄 저장된 증거는 사용자 확인 전 상태). 알 수 없는 사건 `404`, 대상 지정 오류 `400`. |

```json
{
 "results":[{"comment_id":"cmt_1","level":"legal_review","level_label":"법적 검토 필요","issues":["모욕"],"flagged_phrases":["문제 표현 원문 일부"],"reason":"문맥을 고려한 설명 2~3문장입니다.","check_points":["대상 특정 여부"],"disclaimer":"AI 분석은 법률 자문이 아닙니다."}]
}
```
- 선택 필드(추가, 없어도 됨·이전 판독 결과는 `null`): `statement_type`(`의견 표명 | 사실 적시 | 허위사실 의심 | 해당 없음`)과 `related_laws`(관련될 수 있는 법조 이름, 최대 2개, `docs/analysis-criteria.md`의 목록에서만; `low_risk`는 빈 배열). **참고용 AI 추정**이며 처벌·성립을 뜻하지 않는다. 사건 상세의 `comments[].analysis`에도 같은 필드가 포함된다.
- `legal_review | needs_context | low_risk` 중 하나; Gemini가 반환하더라도 서버에서 Pydantic 검증 및 재시도.
- 원본 댓글 content는 판독 후 변경 금지. 사용자 확인은 법적 사실 확정이 아닌 '내용 확인' 표시.

### 전체 자동 판독 (`/analyze`와 별개, `/analyze`는 선택 판독용으로 그대로 유지)
| Method | Path | 요청 / 응답 |
|---|---|---|
| POST | `/cases/{case_id}/analyze-all` | 본문 없음. 아직 판독되지 않은 댓글 전체를 백그라운드로 판독 시작 → `202` + 아래 상태 객체. 이미 실행 중이면 새로 시작하지 않고 현재 상태만 반환. 판독할 댓글이 없으면 `running:false`. 쿼리 `?force=true`: 이미 판독된 댓글도 다시 판독(새 판독 기준 적용). 새 결과가 저장되기 전까지 이전 결과는 유지되고, 실패해도 이전 결과가 남는다. |
| GET | `/cases/{case_id}/analyze-all/status` | 현재 상태 객체 |
| POST | `/cases/{case_id}/analyze-all/stop` | 본문 없음. 진행 중인 배치는 마무리하고 새 배치는 시작하지 않는다 → `200` + 상태 객체(`stopping:true`, 배치가 끝나면 `running:false`). 이미 저장된 결과는 유지되며 `POST /analyze-all`로 남은 댓글을 이어서 판독한다. 실행 중이 아니면 아무 일도 하지 않고 현재 상태만 반환. |
```json
{"case_id":"case_1","running":true,"total":4000,"analyzed":1250,"pending":2750,"failed":0,
 "run_total":2750,"run_done":0,
 "counts":{"legal_review":40,"needs_context":95,"low_risk":1115},
 "message":null,"error":null}
```
- `run_total`/`run_done`: 가장 최근 실행의 대상 수와 결과가 저장된 수(진행률 표시용. `force` 실행은 이미 판독된 댓글이 포함되므로 `analyzed`가 아니라 이 값을 쓴다).
- `total`: 사건의 전체 댓글 수, `analyzed`/`counts`: DB에 저장된 판독 결과 기준. 이미 판독된 댓글은 다시 판독하지 않는다.
- 50개 단위 배치, 동시에 최대 3개 배치. 속도 제한(429)은 5·10·20·40·60·60초 대기 후 재시도하고, 그래도 안 되면 해당 배치만 `failed`로 센다. 다시 `POST`하면 판독 안 된 댓글만 다시 시도한다.
- `message`: 대기·일부 실패 안내(예: "N개는 판독하지 못했습니다. 다시 실행하면 남은 댓글만 판독합니다."), `error`: 실행이 끝난 뒤 첫 실패 원인(AI 모듈 미연결·키 오류 등).
- `stopping`: 중단 요청을 받고 진행 중인 배치를 마무리하는 중이면 `true`(필드 추가, 기존 응답은 그대로).
- 진행 상태(`running`, `failed`)는 서버 메모리에만 있다(로컬 단일 사용자 시연용). 서버를 재시작하면 `running:false`가 되며 `POST`로 이어서 판독한다.

## 4. 증거 보완
| Method | Path | 설명 |
|---|---|---|
| POST | `/cases/{case_id}/agent/review` | 저장된 증거 확인 → checklist/questions (필요하면 템플릿 기반) |
| POST | `/cases/{case_id}/agent/answers` | `{ "answers":[{"question_id":"q1","answer":"가상 피해 경위"}] }` → 아래 리뷰와 같은 형태 |

```json
{"completeness":60,"checklist":[{"item":"원본 게시글 URL","status":"partial","detail":"3건 중 1건 누락"}],"questions":[{"id":"q1","question":"실제 어떤 피해가 있었나요?"}]}
```
- completeness: 누락 없이 기입한 서비스 체크 항목 비율, **소송 성공률/증거 법적 충분성 아님**.

## 5. PDF 문서
| Method | Path | 결과 |
|---|---|---|
| GET | `/cases/{case_id}/documents/statement.pdf` | 사건 경위서 PDF; `application/pdf`, `Content-Disposition: attachment` |
| GET | `/cases/{case_id}/documents/evidence-list.pdf` | 저장된 증거 목록 PDF; 증거 번호/댓글/작성자/시각/URL/수집 시각/SHA-256 |

- 사건 정보나 증거가 없는 경우 사용자에게 이해 가능한 오류 표시. AI 분석과 사용자 확인 사실을 구분하고 법률 고지 필수.

- PDF 두 종류 모두 선택 쿼리 `?mask_author=true`를 받는다: 작성자를 앞 1글자 + `**`로 가려 출력한다(앞의 `@`는 유지, 예 `@정수진` → `@정**`, 값이 없으면 그대로). 기본값은 원본이며 DB의 작성자는 바뀌지 않는다.
- 판독 참고 필드(`statement_type`, `related_laws`)가 있으면 두 PDF에 "[참고]" 표시와 함께 출력된다(AI 추정, 처벌·성립 여부를 뜻하지 않음). 일괄 저장 등으로 사용자 확인이 없는 증거는 경위서에 "확인 표시 없음 (사용자 확인 전)"으로 표시된다.
## 6. SNS 공유 수신 (프론트 라우트, API 아님)
- 설치형 PWA의 manifest `share_target: { "action":"/share-target", "method":"GET", "enctype":"application/x-www-form-urlencoded", "params":{"title":"title","text":"text","url":"url"} }`.
- FE `/share-target` 라우트에서 URL을 안전하게 추출하여 **URL 입력 탭만 프리필**. 자동 분석/수집은 사용자의 명시적 클릭 후 진행.
- 개발 서버/브라우저·설치 지원 여부에 따라 동작 제한. 지원되지 않는 경우 복사/붙여넣기 제공.
