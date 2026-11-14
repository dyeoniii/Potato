import { Archive, FolderOpen, Info, LayoutDashboard, ScanSearch, ShieldCheck } from 'lucide-react';
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
    <Link to="/" className="flex items-center gap-2 text-base font-extrabold text-ink-900">
      <ShieldCheck className="h-6 w-6 text-brand-600" aria-hidden />
      악플가드
    </Link>
  );
}

function DisclaimerPill() {
  return (
    <p className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-800">
      <span aria-hidden>⚖️</span> AI 분석은 법률 자문이 아닙니다
    </p>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      {/* 데스크톱: 좌측 화이트 사이드바 (브랜드 / 메뉴 / 이용 안내) */}
      <aside className="fixed inset-y-0 left-0 hidden w-[248px] flex-col border-r border-ink-200 bg-white px-4 py-5 md:flex">
        <div className="px-2 pb-5 pt-1">
          <Logo />
        </div>
        <nav aria-label="주 메뉴" className="space-y-1">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="nav-item">
              <Icon className="h-5 w-5" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex gap-2.5 rounded-2xl bg-brand-50 p-3.5">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-700" aria-hidden />
          <div>
            <p className="text-sm font-bold text-ink-900">이용 안내</p>
            <p className="mt-0.5 text-xs leading-relaxed text-ink-700">AI 분석 결과는 참고용이며, 최종적인 법적 판단은 전문가의 검토가 필요해요.</p>
          </div>
        </div>
      </aside>

      {/* 모바일 상단 헤더 */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ink-200 bg-white px-4 py-3 md:hidden">
        <Logo />
        {USE_MOCK && <span className="badge badge-context">목 모드</span>}
      </header>

      <main className="md:pl-[248px]">
        <div className="mx-auto max-w-5xl px-4 py-5 pb-28 md:px-8 md:py-7 md:pb-10">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
            <DisclaimerPill />
            {USE_MOCK && <span className="badge badge-context hidden md:inline-flex">목 데이터 모드 · 실제 서버·AI 분석이 아닙니다</span>}
          </div>
          <div className="space-y-6">{children}</div>
        </div>
      </main>

      {/* 모바일 하단 내비게이션 */}
      <nav aria-label="하단 메뉴" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-ink-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {NAV.map(({ to, short, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="nav-bottom">
            <span className="nav-bottom-icon">
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            {short}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
