import { FolderOpen, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Button, Card, ConfirmModal, Disclaimer, EmptyState, ErrorBox, LoadingBlock, PageHeader, inputCls } from '../components/common';
import { errMessage, formatKst } from '../lib/format';
import type { CaseSummary } from '../types';

export default function CasesPage() {
  const [cases, setCases] = useState<CaseSummary[] | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [target, setTarget] = useState<CaseSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setListError(null);
    try {
      setCases(await api.listCases());
    } catch (e) {
      setListError(errMessage(e));
      setCases([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function create() {
    if (!title.trim()) return setError('사건 제목을 입력해 주세요.');
    setBusy(true);
    setError(null);
    try {
      await api.createCase({ title: title.trim(), description: description.trim() });
      setTitle('');
      setDescription('');
      await load();
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!target) return;
    setDeleting(true);
    try {
      await api.deleteCase(target.id);
      setTarget(null);
      await load();
    } catch (e) {
      setTarget(null);
      setError(errMessage(e));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader title="내 사건" desc="사건마다 댓글, 판독 결과, 증거를 따로 보관합니다." />

      <Card className="space-y-3">
        <h2 className="font-semibold">새 사건 만들기</h2>
        <input className={inputCls} placeholder="사건 제목" value={title} onChange={(e) => setTitle(e.target.value)} aria-label="사건 제목" />
        <textarea className={`${inputCls} min-h-20`} placeholder="사건 설명 (선택)" value={description} onChange={(e) => setDescription(e.target.value)} aria-label="사건 설명" />
        <Button className="w-full sm:w-auto" busy={busy} busyLabel="만드는 중…" onClick={() => void create()}>
          <Plus className="h-4 w-4" aria-hidden />
          사건 만들기
        </Button>
        <ErrorBox message={error} onClose={() => setError(null)} />
      </Card>

      <section className="space-y-2">
        <h2 className="font-semibold">사건 목록</h2>
        <ErrorBox message={listError} onRetry={() => void load()} />
        {cases === null && <LoadingBlock />}
        {cases?.length === 0 && !listError && (
          <EmptyState icon={<FolderOpen className="h-5 w-5" aria-hidden />} title="아직 사건이 없습니다" desc="위에서 첫 사건을 만들어 보세요." />
        )}
        <ul className="grid gap-3 sm:grid-cols-2">
          {cases?.map((c) => (
            <li key={c.id} className="flex items-stretch gap-2 rounded-2xl border border-ink-200 bg-white p-3 shadow-sm">
              <Link to={`/cases/${c.id}`} className="min-w-0 flex-1 rounded-xl p-1 hover:bg-ink-50">
                <p className="truncate font-medium">{c.title}</p>
                <p className="mt-0.5 text-xs text-ink-500">{formatKst(c.created_at)}</p>
                <span className="mt-2 inline-block rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">증거 {c.saved_count}건</span>
              </Link>
              <button
                type="button"
                onClick={() => setTarget(c)}
                aria-label={`${c.title} 삭제`}
                className="flex h-11 w-11 shrink-0 items-center justify-center self-start rounded-xl text-ink-500 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      </section>
      <Disclaimer />

      <ConfirmModal
        open={target !== null}
        title="사건을 삭제할까요?"
        message={
          <>
            <p className="font-semibold text-ink-900">“{target?.title}”</p>
            <p className="mt-1">댓글, 판독 결과, 업로드한 원본 이미지가 모두 삭제되며 되돌릴 수 없습니다.</p>
          </>
        }
        busy={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setTarget(null)}
      />
    </div>
  );
}
