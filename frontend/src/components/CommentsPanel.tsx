import { Inbox } from 'lucide-react';
import { useState } from 'react';
import { api } from '../api';
import { errMessage } from '../lib/format';
import type { Analysis, AnalysisResult, CommentItem, Source } from '../types';
import CommentCard from './CommentCard';
import { Button, Disclaimer, EmptyState, ErrorBox, InfoBox, LevelBadge } from './common';

const MAX_BATCH = 20;

interface Props {
  caseId: string;
  comments: CommentItem[];
  sources: Source[];
  onChange: (comments: CommentItem[]) => void;
  onGoInput: () => void;
}

export default function CommentsPanel({ caseId, comments, sources, onChange, onGoInput }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const srcById = new Map(sources.map((s) => [s.id, s]));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function analyze() {
    const ids = [...selected];
    if (!ids.length) return setError('판독할 댓글을 선택해 주세요.');
    if (ids.length > MAX_BATCH) return setError(`한 번에 최대 ${MAX_BATCH}개까지 판독할 수 있습니다.`);
    setBusy(true);
    setError(null);
    try {
      const { results } = await api.analyze(caseId, ids);
      const byId = new Map<string, AnalysisResult>(results.map((r) => [r.comment_id, r]));
      onChange(
        comments.map((c) => {
          const r = byId.get(c.id);
          if (!r) return c;
          const { comment_id: _omit, ...analysis } = r;
          void _omit;
          return { ...c, analysis: analysis as Analysis };
        }),
      );
      setSelected(new Set());
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: string, p: Parameters<typeof api.patchComment>[1]) {
    setError(null);
    try {
      const updated = await api.patchComment(id, p);
      onChange(comments.map((c) => (c.id === id ? { ...c, ...updated, analysis: updated.analysis ?? c.analysis } : c)));
    } catch (e) {
      setError(errMessage(e));
    }
  }

  const manual = sources.filter((s) => s.needs_manual_input);
  const analyzed = comments.filter((c) => c.analysis);
  const count = (lv: string) => analyzed.filter((c) => c.analysis?.level === lv).length;

  return (
    <div className="space-y-3">
      {manual.map((s) => (
        <InfoBox key={s.id} tone="warn">
          {s.url ? `${s.url} — ` : ''}
          {s.message ?? '자동 수집이 되지 않았습니다. 텍스트나 스크린샷으로 직접 입력해 주세요.'}
        </InfoBox>
      ))}

      {comments.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-5 w-5" aria-hidden />}
          title="아직 댓글이 없습니다"
          desc="텍스트, 스크린샷, 게시물 주소 중 하나로 댓글을 넣어 주세요."
          action={<Button onClick={onGoInput}>댓글 입력하러 가기</Button>}
        />
      ) : (
        <>
          <div className="sticky top-16 z-10 flex flex-wrap items-center justify-between gap-2 card card-compact !p-3 md:top-2">
            <span className="text-sm text-ink-600">
              댓글 {comments.length}개 · <b className="text-ink-900">{selected.size}개 선택</b> (최대 {MAX_BATCH})
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelected(selected.size ? new Set() : new Set(comments.slice(0, MAX_BATCH).map((c) => c.id)))}
              >
                {selected.size ? '선택 해제' : '전체 선택'}
              </Button>
              <Button size="sm" busy={busy} busyLabel="판독 중…" disabled={!selected.size} onClick={() => void analyze()}>
                AI 판독
              </Button>
            </div>
          </div>

          {analyzed.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-ink-600">
              판독 완료 {analyzed.length}개
              <span className="flex items-center gap-1">
                <LevelBadge level="legal_review" /> {count('legal_review')}
              </span>
              <span className="flex items-center gap-1">
                <LevelBadge level="needs_context" /> {count('needs_context')}
              </span>
              <span className="flex items-center gap-1">
                <LevelBadge level="low_risk" /> {count('low_risk')}
              </span>
            </div>
          )}
        </>
      )}

      <ErrorBox message={error} onClose={() => setError(null)} />

      <ul className="space-y-3">
        {comments.map((c) => (
          <CommentCard
            key={c.id}
            c={c}
            variant="extract"
            source={srcById.get(c.source_id)}
            checked={selected.has(c.id)}
            onToggle={() => toggle(c.id)}
            onPatch={(p) => patch(c.id, p)}
          />
        ))}
      </ul>
      <Disclaimer />
    </div>
  );
}
