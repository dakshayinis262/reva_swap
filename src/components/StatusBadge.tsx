import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from 'lucide-react';

interface StatusIndicatorProps {
  status: string;
  className?: string;
}

export function StatusIndicator({ status, className = '' }: StatusIndicatorProps) {
  const normalized = status.toLowerCase();

  let icon = <Clock className="w-3.5 h-3.5 shrink-0" />;
  let colorClass = 'text-slate-600';

  if (
    normalized === 'available' ||
    normalized === 'accepted' ||
    normalized === 'completed' ||
    normalized === 'returned' ||
    normalized === 'resolved' ||
    normalized === 'active' ||
    normalized === 'verified'
  ) {
    icon =
      normalized === 'verified' ? (
        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
      ) : (
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
      );
    colorClass = 'text-emerald-700';
  } else if (
    normalized === 'pending' ||
    normalized === 'submitted' ||
    normalized === 'reserved'
  ) {
    icon = <Clock className="w-3.5 h-3.5 shrink-0" />;
    colorClass = 'text-amber-700';
  } else if (
    normalized === 'in progress' ||
    normalized === 'borrowed' ||
    normalized === 'under review'
  ) {
    icon = <RefreshCw className="w-3.5 h-3.5 shrink-0" />;
    colorClass = 'text-[#6D5CE7]';
  } else if (
    normalized === 'rejected' ||
    normalized === 'cancelled' ||
    normalized === 'overdue' ||
    normalized === 'disputed' ||
    normalized === 'suspended'
  ) {
    icon =
      normalized === 'overdue' || normalized === 'disputed' ? (
        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      ) : (
        <XCircle className="w-3.5 h-3.5 shrink-0" />
      );
    colorClass = 'text-rose-700';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap shrink-0 ${colorClass} ${className}`}
    >
      {icon}
      <span>{status}</span>
    </span>
  );
}
