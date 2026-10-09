import React from 'react';
import { DetectedExecutable } from '../types/launcher';
import { Sparkles, Terminal, X, Check } from 'lucide-react';

interface DetectedExesModalProps {
  candidates: DetectedExecutable[];
  folderName: string;
  onSelect: (candidate: DetectedExecutable) => void;
  onCancel: () => void;
}

export const DetectedExesModal: React.FC<DetectedExesModalProps> = ({
  candidates,
  folderName,
  onSelect,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#171b24] border border-[#2d3545] rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#262c3b] bg-[#1a202c]">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-blue-400" />
            <h2 className="text-sm font-semibold text-slate-100">
              Executables Found in {folderName}
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#2c3445]"
          >
            <X size={15} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-2">
          <p className="text-xs text-slate-300">
            Select the primary application executable to configure:
          </p>

          <div className="space-y-2 mt-2">
            {candidates.map((cand, idx) => (
              <div
                key={idx}
                onClick={() => onSelect(cand)}
                className={`flex items-start justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  cand.isLikelyPrimary
                    ? 'bg-blue-950/30 border-blue-500/40 hover:bg-blue-900/40'
                    : 'bg-[#1e2430] border-[#2c3445] hover:bg-[#252c3b]'
                }`}
              >
                <div className="flex items-start gap-2.5 overflow-hidden">
                  <div className="p-2 rounded bg-[#273042] text-slate-300 mt-0.5">
                    <Terminal size={14} />
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-100 truncate">
                        {cand.name}
                      </span>
                      {cand.isLikelyPrimary && (
                        <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-medium">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5" title={cand.executablePath}>
                      {cand.executablePath}
                    </p>
                  </div>
                </div>

                <button className="text-blue-400 hover:text-blue-300 p-1.5 rounded hover:bg-blue-500/10">
                  <Check size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-4 py-2.5 border-t border-[#262c3b] bg-[#141720]">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs rounded bg-[#252c3b] hover:bg-[#2f384a] text-slate-300 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
