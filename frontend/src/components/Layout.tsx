import { FolderOpen, House, ScanSearch, ShieldCheck } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { USE_MOCK } from '../api';

const NAV = [
  { to: '/', label: '홈', icon: House, end: true },
  { to: '/analyze', label: '악플 판독', icon: ScanSearch, end: false },
  { to: '/cases', label: '내 사건', icon: FolderOpen, end: false },
];

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2 text-lg font-extrabold text-ink-900">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-white">
        <ShieldCheck className="h-5 w-5" aria-hidden />
      </span>
      악플가드
    </Link>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      {/* 데스크톱 사이드바 */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-ink-200 bg-white p-4 md:flex">
        <div className="px-2 py-2">
          <Logo />
        </div>
        <nav aria-label="주 메뉴" className="mt-6 space-y-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50'
                }`
              }
            >
              <Icon className="h-5 w-5" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto space-y-2 rounded-xl bg-ink-50 p-3 text-xs leading-relaxed text-ink-500">
          <p>⚖️ AI 분석은 법률 자문이 아닙니다.</p>
          {USE_MOCK && <p className="font-semibold text-amber-700">목 데이터 모드</p>}
        </div>
      </aside>

      {/* 모바일 상단 바 */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
        <Logo />
        {USE_MOCK && <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">목 모드</span>}
      </header>

      <main className="md:pl-60">
        <div className="mx-auto max-w-4xl space-y-5 px-4 py-5 pb-28 md:px-8 md:py-8 md:pb-10">
          {USE_MOCK && (
            <p className="hidden rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 md:block">
              목 데이터 모드입니다. 실제 서버와 통신하지 않으며 판독 결과는 실제 AI 분석이 아닙니다.
            </p>
          )}
          {children}
        </div>
      </main>

      {/* 모바일 하단 내비게이션 */}
      <nav aria-label="하단 메뉴" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-ink-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-semibold ${isActive ? 'text-brand-700' : 'text-ink-500'}`}
          >
            <Icon className="h-5 w-5" aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
