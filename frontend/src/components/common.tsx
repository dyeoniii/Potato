import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { DISCLAIMER, LEVEL_LABEL, type RiskLevel } from '../types';

const LEVEL_STYLE: Record<RiskLevel, string> = {
  legal_review: 'bg-red-100 text-red-800 border-red-200',
  needs_context: 'bg-amber-100 text-amber-800 border-amber-200',
  low_risk: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

export function LevelBadge({ level, label }: { level: RiskLevel; label?: string }) {
  return (
    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${LEVEL_STYLE[level]}`}>
      {label || LEVEL_LABEL[level]}
    </span>
  );
}

export function Disclaimer({ className = '' }: { className?: string }) {
  return <p className={`text-xs text-slate-500 ${className}`}>⚖️ {DISCLAIMER} 고소 가능 여부나 결과를 보장하지 않습니다.</p>;
}

export function ErrorBox({ message, onClose }: { message: string | null; onClose?: () => void }) {
  if (!message) return null;
  return (
    <div role="alert" className="flex items-start justify-between gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
      <span>{message}</span>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="닫기" className="shrink-0 font-bold">
          ×
        </button>
      )}
    </div>
  );
}

export function InfoBox({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' }) {
  const cls = tone === 'warn' ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-sky-200 bg-sky-50 text-sky-900';
  return <div className={`rounded-lg border p-3 text-sm ${cls}`}>{children}</div>;
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger'; busy?: boolean };

export function Button({ variant = 'primary', busy, className = '', children, disabled, ...rest }: BtnProps) {
  const base = 'inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50';
  const v = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    ghost: 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
    danger: 'border border-red-300 bg-white text-red-700 hover:bg-red-50',
  }[variant];
  return (
    <button type="button" className={`${base} ${v} ${className}`} disabled={disabled || busy} {...rest}>
      {busy ? '처리 중…' : children}
    </button>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>{children}</section>;
}

export const inputCls = 'w-full rounded-lg border border-slate-300 bg-white p-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500';
