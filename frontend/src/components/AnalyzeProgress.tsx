import type { AnalyzeAllStatus } from '../types';
import { Button, Card, ErrorBox, InfoBox } from './common';

interface Props {
  status: AnalyzeAllStatus | null;
  error: string | null;
  onCloseError: () => void;
  onStart: () => void;
}

/** 전체 자동 판독 진행률. 진행 중이거나 판독이 덜 끝났을 때만 보입니다. */
export default function AnalyzeProgress({ status, error, onCloseError, onStart }: Props) {
  if (!status) return <ErrorBox message={error} onClose={onCloseError} />;
  const percent = status.total ? Math.floor((status.analyzed / status.total) * 100) : 0;
  const unfinished = !status.running && status.pending > 0;
  if (!status.running && !unfinished && !error) return null;
  return (
    <Card className="space-y-2">
      {status.running ? (
        <>
          <div className="flex items-baseline justify-between gap-2 text-sm">
            <span className="font-semibold text-ink-900">AI가 전체 댓글을 자동 판독하고 있습니다</span>
            <span className="tabular-nums text-ink-600">
              {status.analyzed.toLocaleString()} / {status.total.toLocaleString()}개 ({percent}%)
            </span>
          </div>
          <div
            role="progressbar"
            aria-label="전체 자동 판독 진행률"
            aria-valuemin={0}
            aria-valuemax={status.total}
            aria-valuenow={status.analyzed}
            className="h-3 overflow-hidden rounded-full bg-brand-50"
          >
            <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${percent}%` }} />
          </div>
          <p className="text-xs text-ink-600">끝나기 전에도 위험 신호가 확인된 댓글부터 판독 탭에 나타납니다.</p>
        </>
      ) : (
        unfinished && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-ink-900">
              판독하지 않은 댓글이 <b>{status.pending.toLocaleString()}개</b> 남아 있습니다.
            </p>
            <Button className="min-h-10 px-3" onClick={onStart}>
              {status.analyzed > 0 ? '이어서 판독' : '전체 자동 판독'}
            </Button>
          </div>
        )
      )}
      {status.message && <InfoBox tone="warn">{status.message}</InfoBox>}
      {!status.running && status.error && <ErrorBox message={status.error} />}
      <ErrorBox message={error} onClose={onCloseError} />
    </Card>
  );
}
