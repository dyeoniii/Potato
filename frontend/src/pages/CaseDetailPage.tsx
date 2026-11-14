import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import CommentsPanel from '../components/CommentsPanel';
import DocumentsPanel from '../components/DocumentsPanel';
import InputPanel from '../components/InputPanel';
import ReviewPanel from '../components/ReviewPanel';
import { Button, ErrorBox, InfoBox } from '../components/common';
import { errMessage, formatKst } from '../lib/format';
import type { CaseDetail, CommentItem, InputResponse } from '../types';

type Tab = 'input' | 'comments' | 'review' | 'docs';
const TABS: { key: Tab; label: string }[] = [
  { key: 'input', label: '입력' },
  { key: 'comments', label: '댓글' },
  { key: 'review', label: '보완' },
  { key: 'docs', label: '문서' },
];

export default function CaseDetailPage() {
  const { id = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const sharedUrl = (location.state as { sharedUrl?: string } | null)?.sharedUrl ?? '';
  const [tab, setTab] = useState<Tab>('input');
  const [data, setData] = useState<CaseDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(await api.getCase(id));
    } catch (e) {
      setError(errMessage(e));
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  function onInput(res: InputResponse) {
    setData((d) => (d ? { ...d, sources: [...d.sources, res.source], comments: [...d.comments, ...res.comments] } : d));
    if (res.comments.length > 0) setTab('comments');
  }

  const setComments = (comments: CommentItem[]) => setData((d) => (d ? { ...d, comments } : d));

  if (error && !data) {
    return (
      <div className="space-y-3">
        <ErrorBox message={error} />
        <Button variant="ghost" onClick={() => navigate('/')}>
          목록으로
        </Button>
      </div>
    );
  }
  if (!data) return <p className="text-sm text-slate-500">불러오는 중…</p>;

  const savedCount = data.comments.filter((c) => c.saved).length;

  return (
    <div className="space-y-4">
      <div>
        <Link to="/" className="text-sm text-indigo-600">
          ← 사건 목록
        </Link>
        <h2 className="mt-1 text-xl font-bold">{data.title}</h2>
        {data.description && <p className="text-sm text-slate-600">{data.description}</p>}
        <p className="text-xs text-slate-500">
          {formatKst(data.created_at)} · 댓글 {data.comments.length}개 · 증거 {savedCount}건
        </p>
      </div>

      <nav role="tablist" className="sticky top-0 z-20 grid grid-cols-4 gap-1 rounded-lg bg-slate-200 p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            type="button"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`min-h-10 rounded-md text-sm font-semibold ${tab === t.key ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-600'}`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'input' && (
        <>
          {sharedUrl && <InfoBox>공유받은 주소를 채웠습니다. 내용을 확인한 뒤 직접 “댓글 가져오기”를 눌러 주세요.</InfoBox>}
          <InputPanel caseId={data.id} initialUrl={sharedUrl} onDone={onInput} />
        </>
      )}
      {tab === 'comments' && <CommentsPanel caseId={data.id} comments={data.comments} sources={data.sources} onChange={setComments} />}
      {tab === 'review' && <ReviewPanel caseId={data.id} savedAnswers={data.answers} />}
      {tab === 'docs' && <DocumentsPanel caseId={data.id} savedCount={savedCount} />}
    </div>
  );
}
