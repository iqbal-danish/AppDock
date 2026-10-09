import React from 'react';
import { Pin, Settings, Minus, X, FolderPlus } from 'lucide-react';
import { tauriApi } from '../api/tauriApi';

interface TitleBarProps {
  isAlwaysOnTop: boolean;
  onToggleAlwaysOnTop: () => void;
  onOpenSettings: () => void;
  onAddFolder: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  isAlwaysOnTop,
  onToggleAlwaysOnTop,
  onOpenSettings,
  onAddFolder,
}) => {
  const handleMinimize = async () => {
    try {
      await tauriApi.minimizeWindow();
    } catch (e) {
      console.error(e);
    }
  };

  const handleClose = async () => {
    try {
      await tauriApi.closeWindow();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div
      data-tauri-drag-region
      onMouseDown={async (e) => {
        if (e.button === 0 && !(e.target as HTMLElement).closest('button')) {
          try {
            await tauriApi.startDragging();
          } catch (err) {
            console.error('Window drag error:', err);
          }
        }
      }}
      className="flex items-center justify-between h-10 px-3 bg-[#161a22] border-b border-[#262c38] select-none text-xs cursor-move"
    >
      {/* Brand */}
      <div data-tauri-drag-region className="flex items-center gap-2 font-medium text-slate-200 pointer-events-none">
        <img src="/AppDock-Monochrome.png" alt="AppDock" className="w-5 h-5 object-contain" />
        <span className="font-semibold tracking-wide text-slate-200 text-sm">AppDock</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <button
          onClick={onAddFolder}
          title="Add app from folder"
          className="p-1.5 rounded hover:bg-[#252b38] text-slate-400 hover:text-blue-400 transition-colors"
        >
          <FolderPlus size={15} />
        </button>

        <button
          onClick={onToggleAlwaysOnTop}
          title={isAlwaysOnTop ? 'Window is pinned on top' : 'Pin window on top'}
          className={`p-1.5 rounded transition-colors ${
            isAlwaysOnTop
              ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
              : 'hover:bg-[#252b38] text-slate-400 hover:text-slate-200'
          }`}
        >
          <Pin size={14} className={isAlwaysOnTop ? 'rotate-45' : ''} />
        </button>

        <button
          onClick={onOpenSettings}
          title="Settings (Ctrl+,)"
          className="p-1.5 rounded hover:bg-[#252b38] text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Settings size={15} />
        </button>

        <div className="w-[1px] h-3.5 bg-[#2c3342] mx-1" />

        <button
          onClick={handleMinimize}
          title="Minimize"
          className="p-1.5 rounded hover:bg-[#252b38] text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Minus size={15} />
        </button>

        <button
          onClick={handleClose}
          title="Close (Esc)"
          className="p-1.5 rounded hover:bg-rose-900/40 hover:text-rose-400 text-slate-400 transition-colors"
        >
          <X size={15} />
        </button>
      </div>
    </div>
  );
};
