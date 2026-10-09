import { useEffect, useState, useCallback } from 'react';
import {
  AppConfig,
  AppTileState,
  DetectedExecutable,
  LauncherSettings,
} from './types/launcher';
import { tauriApi } from './api/tauriApi';
import { TitleBar } from './components/TitleBar';
import { AppGrid } from './components/AppGrid';
import { SettingsModal } from './components/SettingsModal';
import { DetectedExesModal } from './components/DetectedExesModal';
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export function App() {
  const [apps, setApps] = useState<AppTileState[]>([]);
  const [settings, setSettings] = useState<LauncherSettings>({
    closeAfterLaunch: true,
    keepLauncherOnTop: false,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [launchingId, setLaunchingId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeConfigureAppId, setActiveConfigureAppId] = useState<string | null>(null);

  // Folder detection modal state
  const [candidateState, setCandidateState] = useState<{
    candidates: DetectedExecutable[];
    folderName: string;
    onSelect: (candidate: DetectedExecutable) => void;
  } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [appStates, currentSettings] = await Promise.all([
        tauriApi.getApps(),
        tauriApi.getSettings(),
      ]);
      setApps(appStates);
      setSettings(currentSettings);
    } catch (e: any) {
      console.error('Failed to load apps or settings:', e);
      setNotification({
        type: 'error',
        message: `Failed to load launcher configuration: ${e}`,
      });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Launch handler
  const handleLaunch = async (id: string) => {
    setLaunchingId(id);
    setNotification(null);
    try {
      const result = await tauriApi.launchApp(id);
      setNotification({
        type: 'success',
        message: result.message,
      });
    } catch (e: any) {
      console.error('Launch failed:', e);
      setNotification({
        type: 'error',
        message: `Launch failed: ${e}`,
      });
      await loadData();
    } finally {
      setLaunchingId(null);
    }
  };

  // Quick configure handler for a tile
  const handleConfigureTile = (app: AppTileState) => {
    setActiveConfigureAppId(app.id);
    setIsSettingsOpen(true);
  };

  // Quick remove handler for a tile
  const handleRemoveTile = async (id: string) => {
    try {
      await tauriApi.deleteApp(id);
      await loadData();
      setNotification({
        type: 'success',
        message: 'Application removed.',
      });
    } catch (e: any) {
      setNotification({
        type: 'error',
        message: `Failed to remove: ${e}`,
      });
    }
  };

  // Reorder apps via drag & drop
  const handleReorderApps = async (sourceId: string, targetId: string) => {
    const fromIndex = apps.findIndex((a) => a.id === sourceId);
    const toIndex = apps.findIndex((a) => a.id === targetId);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;

    const newApps = [...apps];
    const [moved] = newApps.splice(fromIndex, 1);
    newApps.splice(toIndex, 0, moved);

    setApps(newApps);
    setSelectedIndex(toIndex);

    try {
      const payload: AppConfig[] = newApps.map((a) => ({
        id: a.id,
        name: a.name,
        executablePath: a.executablePath,
        arguments: a.arguments,
        workingDirectory: a.workingDirectory,
        iconPath: a.iconPath,
        enabled: a.enabled,
      }));
      await tauriApi.saveAllApps(payload);
    } catch (e) {
      console.error('Failed to save reordered apps:', e);
    }
  };

  // Shift app index left/right via button
  const handleShiftIndex = async (index: number, direction: 'prev' | 'next') => {
    const targetIndex = direction === 'prev' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= apps.length) return;

    const newApps = [...apps];
    const [moved] = newApps.splice(index, 1);
    newApps.splice(targetIndex, 0, moved);

    setApps(newApps);
    setSelectedIndex(targetIndex);

    try {
      const payload: AppConfig[] = newApps.map((a) => ({
        id: a.id,
        name: a.name,
        executablePath: a.executablePath,
        arguments: a.arguments,
        workingDirectory: a.workingDirectory,
        iconPath: a.iconPath,
        enabled: a.enabled,
      }));
      await tauriApi.saveAllApps(payload);
    } catch (e) {
      console.error('Failed to save shifted apps:', e);
    }
  };

  // Add App from Folder direct action
  const handleAddFolderDirect = async () => {
    try {
      const folder = await tauriApi.selectFolderDialog('Select Application Folder');
      if (!folder) return;

      const candidates = await tauriApi.detectExecutablesInFolder(folder);
      if (candidates.length === 0) {
        setNotification({
          type: 'error',
          message: `No executable (.exe) detected in folder: ${folder}`,
        });
        return;
      }

      const applyCandidate = async (candidate: DetectedExecutable) => {
        const existingUnconfigured = apps.find(
          (a) => a.executablePath === null || a.executablePath.trim() === ''
        );

        const targetApp: AppConfig = existingUnconfigured
          ? {
              id: existingUnconfigured.id,
              name: existingUnconfigured.name || candidate.name,
              executablePath: candidate.executablePath,
              arguments: existingUnconfigured.arguments || [],
              workingDirectory: candidate.workingDirectory,
              iconPath: existingUnconfigured.iconPath || null,
              enabled: true,
            }
          : {
              id: `app-${Date.now()}`,
              name: candidate.name,
              executablePath: candidate.executablePath,
              arguments: [],
              workingDirectory: candidate.workingDirectory,
              iconPath: null,
              enabled: true,
            };

        await tauriApi.updateApp(targetApp);
        await loadData();
        setNotification({
          type: 'success',
          message: `Configured ${candidate.name} (${candidate.executablePath.split('\\').pop()})`,
        });
      };

      if (candidates.length === 1) {
        await applyCandidate(candidates[0]);
      } else {
        const folderName = folder.split('\\').pop() || 'Selected Folder';
        setCandidateState({
          candidates,
          folderName,
          onSelect: async (c) => {
            setCandidateState(null);
            await applyCandidate(c);
          },
        });
      }
    } catch (e: any) {
      setNotification({
        type: 'error',
        message: `Error detecting app in folder: ${e}`,
      });
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Hotkey: Ctrl+, opens settings
      if (e.ctrlKey && e.key === ',') {
        e.preventDefault();
        setIsSettingsOpen((prev) => !prev);
        return;
      }

      // Hotkey: Escape closes modal or launcher
      if (e.key === 'Escape') {
        if (candidateState) {
          setCandidateState(null);
        } else if (isSettingsOpen) {
          setIsSettingsOpen(false);
        } else {
          tauriApi.closeWindow();
        }
        return;
      }

      // If a modal is open, avoid grid hotkeys
      if (isSettingsOpen || candidateState) return;

      // Number keys 1-9
      const num = parseInt(e.key, 10);
      if (!isNaN(num) && num >= 1 && num <= apps.length) {
        const idx = num - 1;
        if (apps[idx]) {
          setSelectedIndex(idx);
          if (apps[idx].executablePath && apps[idx].executablePath.trim().length > 0) {
            handleLaunch(apps[idx].id);
          } else {
            handleConfigureTile(apps[idx]);
          }
        }
        return;
      }

      const cols = apps.length >= 7 ? 4 : apps.length >= 5 ? 3 : 2;

      // Arrow navigation
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1 < apps.length ? i + 1 : i));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 >= 0 ? i - 1 : i));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => (i + cols < apps.length ? i + cols : i));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => (i - cols >= 0 ? i - cols : i));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (apps[selectedIndex]) {
          if (apps[selectedIndex].executablePath && apps[selectedIndex].executablePath.trim().length > 0) {
            handleLaunch(apps[selectedIndex].id);
          } else {
            handleConfigureTile(apps[selectedIndex]);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [apps, selectedIndex, isSettingsOpen, candidateState]);

  const toggleAlwaysOnTop = async () => {
    try {
      const newVal = await tauriApi.toggleAlwaysOnTop();
      setSettings((s) => ({ ...s, keepLauncherOnTop: newVal }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveSettings = async (newApps: AppConfig[], newSettings: LauncherSettings) => {
    await tauriApi.saveAllApps(newApps);
    await tauriApi.updateSettings(newSettings);
    await loadData();
    setNotification({
      type: 'success',
      message: 'AppDock configuration saved successfully.',
    });
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#101319] text-slate-100 select-none overflow-hidden font-sans border border-[#232936]">
      {/* Draggable Title Bar */}
      <TitleBar
        isAlwaysOnTop={settings.keepLauncherOnTop}
        onToggleAlwaysOnTop={toggleAlwaysOnTop}
        onOpenSettings={() => {
          setActiveConfigureAppId(null);
          setIsSettingsOpen(true);
        }}
        onAddFolder={handleAddFolderDirect}
      />

      {/* Main Grid Area */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <AppGrid
          apps={apps}
          selectedIndex={selectedIndex}
          launchingId={launchingId}
          onLaunch={handleLaunch}
          onConfigure={handleConfigureTile}
          onRemove={handleRemoveTile}
          onSelectIndex={setSelectedIndex}
          onReorderApps={handleReorderApps}
          onShiftIndex={handleShiftIndex}
        />

        {/* Bottom Status / Notification Bar */}
        <div className="h-8 min-h-[32px] px-3 bg-[#131720] border-t border-[#1f2532] flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5 overflow-hidden">
            {notification ? (
              <span
                className={`flex items-center gap-1 truncate ${
                  notification.type === 'success' ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {notification.type === 'success' ? (
                  <CheckCircle size={12} />
                ) : (
                  <AlertCircle size={12} />
                )}
                {notification.message}
              </span>
            ) : (
              <span className="text-slate-400 truncate">
                Press <kbd className="px-1 py-0.5 bg-[#202735] text-slate-300 rounded font-mono text-[10px]">1</kbd>–<kbd className="px-1 py-0.5 bg-[#202735] text-slate-300 rounded font-mono text-[10px]">{Math.max(apps.length, 1)}</kbd> or <kbd className="px-1 py-0.5 bg-[#202735] text-slate-300 rounded font-mono text-[10px]">Enter</kbd> to launch • Drag tiles to reorder
              </span>
            )}
          </div>

          <button
            onClick={loadData}
            title="Refresh availability"
            className="p-1 hover:text-slate-200 rounded hover:bg-[#1f2532] transition-colors"
          >
            <RefreshCw size={11} />
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          initialApps={apps}
          initialSettings={settings}
          activeAppId={activeConfigureAppId}
          onSave={handleSaveSettings}
          onClose={() => {
            setIsSettingsOpen(false);
            setActiveConfigureAppId(null);
          }}
          onRequestSelectCandidate={(candidates, folderName, callback) => {
            setCandidateState({
              candidates,
              folderName,
              onSelect: (c) => {
                setCandidateState(null);
                callback(c);
              },
            });
          }}
        />
      )}

      {/* Detected Executables Selection Modal */}
      {candidateState && (
        <DetectedExesModal
          candidates={candidateState.candidates}
          folderName={candidateState.folderName}
          onSelect={candidateState.onSelect}
          onCancel={() => setCandidateState(null)}
        />
      )}
    </div>
  );
}

export default App;
