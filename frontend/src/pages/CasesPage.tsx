import { FolderOpen, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Button, Card, ConfirmModal, Disclaimer, EmptyState, ErrorBox, LoadingBlock, PageHeader, SectionTitle, inputCls } from '../components/common';
import { errMessage, formatKst } from '../lib/format';
import { useCaseDetails } from '../lib/useCaseDetails';
import type { CaseSummary } from '../types';

export default function CasesPage() {
  const { summaries: cases, details, error: listError, reload } = useCaseDetails(50);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [target, setTarget] = useState<CaseSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  const detailById = new Map(details.map((d) => [d.id, d]));
  const sorted = cases ? [...cases].sort((a, b) => b.created_at.localeCompare(a.created_at)) : null;

  async function create() {
    if (!title.trim()) return setError('사건 제목을 입력해 주세요.');
    setBusy(true);
    setError(null);
    try {
      await api.createCase({ title: title.trim(), description: description.trim() });
      setTitle('');
      setDescription('');
      await reload();
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
      await reload();
    } catch (e) {
      setTarget(null);
      setError(errMessage(e));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="내 사건 관리" desc="사건마다 댓글, 판독 결과, 증거를 따로 보관합니다." />

      <Card className="space-y-4">
        <SectionTitle>새 사건 만들기</SectionTitle>
        <div className="grid gap-3">
          <label className="block text-sm font-semibold text-ink-800">
            사건 제목
            <input className={`${inputCls} mt-1.5 font-normal`} placeholder="예: 게시물 A 비방 댓글" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="block text-sm font-semibold text-ink-800">
            사건 설명 (선택)
            <textarea className={`${inputCls} mt-1.5 min-h-20 font-normal`} placeholder="어떤 일이 있었는지 간단히 적어 주세요" value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
        </div>
        <Button className="w-full bg-brand-700 hover:bg-brand-800 sm:w-auto" busy={busy} busyLabel="만드는 중…" onClick={() => void create()}>
          <Plus className="h-4 w-4" aria-hidden />
          사건 만들기
        </Button>
        <ErrorBox message={error} onClose={() => setError(null)} />
      </Card>

      <section className="space-y-3">
        <SectionTitle>사건 목록 {sorted && <span className="text-sm font-medium text-ink-600">({sorted.length})</span>}</SectionTitle>
        <ErrorBox message={listError} onRetry={() => void reload()} />
        {cases === null && <LoadingBlock />}
        {sorted?.length === 0 && !listError && (
          <EmptyState icon={<FolderOpen className="h-5 w-5" aria-hidden />} title="아직 사건이 없습니다" desc="위에서 첫 사건을 만들어 보세요." />
        )}
        <ul className="grid gap-4 md:grid-cols-2">
          {sorted?.map((c) => {
            const d = detailById.get(c.id);
            return (
              <li key={c.id}>
                <Card className="flex h-full flex-col gap-3 !p-4">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold">{c.title}</h3>
                    <p className="mt-1 line-clamp-2 min-h-10 text-sm text-ink-600">{d ? d.description || '설명이 없습니다.' : '\u00a0'}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-xs font-semibold">
                    <span className="rounded-full bg-brand-100 px-2.5 py-1 text-brand-800">증거 {c.saved_count}건</span>
                    {d && <span className="rounded-full bg-ink-100 px-2.5 py-1 text-ink-700">댓글 {d.comments.length}개</span>}
                  </div>
                  <p className="text-xs text-ink-600">생성 {formatKst(c.created_at)}</p>
                  <div className="mt-auto flex gap-2 pt-1">
                    <Link
                      to={`/cases/${c.id}`}
                      className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-brand-700 text-sm font-semibold text-white hover:bg-brand-800"
                    >
                      상세 보기
                    </Link>
                    <Button variant="danger" onClick={() => setTarget(c)} aria-label={`${c.title} 삭제`}>
                      <Trash2 className="h-4 w-4" aria-hidden />
                      삭제
                    </Button>
                  </div>
                </Card>
              </li>
            );
          })}
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
