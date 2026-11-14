import { Archive, FolderOpen, LayoutDashboard, ScanSearch, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { USE_MOCK } from '../api';

const NAV = [
  { to: '/', label: '대시보드', short: '홈', icon: LayoutDashboard, end: true },
  { to: '/analyze', label: '새 악플 판독', short: '판독', icon: ScanSearch, end: false },
  { to: '/cases', label: '내 사건 관리', short: '사건', icon: FolderOpen, end: false },
  { to: '/evidence', label: '내 증거함', short: '증거함', icon: Archive, end: false },
];

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5 text-lg font-extrabold text-ink-900">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
        <ShieldCheck className="h-5 w-5" aria-hidden />
      </span>
      악플가드
    </Link>
  );
}

function DisclaimerPill() {
  return (
    <p className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-800 shadow-card">
      <span aria-hidden>⚖️</span> AI 분석은 법률 자문이 아닙니다
    </p>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-canvas">
      {/* 데스크톱: 좌측 화이트 사이드바 */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-brand-100 bg-white px-4 py-6 md:flex">
        <div className="px-2">
          <Logo />
        </div>
        <nav aria-label="주 메뉴" className="mt-8 space-y-1.5">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-h-12 items-center gap-3 rounded-xl px-3.5 text-[15px] font-semibold transition-colors ${
                  isActive ? 'bg-brand-100 text-brand-800' : 'text-ink-700 hover:bg-brand-50'
                }`
              }
            >
              <Icon className="h-5 w-5" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl bg-brand-50 p-4 text-xs leading-relaxed text-ink-700">
          <p className="font-semibold text-brand-800">알려 드립니다</p>
          <p className="mt-1">판독 결과는 위험 신호를 알려 주는 참고 정보이며, 고소 가능 여부나 결과를 보장하지 않습니다.</p>
        </div>
      </aside>

      {/* 모바일 상단 헤더 */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-brand-100 bg-white px-4 py-3 md:hidden">
        <Logo />
        {USE_MOCK && <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">목 모드</span>}
      </header>

      <main className="md:pl-64">
        <div className="mx-auto max-w-5xl px-4 py-5 pb-28 md:px-8 md:py-7 md:pb-10">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2 md:mb-6">
            <DisclaimerPill />
            {USE_MOCK && (
              <span className="hidden rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 md:inline-block">
                목 데이터 모드 · 실제 서버·AI 분석이 아닙니다
              </span>
            )}
          </div>
          <div className="space-y-6">{children}</div>
        </div>
      </main>

      {/* 모바일 하단 내비게이션 */}
      <nav aria-label="하단 메뉴" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-brand-100 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV.map(({ to, short, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-semibold ${isActive ? 'text-brand-700' : 'text-ink-600'}`}
          >
            {({ isActive }) => (
              <>
                <span className={`flex h-7 w-12 items-center justify-center rounded-full ${isActive ? 'bg-brand-100' : ''}`}>
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                {short}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
