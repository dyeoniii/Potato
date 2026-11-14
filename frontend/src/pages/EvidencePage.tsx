import { Archive } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import CommentCard from '../components/CommentCard';
import { Disclaimer, EmptyState, ErrorBox, LoadingBlock, PageHeader, SectionTitle } from '../components/common';
import { useCaseDetails } from '../lib/useCaseDetails';
import { errMessage } from '../lib/format';
import { useState } from 'react';
import type { CaseDetail } from '../types';

/** 모든 사건의 저장된 증거를 한곳에서 봅니다. 기존 listCases/getCase/patchComment만 사용합니다. */
export default function EvidencePage() {
  const { summaries, details, error, loading, reload, setDetails } = useCaseDetails(30);
  const [actionError, setActionError] = useState<string | null>(null);

  const groups = details.filter((d) => d.comments.some((c) => c.saved));
  const total = groups.reduce((n, d) => n + d.comments.filter((c) => c.saved).length, 0);

  async function patch(d: CaseDetail, id: string, p: Parameters<typeof api.patchComment>[1]) {
    setActionError(null);
    try {
      const updated = await api.patchComment(id, p);
      setDetails(
        details.map((x) =>
          x.id === d.id ? { ...x, comments: x.comments.map((c) => (c.id === id ? { ...c, ...updated, analysis: updated.analysis ?? c.analysis } : c)) } : x,
        ),
      );
    } catch (e) {
      setActionError(errMessage(e));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="내 증거함" desc={`모든 사건에서 저장한 증거를 모아 봅니다.${loading ? '' : ` 현재 ${total}건`}`} />
      <ErrorBox message={error} onRetry={() => void reload()} />
      <ErrorBox message={actionError} onClose={() => setActionError(null)} />
      {loading && <LoadingBlock />}
      {!loading && groups.length === 0 && !error && (
        <EmptyState
          icon={<Archive className="h-5 w-5" aria-hidden />}
          title="저장된 증거가 없습니다"
          desc="사건의 판독 탭에서 보관할 댓글을 ‘증거함에 저장’해 주세요."
          action={
            <Link to={summaries && summaries.length ? '/cases' : '/analyze'} className="btn btn-primary">
              {summaries && summaries.length ? '내 사건 보기' : '악플 판독 시작하기'}
            </Link>
          }
        />
      )}
      {groups.map((d) => (
        <section key={d.id} className="space-y-3">
          <SectionTitle
            action={
              <Link to={`/cases/${d.id}`} className="text-sm font-semibold text-brand-700">
                사건 열기
              </Link>
            }
          >
            {d.title}
          </SectionTitle>
          <ul className="space-y-3">
            {d.comments
              .filter((c) => c.saved)
              .map((c) => (
                <CommentCard key={c.id} c={c} variant="evidence" source={d.sources.find((s) => s.id === c.source_id)} onPatch={(p) => patch(d, c.id, p)} />
              ))}
          </ul>
        </section>
      ))}
      <Disclaimer />
    </div>
  );
}
