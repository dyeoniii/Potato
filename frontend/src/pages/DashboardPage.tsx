import { ArrowRight, FolderOpen, ScanSearch } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { Card, Disclaimer, EmptyState, ErrorBox, LoadingBlock, PageHeader } from '../components/common';
import { errMessage, formatKst } from '../lib/format';
import type { CaseSummary } from '../types';

const STEPS = [
  { n: 1, title: '사건 만들기', desc: '정리할 일의 제목을 정합니다.' },
  { n: 2, title: '댓글 입력', desc: '텍스트, 스크린샷, 게시물 주소로 댓글을 가져옵니다.' },
  { n: 3, title: 'AI 판독', desc: '고른 댓글의 위험 신호를 확인합니다.' },
  { n: 4, title: '증거함 저장', desc: '필요한 댓글만 골라 메모와 함께 보관합니다.' },
  { n: 5, title: 'PDF 받기', desc: '사건 경위서와 증거 목록을 내려받습니다.' },
];

export default function DashboardPage() {
  const [cases, setCases] = useState<CaseSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
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

  const totalEvidence = cases?.reduce((n, c) => n + c.saved_count, 0) ?? 0;
  const recent = cases ? [...cases].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5) : [];

  return (
    <div className="space-y-6">
      <PageHeader title="안녕하세요 👋" desc="악성 댓글을 확인하고 증거를 정리해 보세요." />

      <section className="flex flex-col items-start gap-4 rounded-2xl bg-brand-600 p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="text-lg font-bold">악플 판독 시작하기</h2>
          <p className="mt-1 text-sm text-brand-100">댓글을 입력하면 AI가 위험 신호를 알려 드립니다.</p>
        </div>
        <Link
          to="/analyze"
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-brand-700 hover:bg-brand-50"
        >
          <ScanSearch className="h-4 w-4" aria-hidden />
          판독 시작
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>

      <ErrorBox message={error} onRetry={() => void load()} />

      <div className="grid grid-cols-2 gap-3">
        <Stat label="전체 사건" value={cases === null ? null : cases.length} />
        <Stat label="저장된 증거" value={cases === null ? null : totalEvidence} />
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">최근 사건</h2>
          <Link to="/cases" className="text-sm font-semibold text-brand-600">
            전체 보기
          </Link>
        </div>
        {cases === null && <LoadingBlock />}
        {cases && cases.length === 0 && !error && (
          <EmptyState
            icon={<FolderOpen className="h-5 w-5" aria-hidden />}
            title="아직 사건이 없습니다"
            desc="판독을 시작하면 사건이 만들어지고, 저장한 증거가 이곳에 모입니다."
          />
        )}
        <ul className="space-y-2">
          {recent.map((c) => (
            <li key={c.id}>
              <Link to={`/cases/${c.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-ink-200 bg-white p-4 shadow-sm hover:border-brand-300">
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.title}</p>
                  <p className="text-xs text-ink-500">{formatKst(c.created_at)}</p>
                </div>
                <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">증거 {c.saved_count}건</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <Card>
        <h2 className="font-semibold">이렇게 사용하세요</h2>
        <ol className="mt-3 grid gap-3 sm:grid-cols-2">
          {STEPS.map((s) => (
            <li key={s.n} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">{s.n}</span>
              <div>
                <p className="text-sm font-semibold">{s.title}</p>
                <p className="text-sm text-ink-500">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-4 rounded-xl bg-ink-50 p-3 text-xs leading-relaxed text-ink-500">
          유튜브 주소만 댓글을 자동으로 가져옵니다. 다른 SNS는 주소를 출처로 저장하고, 댓글은 텍스트나 스크린샷으로 직접 넣어 주세요.
        </p>
      </Card>
      <Disclaimer />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <Card>
      <p className="text-sm text-ink-500">{label}</p>
      {value === null ? <div className="mt-1 h-9 w-12 animate-pulse rounded-lg bg-ink-100" aria-label="불러오는 중" /> : <p className="mt-1 text-3xl font-bold text-ink-900">{value}</p>}
    </Card>
  );
}
