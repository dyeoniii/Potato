// docs/api-contract.md v2 기준 타입
export type SourceType = 'youtube' | 'text' | 'image' | 'url_only';
export type RiskLevel = 'legal_review' | 'needs_context' | 'low_risk';

export interface Source {
  id: string;
  type: SourceType;
  url: string | null;
  file_sha256: string | null;
  collected_at: string;
  needs_manual_input: boolean;
  message: string | null;
}

export interface Analysis {
  level: RiskLevel;
  level_label: string;
  issues: string[];
  flagged_phrases: string[];
  reason: string;
  check_points: string[];
  disclaimer: string;
}

export interface AnalysisResult extends Analysis {
  comment_id: string;
}

export interface CommentItem {
  id: string;
  source_id: string;
  author: string | null;
  content: string;
  posted_at: string | null;
  comment_url: string | null;
  platform: string;
  like_count: number | null;
  parent_id: string | null;
  saved: boolean;
  user_note: string | null;
  user_confirmed: boolean;
  analysis?: Analysis | null;
}

export interface AnswerItem {
  question_id: string;
  answer: string;
}

export interface CaseSummary {
  id: string;
  title: string;
  created_at: string;
  saved_count: number;
}

export interface CaseDetail {
  id: string;
  title: string;
  description: string;
  created_at: string;
  sources: Source[];
  comments: CommentItem[];
  answers: AnswerItem[];
}

export interface InputResponse {
  source: Source;
  comments: CommentItem[];
}

export interface ChecklistItem {
  item: string;
  status: 'ok' | 'partial' | 'missing' | string;
  detail: string;
}

export interface ReviewResponse {
  completeness: number;
  checklist: ChecklistItem[];
  questions: { id: string; question: string }[];
}

export interface CommentPatch {
  saved?: boolean;
  user_note?: string | null;
  user_confirmed?: boolean;
}

export type DocumentKind = 'statement' | 'evidence-list';

export const LEVEL_LABEL: Record<RiskLevel, string> = {
  legal_review: '법적 검토 필요',
  needs_context: '추가 맥락 확인 필요',
  low_risk: '위험 신호 낮음',
};

export const DISCLAIMER = 'AI 분석은 법률 자문이 아닙니다.';
