import { useState } from 'react';
import { api } from '../api';
import { errMessage, formatKst } from '../lib/format';
import type { Analysis, AnalysisResult, CommentItem, Source } from '../types';
import { Button, Card, Disclaimer, ErrorBox, InfoBox, LevelBadge, inputCls } from './common';

const MAX_BATCH = 20;

interface Props {
  caseId: string;
  comments: CommentItem[];
  sources: Source[];
  onChange: (comments: CommentItem[]) => void;
}

export default function CommentsPanel({ caseId, comments, sources, onChange }: Props) {
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
    if (!ids.length) return setError('분석할 댓글을 선택해 주세요.');
    if (ids.length > MAX_BATCH) return setError(`한 번에 최대 ${MAX_BATCH}개까지 분석할 수 있습니다.`);
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

  return (
    <div className="space-y-3">
      {manual.map((s) => (
        <InfoBox key={s.id} tone="warn">
          {s.url ? `${s.url} — ` : ''}
          {s.message ?? '자동 수집이 되지 않았습니다. 텍스트나 스크린샷으로 직접 입력해 주세요.'}
        </InfoBox>
      ))}

      {comments.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">아직 댓글이 없습니다. 입력 탭에서 댓글을 추가해 주세요.</p>
        </Card>
      ) : (
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 rounded-lg border bg-white/95 p-2 backdrop-blur">
          <span className="text-sm text-slate-600">{selected.size}개 선택 (최대 {MAX_BATCH})</span>
          <div className="flex gap-2">
            <Button variant="ghost" className="min-h-10 px-3" onClick={() => setSelected(new Set(comments.slice(0, MAX_BATCH).map((c) => c.id)))}>
              전체 선택
            </Button>
            <Button className="min-h-10 px-3" busy={busy} disabled={!selected.size} onClick={() => void analyze()}>
              AI 판독
            </Button>
          </div>
        </div>
      )}

      <ErrorBox message={error} onClose={() => setError(null)} />

      <ul className="space-y-3">
        {comments.map((c) => (
          <CommentCard
            key={c.id}
            c={c}
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

function CommentCard({
  c,
  source,
  checked,
  onToggle,
  onPatch,
}: {
  c: CommentItem;
  source?: Source;
  checked: boolean;
  onToggle: () => void;
  onPatch: (p: Parameters<typeof api.patchComment>[1]) => Promise<void>;
}) {
  const [note, setNote] = useState(c.user_note ?? '');
  const a = c.analysis;
  const origin = c.comment_url ?? source?.url ?? null;

  return (
    <li className={`rounded-xl border bg-white p-4 shadow-sm ${c.saved ? 'border-indigo-300' : 'border-slate-200'}`}>
      <label className="flex items-start gap-3">
        <input type="checkbox" className="mt-1 h-5 w-5 shrink-0" checked={checked} onChange={onToggle} aria-label="판독할 댓글 선택" />
        <div className="min-w-0 flex-1">
          <p className="whitespace-pre-wrap break-words text-sm">{c.content}</p>
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-xs text-slate-500">
            <dt>작성자</dt>
            <dd>{c.author ?? '확인되지 않음'}</dd>
            <dt>작성 시각</dt>
            <dd>{formatKst(c.posted_at)}</dd>
            <dt>출처</dt>
            <dd className="break-all">{origin ?? '확인되지 않음'}</dd>
            {source?.file_sha256 && (
              <>
                <dt>SHA-256</dt>
                <dd className="break-all font-mono">{source.file_sha256}</dd>
              </>
            )}
          </dl>
        </div>
      </label>

      {a && (
        <div className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <LevelBadge level={a.level} label={a.level_label} />
            {a.issues.map((i) => (
              <span key={i} className="rounded bg-slate-200 px-2 py-0.5 text-xs">
                {i}
              </span>
            ))}
          </div>
          {a.flagged_phrases.length > 0 && (
            <p>
              <span className="font-semibold">문제 표현: </span>
              {a.flagged_phrases.map((p) => `“${p}”`).join(', ')}
            </p>
          )}
          <p>{a.reason}</p>
          {a.check_points.length > 0 && (
            <ul className="list-disc pl-5 text-slate-700">
              {a.check_points.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
          <p className="text-xs text-slate-500">AI 추정입니다. {a.disclaimer}</p>
        </div>
      )}

      <div className="mt-3 space-y-2 border-t pt-3">
        <textarea
          className={`${inputCls} min-h-16`}
          placeholder="메모 (사용자 입력)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={() => note !== (c.user_note ?? '') && void onPatch({ user_note: note || null })}
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-5 w-5" checked={c.user_confirmed} onChange={(e) => void onPatch({ user_confirmed: e.target.checked })} />
          원본과 비교해 내용을 확인했습니다
        </label>
        <Button variant={c.saved ? 'ghost' : 'primary'} className="w-full" onClick={() => void onPatch({ saved: !c.saved })}>
          {c.saved ? '증거함에서 빼기' : '증거함에 저장'}
        </Button>
      </div>
    </li>
  );
}
