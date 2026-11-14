import { Archive, ArrowRight, FileSearch, FolderOpen, ScanSearch, Scale } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Card, Disclaimer, EmptyState, ErrorBox, LevelBadge, SectionTitle, Skeleton } from '../components/common';
import { formatKst } from '../lib/format';
import { useCaseDetails } from '../lib/useCaseDetails';
import { LEVEL_LABEL, type RiskLevel } from '../types';

const STEPS = [
  { title: '사건 만들기', desc: '정리할 일의 제목을 정합니다.' },
  { title: '댓글 입력', desc: '텍스트, 스크린샷, 게시물 주소로 가져옵니다.' },
  { title: 'AI 판독', desc: '고른 댓글의 위험 신호를 확인합니다.' },
  { title: '증거함 저장', desc: '필요한 댓글만 메모와 함께 보관합니다.' },
  { title: 'PDF 받기', desc: '사건 경위서와 증거 목록을 내려받습니다.' },
];

const BAR: Record<RiskLevel, string> = {
  legal_review: 'bg-red-500',
  needs_context: 'bg-amber-500',
  low_risk: 'bg-emerald-500',
};

export default function DashboardPage() {
  const { summaries, details, error, loading, reload } = useCaseDetails(10);

  const totalEvidence = summaries?.reduce((n, c) => n + c.saved_count, 0) ?? 0;
  const recent = summaries ? [...summaries].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 5) : [];
  const analyzed = details.flatMap((d) => d.comments.filter((c) => c.analysis).map((c) => ({ c, title: d.title, caseId: d.id })));
  const count = (lv: RiskLevel) => analyzed.filter((x) => x.c.analysis?.level === lv).length;
  const levels: RiskLevel[] = ['legal_review', 'needs_context', 'low_risk'];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold text-brand-700">안녕하세요 👋</p>
        <h1 className="mt-0.5 text-2xl font-extrabold text-ink-900">악플가드 대시보드</h1>
        <p className="mt-1 text-sm text-ink-600">악성 댓글을 확인하고, 증거를 정리하고, 대응 문서를 준비하세요.</p>
      </div>

      <section className="flex flex-col items-start gap-4 rounded-2xl bg-brand-700 p-5 text-white shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="text-lg font-bold">악플 판독 시작하기</h2>
          <p className="mt-1 text-sm text-brand-100">댓글을 입력하면 AI가 위험 신호를 알려 드립니다. 결정은 사용자가 합니다.</p>
        </div>
        <Link to="/analyze" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-brand-800 hover:bg-brand-50">
          <ScanSearch className="h-4 w-4" aria-hidden />
          판독 시작하기
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </section>

      <ErrorBox message={error} onRetry={() => void reload()} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={<FolderOpen className="h-5 w-5" aria-hidden />} label="전체 사건" value={loading ? null : summaries!.length} note="만든 사건" />
        <Stat icon={<Archive className="h-5 w-5" aria-hidden />} label="저장된 증거" value={loading ? null : totalEvidence} note="증거함에 저장한 댓글" />
        <Stat icon={<FileSearch className="h-5 w-5" aria-hidden />} label="판독한 댓글" value={loading ? null : analyzed.length} note="최근 사건 10개 기준" />
        <Stat icon={<Scale className="h-5 w-5" aria-hidden />} label="법적 검토 필요" value={loading ? null : count('legal_review')} note="최근 사건 10개 기준" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="space-y-3">
            <SectionTitle
              action={
                <Link to="/cases" className="text-sm font-semibold text-brand-700">
                  전체 보기
                </Link>
              }
            >
              최근 사건
            </SectionTitle>
            {loading && <Skeleton className="h-16 !bg-ink-100" />}
            {!loading && recent.length === 0 && !error && (
              <EmptyState icon={<FolderOpen className="h-5 w-5" aria-hidden />} title="아직 사건이 없습니다" desc="판독을 시작하면 사건이 만들어지고, 저장한 증거가 이곳에 모입니다." />
            )}
            <ul className="space-y-2">
              {recent.map((c) => (
                <li key={c.id}>
                  <Link to={`/cases/${c.id}`} className="flex items-center justify-between gap-3 rounded-xl bg-brand-50 p-3.5 hover:bg-brand-100">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{c.title}</span>
                      <span className="block text-xs text-ink-600">{formatKst(c.created_at)}</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-brand-800">증거 {c.saved_count}건</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="space-y-3">
            <SectionTitle>최근 판독 결과</SectionTitle>
            {loading && <Skeleton className="h-16 !bg-ink-100" />}
            {!loading && analyzed.length === 0 && <p className="rounded-xl bg-ink-50 p-4 text-sm text-ink-600">아직 판독한 댓글이 없습니다. 판독을 시작해 보세요.</p>}
            <ul className="space-y-2">
              {analyzed.slice(0, 4).map(({ c, title, caseId }) => (
                <li key={c.id}>
                  <Link to={`/cases/${caseId}`} className="block rounded-xl border border-ink-200 p-3.5 hover:border-brand-300">
                    <div className="flex items-center justify-between gap-2">
                      <LevelBadge level={c.analysis!.level} label={c.analysis!.level_label} />
                      <span className="truncate text-xs text-ink-600">{title}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 break-words text-sm">{c.content}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="space-y-3">
            <SectionTitle>판독 결과 분포</SectionTitle>
            {analyzed.length === 0 ? (
              <p className="text-sm text-ink-600">판독 결과가 생기면 단계별 개수가 표시됩니다.</p>
            ) : (
              <ul className="space-y-3">
                {levels.map((lv) => (
                  <li key={lv}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{LEVEL_LABEL[lv]}</span>
                      <span className="font-bold">{count(lv)}</span>
                    </div>
                    <div className="mt-1 h-2 overflow-hidden rounded-full bg-ink-100">
                      <div className={`h-full rounded-full ${BAR[lv]}`} style={{ width: `${(count(lv) / analyzed.length) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-ink-600">AI가 알려 주는 위험 신호이며 범죄 성립 여부를 뜻하지 않습니다.</p>
          </Card>

          <Card>
            <SectionTitle>이렇게 사용하세요</SectionTitle>
            <ol className="mt-3 space-y-3">
              {STEPS.map((s, i) => (
                <li key={s.title} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">{i + 1}</span>
                  <div>
                    <p className="text-sm font-semibold">{s.title}</p>
                    <p className="text-sm text-ink-600">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-4 rounded-xl bg-brand-50 p-3 text-xs leading-relaxed text-ink-700">
              유튜브 주소만 댓글을 자동으로 가져옵니다. 다른 SNS는 주소를 출처로 저장하고, 댓글은 텍스트나 스크린샷으로 직접 넣어 주세요.
            </p>
          </Card>
        </div>
      </div>
      <Disclaimer />
    </div>
  );
}

function Stat({ icon, label, value, note }: { icon: ReactNode; label: string; value: number | null; note: string }) {
  return (
    <Card className="!p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-ink-700">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700">{icon}</span>
        {label}
      </div>
      {value === null ? <div className="mt-3 h-9 w-12 animate-pulse rounded-lg bg-ink-100" aria-label="불러오는 중" /> : <p className="mt-3 text-3xl font-extrabold text-ink-900">{value}</p>}
      <p className="mt-1 text-xs text-ink-600">{note}</p>
    </Card>
  );
}
