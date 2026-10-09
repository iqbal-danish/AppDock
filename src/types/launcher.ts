export type AppStatus = 'ready' | 'notConfigured' | 'missingExecutable' | 'disabled';

export interface AppConfig {
  id: string;
  name: string;
  executablePath: string | null;
  arguments: string[];
  workingDirectory: string | null;
  iconPath: string | null;
  enabled: boolean;
}

export interface AppTileState {
  id: string;
  name: string;
  executablePath: string | null;
  arguments: string[];
  workingDirectory: string | null;
  iconPath: string | null;
  enabled: boolean;
  status: AppStatus;
  statusMessage: string | null;
}

export interface LauncherSettings {
  closeAfterLaunch: boolean;
  keepLauncherOnTop: boolean;
}

export interface DetectedExecutable {
  name: string;
  executablePath: string;
  workingDirectory: string;
  isLikelyPrimary: boolean;
}

export interface LaunchResult {
  appId: string;
  appName: string;
  pid: number;
  message: string;
}
