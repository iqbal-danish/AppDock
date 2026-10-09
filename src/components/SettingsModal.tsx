import React, { useState } from 'react';
import {
  AppConfig,
  DetectedExecutable,
  LauncherSettings,
} from '../types/launcher';
import { tauriApi } from '../api/tauriApi';
import { AppIcon } from './FallbackIcons';
import {
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  FolderOpen,
  FileCode,
  Image,
  Play,
  CheckCircle,
  AlertCircle,
  FolderSearch,
  Sparkles,
} from 'lucide-react';

interface SettingsModalProps {
  initialApps: AppConfig[];
  initialSettings: LauncherSettings;
  activeAppId?: string | null;
  onSave: (apps: AppConfig[], settings: LauncherSettings) => Promise<void>;
  onClose: () => void;
  onRequestSelectCandidate: (
    candidates: DetectedExecutable[],
    folderName: string,
    callback: (c: DetectedExecutable) => void
  ) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  initialApps,
  initialSettings,
  activeAppId,
  onSave,
  onClose,
  onRequestSelectCandidate,
}) => {
  const [apps, setApps] = useState<AppConfig[]>(JSON.parse(JSON.stringify(initialApps)));
  const [settings, setSettings] = useState<LauncherSettings>({ ...initialSettings });
  const [selectedAppId, setSelectedAppId] = useState<string>(
    activeAppId || (apps[0] ? apps[0].id : '')
  );
  const [testStatus, setTestStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const currentApp = apps.find((a) => a.id === selectedAppId) || apps[0];

  const updateCurrentApp = (updates: Partial<AppConfig>) => {
    if (!currentApp) return;
    setApps((prev) =>
      prev.map((app) => (app.id === currentApp.id ? { ...app, ...updates } : app))
    );
    setTestStatus(null);
  };

  const handleBrowseExe = async () => {
    try {
      const selected = await tauriApi.selectExecutableDialog();
      if (selected) {
        updateCurrentApp({ executablePath: selected });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDetectFolder = async () => {
    if (!currentApp) return;
    try {
      const folder = await tauriApi.selectFolderDialog(
        `Select Application Folder for ${currentApp.name}`
      );
      if (!folder) return;

      const candidates = await tauriApi.detectExecutablesInFolder(folder);
      if (candidates.length === 0) {
        setTestStatus({
          success: false,
          message: `No executable files found in folder: ${folder}`,
        });
        return;
      }

      if (candidates.length === 1) {
        const found = candidates[0];
        updateCurrentApp({
          executablePath: found.executablePath,
          workingDirectory: found.workingDirectory,
        });
        setTestStatus({
          success: true,
          message: `Detected and linked executable: ${found.executablePath}`,
        });
      } else {
        const folderName = folder.split('\\').pop() || 'Selected Folder';
        onRequestSelectCandidate(candidates, folderName, (chosen) => {
          updateCurrentApp({
            executablePath: chosen.executablePath,
            workingDirectory: chosen.workingDirectory,
          });
          setTestStatus({
            success: true,
            message: `Selected executable: ${chosen.executablePath}`,
          });
        });
      }
    } catch (e: any) {
      setTestStatus({
        success: false,
        message: `Folder detection error: ${e}`,
      });
    }
  };

  const handleAutoDetectAll = async () => {
    try {
      const detected = await tauriApi.autoDetectInstalledApps();
      const mapped: AppConfig[] = detected.map((d) => ({
        id: d.id,
        name: d.name,
        executablePath: d.executablePath,
        arguments: d.arguments,
        workingDirectory: d.workingDirectory,
        iconPath: d.iconPath,
        enabled: d.enabled,
      }));
      setApps(mapped);
      if (mapped.length > 0 && !mapped.find((m) => m.id === selectedAppId)) {
        setSelectedAppId(mapped[0].id);
      }
      const linkedCount = mapped.filter((m) => m.executablePath).length;
      setTestStatus({
        success: true,
        message: `Auto-detected ${linkedCount} applications on your PC!`,
      });
    } catch (e: any) {
      setTestStatus({
        success: false,
        message: `Auto-detection error: ${e}`,
      });
    }
  };

  const handleBrowseWorkingDir = async () => {
    try {
      const selected = await tauriApi.selectFolderDialog('Select Working Directory');
      if (selected) {
        updateCurrentApp({ workingDirectory: selected });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBrowseIcon = async () => {
    try {
      const selected = await tauriApi.selectIconDialog();
      if (selected) {
        updateCurrentApp({ iconPath: selected });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTestLaunch = async () => {
    if (!currentApp || !currentApp.executablePath) {
      setTestStatus({
        success: false,
        message: 'Please specify an executable or folder path first.',
      });
      return;
    }

    try {
      // First persist state so backend test sees latest values
      await tauriApi.updateApp(currentApp);
      const res = await tauriApi.testLaunchApp(currentApp.id);
      setTestStatus({
        success: true,
        message: `Success! ${res.message}`,
      });
    } catch (e: any) {
      setTestStatus({
        success: false,
        message: `Launch test failed: ${e}`,
      });
    }
  };

  const handleMove = (direction: 'up' | 'down') => {
    if (!currentApp) return;
    const idx = apps.findIndex((a) => a.id === currentApp.id);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= apps.length) return;

    const newApps = [...apps];
    const [moved] = newApps.splice(idx, 1);
    newApps.splice(targetIdx, 0, moved);
    setApps(newApps);
  };

  const handleAddNewApp = () => {
    const newId = `app-${Date.now()}`;
    const newApp: AppConfig = {
      id: newId,
      name: `App ${apps.length + 1}`,
      executablePath: null,
      arguments: [],
      workingDirectory: null,
      iconPath: null,
      enabled: true,
    };
    setApps((prev) => [...prev, newApp]);
    setSelectedAppId(newId);
  };

  const handleDeleteApp = (idToDelete: string) => {
    const filtered = apps.filter((a) => a.id !== idToDelete);
    setApps(filtered);
    if (selectedAppId === idToDelete) {
      if (filtered[0]) {
        setSelectedAppId(filtered[0].id);
      } else {
        setSelectedAppId('');
      }
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await onSave(apps, settings);
      onClose();
    } catch (e) {
      console.error(e);
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/75 flex items-center justify-center p-3 backdrop-blur-sm select-none">
      <div className="bg-[#141720] border border-[#2b3345] rounded-xl w-full max-w-2xl h-[92vh] max-h-[580px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#242b3a] bg-[#181d28]">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold tracking-wide">AppDock Settings</h2>
            <span className="text-[11px] text-slate-400 font-mono">({apps.length} apps configured)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAutoDetectAll}
              title="Auto-detect all known applications in user directory"
              className="px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-400 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Sparkles size={13} /> Auto-Detect Apps
            </button>

            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-[#2b3345] transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content split */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: App List */}
          <div className="w-52 border-r border-[#242b3a] bg-[#12151d] flex flex-col">
            <div className="p-2 border-b border-[#202634] text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex justify-between items-center">
              <span>Applications ({apps.length})</span>
              <button
                onClick={handleAddNewApp}
                title="Add new app slot"
                className="p-1 hover:bg-[#202735] rounded text-blue-400 hover:text-blue-300 flex items-center gap-1 text-[11px]"
              >
                <Plus size={13} /> Add
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
              {apps.map((app, index) => (
                <div
                  key={app.id}
                  onClick={() => {
                    setSelectedAppId(app.id);
                    setTestStatus(null);
                  }}
                  className={`group flex items-center justify-between gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer text-xs transition-colors ${
                    currentApp && app.id === currentApp.id
                      ? 'bg-blue-600/25 border border-blue-500/40 text-white font-medium'
                      : 'hover:bg-[#1b202c] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate flex-1">
                    <AppIcon appId={app.id} customIconPath={app.iconPath} size={22} />
                    <span className="truncate flex-1">{app.name || `App ${index + 1}`}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    {!app.enabled && (
                      <span className="text-[10px] text-slate-500 font-mono">Off</span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteApp(app.id);
                      }}
                      title="Remove this application"
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Reorder actions */}
            <div className="p-2 border-t border-[#202634] flex items-center justify-between bg-[#10131a]">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleMove('up')}
                  title="Move up"
                  className="p-1.5 rounded hover:bg-[#202634] text-slate-400 hover:text-white"
                >
                  <ArrowUp size={13} />
                </button>
                <button
                  onClick={() => handleMove('down')}
                  title="Move down"
                  className="p-1.5 rounded hover:bg-[#202634] text-slate-400 hover:text-white"
                >
                  <ArrowDown size={13} />
                </button>
              </div>

              {currentApp && (
                <button
                  onClick={() => handleDeleteApp(currentApp.id)}
                  title="Remove selected application"
                  className="p-1.5 rounded hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 flex items-center gap-1 text-[11px]"
                >
                  <Trash2 size={13} /> Delete
                </button>
              )}
            </div>
          </div>

          {/* Right: App Editor & Launcher Options */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#141720]">
            {/* Global Launcher Settings Card */}
            <div className="p-3 rounded-lg border border-[#252c3c] bg-[#191e2b] space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Launcher Preferences
              </span>

              <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.closeAfterLaunch}
                  onChange={(e) =>
                    setSettings({ ...settings, closeAfterLaunch: e.target.checked })
                  }
                  className="rounded border-[#353f54] text-blue-600 focus:ring-0 bg-[#252c3b]"
                />
                <span>Close launcher automatically after launching an application</span>
              </label>

              <label className="flex items-center gap-2.5 text-xs text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.keepLauncherOnTop}
                  onChange={(e) =>
                    setSettings({ ...settings, keepLauncherOnTop: e.target.checked })
                  }
                  className="rounded border-[#353f54] text-blue-600 focus:ring-0 bg-[#252c3b]"
                />
                <span>Keep launcher window above other windows</span>
              </label>
            </div>

            {/* Current App Form */}
            {currentApp ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#252c3c] pb-2">
                  <div className="flex items-center gap-2">
                    <AppIcon
                      appId={currentApp.id}
                      customIconPath={currentApp.iconPath}
                      size={28}
                    />
                    <span className="text-xs font-semibold text-slate-100">
                      Edit: {currentApp.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentApp.enabled}
                        onChange={(e) => updateCurrentApp({ enabled: e.target.checked })}
                        className="rounded border-[#353f54] text-blue-600 bg-[#252c3b]"
                      />
                      <span>Enabled</span>
                    </label>

                    <button
                      onClick={() => handleDeleteApp(currentApp.id)}
                      className="px-2 py-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-800/40 rounded flex items-center gap-1 transition-colors"
                      title="Remove this application from AppDock"
                    >
                      <Trash2 size={12} /> Remove App
                    </button>
                  </div>
                </div>

                {/* Display Name */}
                <div>
                  <label className="text-[11px] text-slate-400 font-medium block mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={currentApp.name}
                    onChange={(e) => updateCurrentApp({ name: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs bg-[#1a202c] border border-[#2d3649] rounded-md text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Executable Path */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] text-slate-400 font-medium">
                      Executable or Folder Path (.exe or App Folder)
                    </label>
                    <button
                      onClick={handleDetectFolder}
                      className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 hover:underline"
                      title="Select app folder to automatically detect the .exe"
                    >
                      <FolderSearch size={12} /> Pick App Folder
                    </button>
                  </div>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="e.g. C:\Users\diqbal\Atlas or C:\Apps\app.exe"
                      value={currentApp.executablePath || ''}
                      onChange={(e) =>
                        updateCurrentApp({ executablePath: e.target.value || null })
                      }
                      className="flex-1 px-3 py-1.5 text-xs font-mono bg-[#1a202c] border border-[#2d3649] rounded-md text-white focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={handleBrowseExe}
                      title="Browse for executable"
                      className="px-2.5 py-1.5 bg-[#252d3d] hover:bg-[#313a4e] border border-[#374257] rounded-md text-xs font-medium flex items-center gap-1.5 text-slate-200"
                    >
                      <FileCode size={13} /> Browse .exe
                    </button>
                  </div>
                </div>

                {/* Working Directory */}
                <div>
                  <label className="text-[11px] text-slate-400 font-medium block mb-1">
                    Working Directory (Optional, defaults to executable folder)
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Leave blank for automatic default"
                      value={currentApp.workingDirectory || ''}
                      onChange={(e) =>
                        updateCurrentApp({ workingDirectory: e.target.value || null })
                      }
                      className="flex-1 px-3 py-1.5 text-xs font-mono bg-[#1a202c] border border-[#2d3649] rounded-md text-white focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={handleBrowseWorkingDir}
                      title="Browse folder"
                      className="px-2.5 py-1.5 bg-[#252d3d] hover:bg-[#313a4e] border border-[#374257] rounded-md text-xs font-medium flex items-center gap-1.5 text-slate-200"
                    >
                      <FolderOpen size={13} /> Browse
                    </button>
                  </div>
                </div>

                {/* Launch Arguments */}
                <div>
                  <label className="text-[11px] text-slate-400 font-medium block mb-1">
                    Launch Arguments (Separate multiple arguments with space)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. --profile work --portable"
                    value={currentApp.arguments.join(' ')}
                    onChange={(e) =>
                      updateCurrentApp({
                        arguments: e.target.value
                          .split(' ')
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs font-mono bg-[#1a202c] border border-[#2d3649] rounded-md text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Custom Icon Path */}
                <div>
                  <label className="text-[11px] text-slate-400 font-medium block mb-1">
                    Custom Icon (.ico, .png, .svg)
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Optional image path"
                      value={currentApp.iconPath || ''}
                      onChange={(e) => updateCurrentApp({ iconPath: e.target.value || null })}
                      className="flex-1 px-3 py-1.5 text-xs font-mono bg-[#1a202c] border border-[#2d3649] rounded-md text-white focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={handleBrowseIcon}
                      title="Browse icon"
                      className="px-2.5 py-1.5 bg-[#252d3d] hover:bg-[#313a4e] border border-[#374257] rounded-md text-xs font-medium flex items-center gap-1.5 text-slate-200"
                    >
                      <Image size={13} /> Browse
                    </button>
                  </div>
                </div>

                {/* Test Launch Button & Feedback */}
                <div className="pt-2 flex items-center justify-between">
                  <button
                    onClick={handleTestLaunch}
                    className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/50 text-blue-300 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Play size={12} className="fill-current" /> Test Launch Executable
                  </button>

                  {testStatus && (
                    <div
                      className={`text-xs flex items-center gap-1.5 ${
                        testStatus.success ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {testStatus.success ? (
                        <CheckCircle size={14} />
                      ) : (
                        <AlertCircle size={14} />
                      )}
                      <span className="truncate max-w-[260px]">{testStatus.message}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs">
                <p>No application selected.</p>
                <button
                  onClick={handleAddNewApp}
                  className="mt-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs"
                >
                  Add an Application
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#242b3a] bg-[#161a24]">
          <span className="text-[11px] text-slate-400">
            Changes will be saved atomically to local AppDock configuration.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded bg-[#202735] hover:bg-[#293244] text-xs font-medium text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white shadow-sm transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
