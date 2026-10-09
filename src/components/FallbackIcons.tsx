import React from 'react';
import { convertFileSrc } from '@tauri-apps/api/core';
import {
  FolderGit2,
  FileText,
  Cpu,
  Rss,
  Network,
  Server,
  MonitorCheck,
  AppWindow,
} from 'lucide-react';

interface AppIconProps {
  appId: string;
  customIconPath: string | null;
  className?: string;
  size?: number;
}

export const AppIcon: React.FC<AppIconProps> = ({
  appId,
  customIconPath,
  className = '',
  size = 38,
}) => {
  const [imageError, setImageError] = React.useState(false);

  // If a custom icon path is provided and hasn't errored
  if (customIconPath && !imageError) {
    return (
      <div
        className={`relative flex items-center justify-center rounded-xl p-1 bg-gradient-to-br from-slate-800/80 to-slate-900/90 border border-slate-700/50 shadow-md ${className}`}
        style={{ width: size + 4, height: size + 4 }}
      >
        <img
          src={convertFileSrc(customIconPath)}
          alt=""
          className="object-contain w-full h-full rounded-lg"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  const idLower = appId.toLowerCase();

  // Atlas File Manager: Glowing Neon Blue Glass Folder
  if (idLower.includes('atlas')) {
    return (
      <div
        className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/25 via-blue-600/15 to-indigo-950/70 border border-blue-400/40 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.22)] backdrop-blur-sm ${className}`}
        style={{ width: size + 4, height: size + 4 }}
      >
        <div className="absolute inset-x-1 top-0.5 h-[1px] bg-gradient-to-r from-transparent via-blue-300/40 to-transparent" />
        <FolderGit2 size={size * 0.58} strokeWidth={1.9} className="drop-shadow-[0_2px_6px_rgba(59,130,246,0.4)]" />
      </div>
    );
  }

  // TransformLab: Cyberpunk Violet Glowing Processor
  if (idLower.includes('transform') || idLower.includes('xml')) {
    return (
      <div
        className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/25 via-fuchsia-600/15 to-purple-950/70 border border-purple-400/40 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.22)] backdrop-blur-sm ${className}`}
        style={{ width: size + 4, height: size + 4 }}
      >
        <div className="absolute inset-x-1 top-0.5 h-[1px] bg-gradient-to-r from-transparent via-purple-300/40 to-transparent" />
        <Cpu size={size * 0.58} strokeWidth={1.9} className="drop-shadow-[0_2px_6px_rgba(168,85,247,0.4)]" />
      </div>
    );
  }

  // UltraViewer: Holographic Sapphire Monitor / Remote View
  if (idLower.includes('ultra') || idLower.includes('viewer')) {
    return (
      <div
        className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/25 via-blue-600/20 to-sky-950/70 border border-cyan-400/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.22)] backdrop-blur-sm ${className}`}
        style={{ width: size + 4, height: size + 4 }}
      >
        <div className="absolute inset-x-1 top-0.5 h-[1px] bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
        <MonitorCheck size={size * 0.58} strokeWidth={1.9} className="drop-shadow-[0_2px_6px_rgba(6,182,212,0.4)]" />
      </div>
    );
  }

  // PaperForge: Deep Coral & Rose Anvil / PDF Sheet
  if (idLower.includes('paperforge') || idLower.includes('pdf')) {
    return (
      <div
        className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/25 via-rose-600/15 to-red-950/70 border border-rose-400/40 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.22)] backdrop-blur-sm ${className}`}
        style={{ width: size + 4, height: size + 4 }}
      >
        <div className="absolute inset-x-1 top-0.5 h-[1px] bg-gradient-to-r from-transparent via-rose-300/40 to-transparent" />
        <FileText size={size * 0.58} strokeWidth={1.9} className="drop-shadow-[0_2px_6px_rgba(244,63,94,0.4)]" />
      </div>
    );
  }

  // FeedLens: Radiant Amber Broadcast Radar
  if (idLower.includes('feed') || idLower.includes('rss')) {
    return (
      <div
        className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/25 via-orange-600/15 to-amber-950/70 border border-amber-400/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.22)] backdrop-blur-sm ${className}`}
        style={{ width: size + 4, height: size + 4 }}
      >
        <div className="absolute inset-x-1 top-0.5 h-[1px] bg-gradient-to-r from-transparent via-amber-300/40 to-transparent" />
        <Rss size={size * 0.58} strokeWidth={1.9} className="drop-shadow-[0_2px_6px_rgba(245,158,11,0.4)]" />
      </div>
    );
  }

  // NetScan: Luminous Emerald & Cyan Mesh Nodes
  if (idLower.includes('net') || idLower.includes('scan') || idLower.includes('wifi')) {
    return (
      <div
        className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400/25 via-teal-600/15 to-emerald-950/70 border border-emerald-400/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.22)] backdrop-blur-sm ${className}`}
        style={{ width: size + 4, height: size + 4 }}
      >
        <div className="absolute inset-x-1 top-0.5 h-[1px] bg-gradient-to-r from-transparent via-emerald-300/40 to-transparent" />
        <Network size={size * 0.58} strokeWidth={1.9} className="drop-shadow-[0_2px_6px_rgba(16,185,129,0.4)]" />
      </div>
    );
  }

  // ServerDock: Jade & Mint Stacked Server Blades
  if (idLower.includes('server') || idLower.includes('dock')) {
    return (
      <div
        className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400/25 via-emerald-600/15 to-teal-950/70 border border-teal-400/40 text-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.22)] backdrop-blur-sm ${className}`}
        style={{ width: size + 4, height: size + 4 }}
      >
        <div className="absolute inset-x-1 top-0.5 h-[1px] bg-gradient-to-r from-transparent via-teal-300/40 to-transparent" />
        <Server size={size * 0.58} strokeWidth={1.9} className="drop-shadow-[0_2px_6px_rgba(20,184,166,0.4)]" />
      </div>
    );
  }

  // Custom / 7th Application default
  return (
    <div
      className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/25 via-violet-600/15 to-indigo-950/70 border border-indigo-400/40 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.22)] backdrop-blur-sm ${className}`}
      style={{ width: size + 4, height: size + 4 }}
    >
      <div className="absolute inset-x-1 top-0.5 h-[1px] bg-gradient-to-r from-transparent via-indigo-300/40 to-transparent" />
      <AppWindow size={size * 0.58} strokeWidth={1.9} className="drop-shadow-[0_2px_6px_rgba(99,102,241,0.4)]" />
    </div>
  );
};
