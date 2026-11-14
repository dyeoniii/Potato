import { ChevronLeft, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api';
import CommentsPanel from '../components/CommentsPanel';
import DocumentsPanel from '../components/DocumentsPanel';
import EvidencePanel from '../components/EvidencePanel';
import InputPanel from '../components/InputPanel';
import ReviewPanel from '../components/ReviewPanel';
import { Button, Card, ConfirmModal, ErrorBox, InfoBox, LoadingBlock, TabBar, type TabItem } from '../components/common';
import { errMessage, formatKst } from '../lib/format';
import type { CaseDetail, CommentItem, InputResponse } from '../types';

type Tab = 'input' | 'comments' | 'evidence' | 'review' | 'docs';

export default function CaseDetailPage() {
  const { id = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const sharedUrl = (location.state as { sharedUrl?: string } | null)?.sharedUrl ?? '';
  const [tab, setTab] = useState<Tab>('input');
  const [data, setData] = useState<CaseDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await api.getCase(id));
    } catch (e) {
      setError(errMessage(e));
    }
  }, [id]);

  useEffect(() => {
    setData(null);
    void load();
  }, [load]);

  function onInput(res: InputResponse) {
    setData((d) => (d ? { ...d, sources: [...d.sources, res.source], comments: [...d.comments, ...res.comments] } : d));
    if (res.comments.length > 0) setTab('comments');
  }

  const setComments = (comments: CommentItem[]) => setData((d) => (d ? { ...d, comments } : d));

  async function remove() {
    setDeleting(true);
    try {
      await api.deleteCase(id);
      navigate('/cases', { replace: true });
    } catch (e) {
      setConfirmDelete(false);
      setError(errMessage(e));
      setDeleting(false);
    }
  }

  if (error && !data) {
    return (
      <div className="space-y-3">
        <ErrorBox message={error} onRetry={() => void load()} />
        <Button variant="ghost" onClick={() => navigate('/cases')}>
          사건 목록으로
        </Button>
      </div>
    );
  }
  if (!data) return <LoadingBlock />;

  const savedCount = data.comments.filter((c) => c.saved).length;
  const tabs: TabItem<Tab>[] = [
    { key: 'input', label: '입력' },
    { key: 'comments', label: '판독', count: data.comments.length },
    { key: 'evidence', label: '증거함', count: savedCount },
    { key: 'review', label: '보완' },
    { key: 'docs', label: '문서' },
  ];

  return (
    <div className="space-y-5">
      <Card className="space-y-2">
        <Link to="/cases" className="inline-flex items-center text-sm font-semibold text-brand-700">
          <ChevronLeft className="h-4 w-4" aria-hidden />
          사건 목록
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="break-words text-xl font-extrabold sm:text-2xl">{data.title}</h1>
            {data.description && <p className="mt-1 text-sm text-ink-600">{data.description}</p>}
            <p className="mt-1 text-xs text-ink-600">
              {formatKst(data.created_at)} · 댓글 {data.comments.length}개 · 증거 {savedCount}건
            </p>
          </div>
          <Button variant="danger" size="sm" className="shrink-0" onClick={() => setConfirmDelete(true)} aria-label="사건 삭제">
            <Trash2 className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">삭제</span>
          </Button>
        </div>
        <ErrorBox message={error} onClose={() => setError(null)} />
      </Card>

      <TabBar label="사건 메뉴" items={tabs} value={tab} onChange={setTab} />

      {tab === 'input' && (
        <>
          {sharedUrl && <InfoBox>공유받은 주소를 채웠습니다. 내용을 확인한 뒤 직접 “댓글 가져오기”를 눌러 주세요.</InfoBox>}
          <InputPanel caseId={data.id} initialUrl={sharedUrl} onDone={onInput} />
        </>
      )}
      {tab === 'comments' && (
        <CommentsPanel caseId={data.id} comments={data.comments} sources={data.sources} onChange={setComments} onGoInput={() => setTab('input')} />
      )}
      {tab === 'evidence' && <EvidencePanel comments={data.comments} sources={data.sources} onChange={setComments} onGoComments={() => setTab('comments')} />}
      {tab === 'review' && <ReviewPanel
          caseId={data.id}
          savedAnswers={data.answers}
          onSaved={(list) =>
            setData((d) => (d ? { ...d, answers: [...d.answers.filter((a) => !list.some((n) => n.question_id === a.question_id)), ...list] } : d))
          }
        />}
      {tab === 'docs' && <DocumentsPanel caseId={data.id} savedCount={savedCount} />}

      <ConfirmModal
        open={confirmDelete}
        title="사건을 삭제할까요?"
        message={
          <>
            <p className="font-semibold text-ink-900">“{data.title}”</p>
            <p className="mt-1">댓글 {data.comments.length}개, 판독 결과, 업로드한 원본 이미지가 모두 삭제되며 되돌릴 수 없습니다.</p>
          </>
        }
        busy={deleting}
        onConfirm={() => void remove()}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
