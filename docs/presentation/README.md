# 악플가드 — 시연 자료 (초안)

SNS 악성 댓글 판독·증거 보관·법적 대응 준비 웹앱(가칭). **AI 분석은 법률 자문이 아닙니다.**

## 실행
```bash
cd backend && uvicorn app.main:app --reload --port 8000
cd frontend && npm run dev
```
PDF 단독 확인: `cd backend && pytest app/documents/tests -q`
(한글 폰트: 환경변수 `PDF_FONT_PATH`로 TTF 지정 가능, 없으면 OS 폰트 탐색 후 내장 CID 폰트로 대체)

## 샘플 데이터 (모두 가상)
- `samples/sample_comments.json` 댓글 14개 / `samples/sample_case.json` 사건 전체(PDF 입력 형식)
- `samples/sample_screenshot_1.png` 작성자·시각 보임 / `sample_screenshot_2_no_meta.png` 보이지 않음(null 확인용)
- 재생성: `python samples/make_samples.py`

## 한계
- YouTube 외 플랫폼은 자동 수집하지 않고 URL 출처만 보관합니다.
- PWA 공유 수신은 설치형·지원 브라우저에서만 동작합니다(iOS 가정 금지).
- 고소 성립·승소 가능성을 판단하지 않습니다.
