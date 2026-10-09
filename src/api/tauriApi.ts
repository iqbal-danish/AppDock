import { invoke } from '@tauri-apps/api/core';
import {
  AppConfig,
  AppTileState,
  DetectedExecutable,
  LaunchResult,
  LauncherSettings,
} from '../types/launcher';

export const tauriApi = {
  getApps: async (): Promise<AppTileState[]> => {
    return await invoke<AppTileState[]>('get_apps');
  },

  launchApp: async (id: string): Promise<LaunchResult> => {
    return await invoke<LaunchResult>('launch_app', { id });
  },

  testLaunchApp: async (id: string): Promise<LaunchResult> => {
    return await invoke<LaunchResult>('test_launch_app', { id });
  },

  getSettings: async (): Promise<LauncherSettings> => {
    return await invoke<LauncherSettings>('get_settings');
  },

  updateSettings: async (settings: LauncherSettings): Promise<void> => {
    return await invoke<void>('update_settings', { settings });
  },

  updateApp: async (app: AppConfig): Promise<void> => {
    return await invoke<void>('update_app', { app });
  },

  saveAllApps: async (apps: AppConfig[]): Promise<void> => {
    return await invoke<void>('save_all_apps', { apps });
  },

  deleteApp: async (id: string): Promise<void> => {
    return await invoke<void>('delete_app', { id });
  },

  selectExecutableDialog: async (): Promise<string | null> => {
    return await invoke<string | null>('select_executable_dialog');
  },

  selectFolderDialog: async (title?: string): Promise<string | null> => {
    return await invoke<string | null>('select_folder_dialog', { title });
  },

  selectIconDialog: async (): Promise<string | null> => {
    return await invoke<string | null>('select_icon_dialog');
  },

  detectExecutablesInFolder: async (
    folderPath: string
  ): Promise<DetectedExecutable[]> => {
    return await invoke<DetectedExecutable[]>('detect_executables_in_folder', {
      folderPath,
    });
  },

  autoDetectInstalledApps: async (): Promise<AppTileState[]> => {
    return await invoke<AppTileState[]>('auto_detect_installed_apps');
  },

  closeWindow: async (): Promise<void> => {
    return await invoke<void>('close_window');
  },

  minimizeWindow: async (): Promise<void> => {
    return await invoke<void>('minimize_window');
  },

  toggleAlwaysOnTop: async (): Promise<boolean> => {
    return await invoke<boolean>('toggle_always_on_top');
  },

  startDragging: async (): Promise<void> => {
    return await invoke<void>('start_dragging');
  },
};
