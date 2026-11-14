import { ChevronRight, Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Badge, Button, Card, ErrorBox, LoadingBlock, PageHeader, SectionTitle, inputCls } from '../components/common';
import { errMessage, formatKst } from '../lib/format';
import type { CaseSummary } from '../types';

/** 어떤 사건에 댓글을 넣을지 고른 뒤 사건 상세의 입력 탭으로 이동합니다. */
export default function AnalyzePage() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<CaseSummary[] | null>(null);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setCases(await api.listCases());
    } catch (e) {
      setError(errMessage(e));
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
      const c = await api.createCase({ title: title.trim(), description: '' });
      navigate(`/cases/${c.id}`);
    } catch (e) {
      setError(errMessage(e));
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="새 악플 판독" desc="댓글을 정리할 사건을 정하면 입력 화면으로 이동해요." />

      <Card className="space-y-3">
        <SectionTitle>새 사건으로 시작</SectionTitle>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className={`${inputCls} sm:flex-1`}
            placeholder="사건 제목 (예: 게시물 A 비방 댓글)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !busy && void create()}
            aria-label="사건 제목"
          />
          <Button className="shrink-0" busy={busy} busyLabel="만드는 중…" onClick={() => void create()}>
            <Plus className="h-4 w-4" aria-hidden />
            사건 만들고 시작
          </Button>
        </div>
        <ErrorBox message={error} onClose={() => setError(null)} onRetry={cases?.length === 0 ? () => void load() : undefined} />
      </Card>

      <section className="space-y-3">
        <SectionTitle>기존 사건에 추가</SectionTitle>
        {cases === null && <LoadingBlock />}
        {cases?.length === 0 && !error && <p className="rounded-2xl border border-dashed border-brand-300 bg-white p-4 text-sm text-ink-600">아직 사건이 없어요. 위에서 새 사건을 만들어 주세요.</p>}
        <ul className="grid gap-3 md:grid-cols-2">
          {cases?.map((c) => (
            <li key={c.id}>
              <button type="button" onClick={() => navigate(`/cases/${c.id}`)} className="card card-hover card-compact flex w-full items-center justify-between gap-3 text-left">
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{c.title}</span>
                  <span className="mt-0.5 block text-xs text-ink-600">{formatKst(c.created_at)}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <Badge>증거 {c.saved_count}건</Badge>
                  <ChevronRight className="h-4 w-4 text-ink-600" aria-hidden />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
