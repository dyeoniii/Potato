import type {
  AnalysisResult,
  AnalyzeAllStatus,
  AnswerItem,
  CaseDetail,
  CaseSummary,
  CommentItem,
  CommentPatch,
  DocumentKind,
  InputResponse,
  ReviewResponse,
} from '../types';

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(message: string, code = 'UNKNOWN', status = 0) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/** 실제 API(client.ts)와 목(mock.ts)이 함께 구현하는 인터페이스 */
export interface Api {
  createCase(body: { title: string; description: string }): Promise<{ id: string; title: string; description: string; created_at: string }>;
  listCases(): Promise<CaseSummary[]>;
  getCase(id: string): Promise<CaseDetail>;
  deleteCase(id: string): Promise<void>;
  inputUrl(caseId: string, url: string): Promise<InputResponse>;
  inputText(caseId: string, body: { text: string; source_url: string | null; context: string | null }): Promise<InputResponse>;
  inputImage(caseId: string, file: File, sourceUrl: string | null, context: string | null): Promise<InputResponse>;
  analyze(caseId: string, commentIds: string[]): Promise<{ results: AnalysisResult[] }>;
  /** 판독 안 된 댓글 전체를 서버에서 백그라운드로 판독 시작(이미 실행 중이면 현재 상태 반환). force=true면 이미 판독된 댓글도 다시 판독 */
  analyzeAll(caseId: string, force?: boolean): Promise<AnalyzeAllStatus>;
  analyzeAllStatus(caseId: string): Promise<AnalyzeAllStatus>;
  patchComment(commentId: string, patch: CommentPatch): Promise<CommentItem>;
  agentReview(caseId: string): Promise<ReviewResponse>;
  agentAnswers(caseId: string, answers: AnswerItem[]): Promise<ReviewResponse>;
  downloadDocument(caseId: string, kind: DocumentKind): Promise<{ blob: Blob; filename: string }>;
}
