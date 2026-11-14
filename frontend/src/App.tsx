import { Link, Route, Routes } from 'react-router-dom';
import CaseDetailPage from './pages/CaseDetailPage';
import CasesPage from './pages/CasesPage';
import ShareTargetPage from './pages/ShareTargetPage';

export default function App() {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-bold text-indigo-700">
            악플가드
          </Link>
          <span className="text-xs text-slate-500">AI 분석은 법률 자문이 아닙니다</span>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-4 pb-16">
        <Routes>
          <Route path="/" element={<CasesPage />} />
          <Route path="/cases/:id" element={<CaseDetailPage />} />
          <Route path="/share-target" element={<ShareTargetPage />} />
          <Route
            path="*"
            element={
              <p className="text-sm">
                페이지를 찾을 수 없습니다. <Link to="/" className="text-indigo-600">처음으로</Link>
              </p>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
