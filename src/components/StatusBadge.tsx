import React from 'react';
import { AppStatus } from '../types/launcher';

interface StatusBadgeProps {
  status: AppStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'ready':
      return (
        <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Ready
        </span>
      );
    case 'notConfigured':
      return (
        <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <span className="w-2 h-2 rounded-full bg-slate-500" />
          Not configured
        </span>
      );
    case 'missingExecutable':
      return (
        <span className="flex items-center gap-1.5 text-[11px] text-amber-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          Missing path
        </span>
      );
    case 'disabled':
      return (
        <span className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <span className="w-2 h-2 rounded-full bg-slate-600" />
          Disabled
        </span>
      );
  }
};
