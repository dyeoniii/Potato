# 악플가드 Kiro Crew 4세션 개발 핸드오프 (하루 MVP)

> **이 ZIP은 애플리케이션 소스코드가 아닌, 구현을 위한 지시·계약 패키지입니다.**
> 두 개발자 / 네 독립 작업 세션 / 총 3,000 Kiro 크레딧(계정 A 1,000, 계정 B 2,000).

## 1. 반드시 읽을 파일
1. `docs/requirements-mvp.md` — 개발 범위, 제외 범위, 합격 조건 (우선순위 기준)
2. `docs/api-contract.md` — 프론트·백 공통 계약 및 오류 응답
3. `docs/session-ownership.md` — **4개 세션의 파일 수정 권한과 합치는 순서**
4. `docs/analysis-criteria.md` — 법적 위험 신호 분석 기준 (법률 자문 아님)
5. `prompts/01_quick_spec.md` — Kiro Quick Spec 1회 실행
6. `prompts/02_session_prompts.md` — 세션별 시작 프롬프트 네 개

## 2. 최초 설정 (두 계정 공동)
1. ZIP 안 `kiro-handoff/` 폴더의 내용을 **동일 Git 저장소 루트**에 복사.
2. 두 계정 모두 Kiro Crew/Kiro CLI 로그인 및 작업 디렉터리 접근 확인. Kiro Crew를 사용해도 Kiro CLI 인증 문제가 있으면 세션이 실행되지 않을 수 있음.
3. `.env.example` → `.env`로 복사, Gemini/YouTube 키는 각자 안전하게 로컬에 설정. **메신저·Git·프롬프트에 실제 키를 올리지 말 것.**
4. `docs/analysis-criteria.md`의 기존 지침 참고란에 팀이 검증한 기준을 추가할 수 있지만, 미확인 법률 판정을 확정적 규칙처럼 추가하지 말 것.
5. Quick Spec을 **한 세션에서 한 번만 생성**, `requirements.md / design.md / tasks.md`를 리뷰하고 저장소에 반영.
6. tasks는 [FE] [DOC] [API] [AI] + [INTEGRATION]으로 나누어 네 세션에 배정. 필요 시 기존 생성 스펙 재생성/수정.

## 3. 네 세션 병렬 실행
- **계정 A (1,000)**: 세션 1 [FE] 프론트, 세션 2 [DOC] PDF/데모 샘플
- **계정 B (2,000)**: 세션 3 [API] FastAPI/DB, 세션 4 [AI] Gemini/YouTube/이미지 추출
- 각 세션은 **자기 브랜치 + 가능하면 별도 Git worktree/클론**에서 실행.
- 네 세션을 동시에 실행한다고 크레딧이 4배 생성되는 것이 아님. 계정별 소모는 각 계정 잔액에서 차감.
- `docs/session-ownership.md`의 파일 수정 권한과 함수 인터페이스를 지킬 것.

## 4. 개발 순서와 합치기
- 시작 시 공용 명세/환경변수 확정 → 4세션 병렬로 '실제 구현' → 작은 PR 단위로 통합.
- `main`에 직접 코드 푸시 금지. **세션별 브랜치/PR** 사용.
- 계정 B [API]가 실제 라우터 연동과 통합 작업 주도. 계정 A [FE]는 API 응답·UI 검증, [DOC]는 PDF 출력 검증.
- 첫 5시간 안에 P0: 텍스트 → Gemini 판독 → 저장 → PDF까지 한 바퀴 연결.
- 이후 이미지/유튜브 URL/공유 수신 확인. 연결 완료 후에만 P1 개선.
- 마감 3시간 전 통합 시작, 2시간 전 기능 추가 중지, 마지막 1시간 테스트·데모.

## 5. 오늘 합격 기준 (P0)
- 텍스트를 입력해 실제 AI 판독 결과를 받는다 (mock은 개발·비상용).
- 스크린샷의 댓글을 추출하고 미인식 필드를 빈 값/불명으로 처리한다.
- YouTube URL에서 접근 가능한 공개 댓글을 조회한다. 실패하면 설명과 대체 입력을 보여준다.
- **URL 붙여넣기 + SNS 링크 공유 수신(PWA 지원 환경) 둘 다 구현한다.** 공유 수신이 안 되는 환경은 붙여넣기로 대체한다.
- 사건별 증거를 저장하고 조회하며, 사건 경위서·증거 목록 **PDF 2종**을 실제 데이터로 생성한다.
- 같은 입력에서 추출/분류한 내용과 사용자 확인 사실을 구분한다.

## 6. 실행 목표
- Backend: `cd backend && uvicorn app.main:app --reload --port 8000`
- Frontend: `cd frontend && npm run dev` → Vite `/api` 프록시 → :8000
- 브라우저 API/공유 수신 기능은 개발 환경과 HTTPS/설치 여부를 구분해 테스트.
- 통합 테스트 방법은 `docs/acceptance-tests.md` 참고.

## 7. 나중에 할 기능
고소장 참고 초안·변호사 상담 요약서·전문가 연결·다중 SNS 자동 수집·회원별 권한·LangGraph·Embedding 기반 반복 공격 분석.
