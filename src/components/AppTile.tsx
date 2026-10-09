import React from 'react';
import { AppTileState } from '../types/launcher';
import { AppIcon } from './FallbackIcons';
import { StatusBadge } from './StatusBadge';
import {
  Play,
  Settings2,
  AlertTriangle,
  Loader2,
  Trash2,
  ArrowLeft,
  ArrowRight,
  GripVertical,
} from 'lucide-react';

interface AppTileProps {
  app: AppTileState;
  index: number;
  totalApps: number;
  isSelected: boolean;
  isLaunching: boolean;
  isDraggingThis: boolean;
  isDragOverThis: boolean;
  wasJustDragged?: boolean;
  onPointerDown?: (e: React.PointerEvent, id: string) => void;
  onLaunch: (id: string) => void;
  onConfigure: (app: AppTileState) => void;
  onRemove: (id: string) => void;
  onSelect: () => void;
  onShiftIndex: (index: number, direction: 'prev' | 'next') => void;
}

export const AppTile: React.FC<AppTileProps> = ({
  app,
  index,
  totalApps,
  isSelected,
  isLaunching,
  isDraggingThis,
  isDragOverThis,
  wasJustDragged = false,
  onPointerDown,
  onLaunch,
  onConfigure,
  onRemove,
  onSelect,
  onShiftIndex,
}) => {
  const handleClick = (e: React.MouseEvent) => {
    // If dragging or just finished dragging, do NOT trigger launch/configure
    if (wasJustDragged || isDraggingThis) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    onSelect();
    if (app.executablePath && app.executablePath.trim().length > 0) {
      onLaunch(app.id);
    } else {
      onConfigure(app);
    }
  };

  const isPlayable =
    app.status === 'ready' || (!!app.executablePath && app.executablePath.trim().length > 0);

  return (
    <div
      role="button"
      tabIndex={0}
      data-testid={`app-tile-${app.id}`}
      data-tile-id={app.id}
      data-index={index}
      onPointerDown={(e) => onPointerDown && onPointerDown(e, app.id)}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e as any);
        }
      }}
      className={`group relative flex flex-col justify-between p-3.5 rounded-2xl border transition-all duration-150 cursor-pointer select-none text-left min-h-[142px] touch-none
        ${
          app.status === 'disabled'
            ? 'opacity-40 bg-[#161a22] border-[#252b38] cursor-not-allowed'
            : 'bg-gradient-to-b from-[#1c222e]/90 to-[#161a23]/95 hover:from-[#242c3b] hover:to-[#1b212c] border-[#2a3445] hover:border-blue-500/60 hover:shadow-[0_8px_20px_rgba(0,0,0,0.35)] active:scale-[0.985]'
        }
        ${isSelected ? 'ring-2 ring-blue-500 border-transparent shadow-[0_0_15px_rgba(59,130,246,0.25)]' : ''}
        ${isDraggingThis ? 'opacity-40 border-dashed border-blue-400 scale-95 shadow-2xl ring-2 ring-blue-400/50' : ''}
        ${isDragOverThis ? 'border-dashed border-blue-400 bg-blue-950/60 ring-2 ring-blue-400 scale-[1.03] shadow-[0_0_20px_rgba(59,130,246,0.4)]' : ''}
      `}
    >
      {/* Drag Over Overlay Badge */}
      {isDragOverThis && (
        <div className="absolute inset-0 bg-blue-950/80 backdrop-blur-[1px] rounded-2xl flex items-center justify-center border-2 border-dashed border-blue-400 pointer-events-none z-20">
          <span className="text-xs font-semibold text-blue-200 bg-blue-900/95 px-3 py-1.5 rounded-full shadow-lg border border-blue-400/50 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            Move here
          </span>
        </div>
      )}

      {/* Top row: Icon and Move / Actions */}
      <div className="flex items-start justify-between w-full">
        <div className="flex items-center gap-2">
          <AppIcon appId={app.id} customIconPath={app.iconPath} size={36} />
          <div
            className="p-1 text-slate-400 hover:text-white bg-[#202736]/60 rounded transition-colors cursor-grab active:cursor-grabbing border border-slate-700/40"
            title="Click and drag to move tile"
          >
            <GripVertical size={14} />
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Quick Shift Reorder Buttons */}
          {index > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShiftIndex(index, 'prev');
              }}
              title="Move left/up (reorder)"
              className="p-1 rounded bg-[#202736] hover:bg-blue-600/80 text-slate-400 hover:text-white transition-colors border border-[#2b3548]"
            >
              <ArrowLeft size={12} />
            </button>
          )}

          {index < totalApps - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShiftIndex(index, 'next');
              }}
              title="Move right/down (reorder)"
              className="p-1 rounded bg-[#202736] hover:bg-blue-600/80 text-slate-400 hover:text-white transition-colors border border-[#2b3548]"
            >
              <ArrowRight size={12} />
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onConfigure(app);
            }}
            title="Configure application"
            className="p-1 rounded bg-[#202736] hover:bg-blue-600 text-slate-400 hover:text-white transition-colors border border-[#2b3548]"
          >
            <Settings2 size={12} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove(app.id);
            }}
            title="Remove application from AppDock"
            className="p-1 rounded bg-[#202736] hover:bg-rose-600 text-slate-400 hover:text-white transition-colors border border-[#2b3548]"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Middle row: App Name & Executable */}
      <div className="mt-2.5 flex-1">
        <h3 className="font-semibold text-slate-100 text-xs sm:text-sm tracking-tight truncate leading-tight">
          {app.name}
        </h3>
        <p className="text-[10.5px] text-slate-400 truncate mt-0.5 font-mono">
          {app.executablePath ? app.executablePath.split('\\').pop() : 'Click to setup path'}
        </p>
      </div>

      {/* Bottom row: Availability and Action Status */}
      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-[#252c3a]">
        <StatusBadge status={app.status} />

        {isLaunching ? (
          <span className="flex items-center gap-1 text-[10.5px] text-blue-400 font-medium">
            <Loader2 size={11} className="animate-spin" /> Launching...
          </span>
        ) : isPlayable ? (
          <span className="flex items-center gap-1 text-[10.5px] text-slate-400 group-hover:text-blue-400 font-medium transition-colors">
            <Play size={10} className="fill-current" /> Launch
          </span>
        ) : app.status === 'missingExecutable' ? (
          <span className="flex items-center gap-1 text-[10.5px] text-amber-400">
            <AlertTriangle size={10} /> Fix path
          </span>
        ) : null}
      </div>
    </div>
  );
};

