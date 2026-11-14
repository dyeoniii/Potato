import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, USE_MOCK } from '../api';
import { Button, Card, Disclaimer, ErrorBox, inputCls } from '../components/common';
import { errMessage, formatKst } from '../lib/format';
import type { CaseSummary } from '../types';

export default function CasesPage() {
  const [cases, setCases] = useState<CaseSummary[] | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
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

  async function remove(c: CaseSummary) {
    if (!window.confirm(`"${c.title}" 사건을 삭제할까요?\n댓글, 판독 결과, 업로드한 원본 이미지가 모두 삭제되며 되돌릴 수 없습니다.`)) return;
    try {
      await api.deleteCase(c.id);
      await load();
    } catch (e) {
      setError(errMessage(e));
    }
  }

  return (
    <div className="space-y-4">
      {USE_MOCK && <p className="rounded-lg bg-amber-50 p-2 text-xs text-amber-800">목 데이터 모드입니다. 실제 서버와 통신하지 않습니다.</p>}
      <Card className="space-y-3">
        <h2 className="font-semibold">새 사건 만들기</h2>
        <input className={inputCls} placeholder="사건 제목" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className={`${inputCls} min-h-20`} placeholder="사건 설명 (선택)" value={description} onChange={(e) => setDescription(e.target.value)} />
        <Button className="w-full" busy={busy} onClick={() => void create()}>
          사건 만들기
        </Button>
      </Card>

      <ErrorBox message={error} onClose={() => setError(null)} />

      <section>
        <h2 className="mb-2 font-semibold">내 사건</h2>
        {cases === null && <p className="text-sm text-slate-500">불러오는 중…</p>}
        {cases?.length === 0 && <p className="text-sm text-slate-500">아직 사건이 없습니다.</p>}
        <ul className="space-y-2">
          {cases?.map((c) => (
            <li key={c.id} className="flex items-center gap-2 rounded-xl border bg-white p-3 shadow-sm">
              <Link to={`/cases/${c.id}`} className="min-w-0 flex-1">
                <p className="truncate font-medium">{c.title}</p>
                <p className="text-xs text-slate-500">
                  증거 {c.saved_count}건 · {formatKst(c.created_at)}
                </p>
              </Link>
              <Button variant="danger" className="min-h-10 px-3" onClick={() => void remove(c)} aria-label={`${c.title} 삭제`}>
                삭제
              </Button>
            </li>
          ))}
        </ul>
      </section>
      <Disclaimer />
    </div>
  );
}
