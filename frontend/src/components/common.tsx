import { CircleAlert, LoaderCircle, X } from 'lucide-react';
import { useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { DISCLAIMER, LEVEL_LABEL, type RiskLevel } from '../types';

const LEVEL_STYLE: Record<RiskLevel, string> = {
  legal_review: 'bg-red-50 text-red-700 border-red-200',
  needs_context: 'bg-amber-50 text-amber-800 border-amber-200',
  low_risk: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export function LevelBadge({ level, label }: { level: RiskLevel; label?: string }) {
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${LEVEL_STYLE[level]}`}>
      {label || LEVEL_LABEL[level]}
    </span>
  );
}

export function Disclaimer({ className = '' }: { className?: string }) {
  return (
    <p className={`text-xs leading-relaxed text-ink-500 ${className}`}>
      ⚖️ {DISCLAIMER} 고소 가능 여부나 결과를 보장하지 않습니다.
    </p>
  );
}

export function ErrorBox({ message, onClose, onRetry }: { message: string | null; onClose?: () => void; onRetry?: () => void }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1">{message}</span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="shrink-0 font-semibold underline">
          다시 시도
        </button>
      )}
      {onClose && (
        <button type="button" onClick={onClose} aria-label="닫기" className="shrink-0">
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}

export function InfoBox({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' }) {
  const cls = tone === 'warn' ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-brand-200 bg-brand-50 text-brand-800';
  return <div className={`rounded-xl border p-3 text-sm leading-relaxed ${cls}`}>{children}</div>;
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger';
  busy?: boolean;
  busyLabel?: string;
};

export function Button({ variant = 'primary', busy, busyLabel = '처리 중…', className = '', children, disabled, ...rest }: BtnProps) {
  const base =
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50';
  const v = {
    primary: 'bg-brand-600 text-white hover:bg-brand-700',
    ghost: 'border border-ink-200 bg-white text-ink-700 hover:bg-ink-50',
    danger: 'border border-red-200 bg-white text-red-600 hover:bg-red-50',
  }[variant];
  return (
    <button type="button" className={`${base} ${v} ${className}`} disabled={disabled || busy} aria-busy={busy || undefined} {...rest}>
      {busy && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />}
      {busy ? busyLabel : children}
    </button>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-ink-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}>{children}</section>;
}

export const inputCls =
  'w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100';

export function PageHeader({ title, desc, action }: { title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-ink-900 sm:text-2xl">{title}</h1>
        {desc && <p className="mt-1 text-sm text-ink-500">{desc}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, desc, action }: { icon?: ReactNode; title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-ink-300 bg-white px-4 py-10 text-center">
      {icon && <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 text-brand-600">{icon}</div>}
      <p className="font-semibold text-ink-900">{title}</p>
      {desc && <p className="max-w-sm text-sm text-ink-500">{desc}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-xl bg-ink-100 ${className}`} />;
}

export function LoadingBlock({ label = '불러오는 중…' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-20" />
      <Skeleton className="h-20" />
      <Skeleton className="h-20" />
    </div>
  );
}

interface ConfirmProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** 삭제 같은 되돌릴 수 없는 작업 전 확인 모달 */
export function ConfirmModal({ open, title, message, confirmLabel = '삭제', busy, onConfirm, onCancel }: ConfirmProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/40 p-4 sm:items-center" onClick={() => !busy && onCancel()}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-sm space-y-3 rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="text-lg font-bold text-ink-900">
          {title}
        </h2>
        <div className="text-sm leading-relaxed text-ink-600">{message}</div>
        <div className="flex gap-2 pt-1">
          <button
            ref={cancelRef}
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="min-h-11 flex-1 rounded-xl border border-ink-200 bg-white text-sm font-semibold text-ink-700 hover:bg-ink-50 disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {busy && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />}
            {busy ? '삭제 중…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
