import React from 'react';
import type { FindingCategory, FindingSeverity, ReviewStatus } from '../../types';
import { AlertCircle, AlertTriangle, Bug, CheckCircle2, Clock, Flame, Info, ShieldAlert, Sparkles, XCircle, Zap } from 'lucide-react';

export const SeverityBadge: React.FC<{ severity: FindingSeverity; count?: number }> = ({ severity, count }) => {
  const configs: Record<FindingSeverity, { bg: string; text: string; border: string; icon: any }> = {
    critical: {
      bg: 'bg-red-950/60',
      text: 'text-red-400',
      border: 'border-red-800/80',
      icon: Flame,
    },
    high: {
      bg: 'bg-orange-950/60',
      text: 'text-orange-400',
      border: 'border-orange-800/80',
      icon: AlertTriangle,
    },
    medium: {
      bg: 'bg-amber-950/60',
      text: 'text-amber-400',
      border: 'border-amber-800/80',
      icon: AlertCircle,
    },
    low: {
      bg: 'bg-blue-950/60',
      text: 'text-blue-400',
      border: 'border-blue-800/80',
      icon: Info,
    },
    info: {
      bg: 'bg-slate-900',
      text: 'text-slate-400',
      border: 'border-slate-700',
      icon: Sparkles,
    },
  };

  const config = configs[severity] || configs.info;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="capitalize">{severity}</span>
      {count !== undefined && (
        <span className="ml-0.5 px-1.5 py-0.2 bg-black/40 rounded-full font-bold text-[10px]">
          {count}
        </span>
      )}
    </span>
  );
};

export const CategoryBadge: React.FC<{ category: FindingCategory }> = ({ category }) => {
  const configs: Record<FindingCategory, { bg: string; text: string; border: string; icon: any }> = {
    bug: {
      bg: 'bg-rose-950/40',
      text: 'text-rose-400',
      border: 'border-rose-800/60',
      icon: Bug,
    },
    security: {
      bg: 'bg-purple-950/40',
      text: 'text-purple-400',
      border: 'border-purple-800/60',
      icon: ShieldAlert,
    },
    performance: {
      bg: 'bg-emerald-950/40',
      text: 'text-emerald-400',
      border: 'border-emerald-800/60',
      icon: Zap,
    },
    maintainability: {
      bg: 'bg-cyan-950/40',
      text: 'text-cyan-400',
      border: 'border-cyan-800/60',
      icon: Sparkles,
    },
  };

  const config = configs[category] || configs.maintainability;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
    >
      <Icon className="w-3 h-3" />
      <span className="capitalize">{category}</span>
    </span>
  );
};

export const StatusBadge: React.FC<{ status: ReviewStatus }> = ({ status }) => {
  switch (status) {
    case 'completed':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950/50 text-emerald-400 border border-emerald-800">
          <CheckCircle2 className="w-3 h-3" />
          Completed
        </span>
      );
    case 'processing':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-950/50 text-indigo-400 border border-indigo-800 animate-pulse">
          <Clock className="w-3 h-3 animate-spin" />
          Processing
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-950/50 text-red-400 border border-red-800">
          <XCircle className="w-3 h-3" />
          Failed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-900 text-slate-400 border border-slate-700">
          <Clock className="w-3 h-3" />
          Pending
        </span>
      );
  }
};
