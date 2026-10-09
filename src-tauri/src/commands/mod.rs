use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::{State, Window};

use crate::config::{
    AppConfig, AppStatus, AppTileState, DetectedExecutable, LaunchResult, LauncherConfig,
    LauncherSettings, load_config_from_file, save_config_atomic,
};
use crate::launcher::{launch_application, scan_folder_for_executables, validate_executable_path};

pub struct AppDockState {
    pub config_path: PathBuf,
    pub config: Arc<Mutex<LauncherConfig>>,
}

impl AppDockState {
    pub fn new(config_path: PathBuf) -> Self {
        let mut config = match load_config_from_file(&config_path) {
            Ok(cfg) => cfg,
            Err(err) => {
                eprintln!("Using default configuration due to error: {}", err);
                LauncherConfig::default_config()
            }
        };

        // Only auto-discover if apps list is empty or any app has an empty executable path
        let needs_discovery = config.apps.is_empty()
            || config
                .apps
                .iter()
                .any(|a| a.executable_path.as_deref().unwrap_or("").trim().is_empty());

        if needs_discovery {
            auto_populate_user_apps(&mut config);
            let _ = save_config_atomic(&config_path, &config);
        }

        Self {
            config_path,
            config: Arc::new(Mutex::new(config)),
        }
    }
}

fn auto_populate_user_apps(config: &mut LauncherConfig) {
    let home_dir = std::env::var_os("USERPROFILE")
        .map(PathBuf::from)
        .unwrap_or_else(|| PathBuf::from(r"C:\Users\diqbal"));

    let search_folders = [
        ("atlas", "Atlas File Manager", "Atlas"),
        ("transformlab", "TransformLab", "TransformLab"),
        ("paperforge", "PaperForge", "PaperForge"),
        ("feedlens", "FeedLens", "FeedLens"),
        ("netscan", "NetScan", "NetScan"),
        ("serverdock", "ServerDock", "ServerDock"),
    ];

    for (id, name, folder_name) in search_folders {
        // Skip scanning if this app already has an executable path configured
        if let Some(existing) = config
            .apps
            .iter()
            .find(|a| a.id == id || a.name.to_lowercase() == name.to_lowercase())
        {
            if existing
                .executable_path
                .as_deref()
                .unwrap_or("")
                .trim()
                .len()
                > 0
            {
                continue;
            }
        }
        let app_dir = home_dir.join(folder_name);
        if app_dir.exists() && app_dir.is_dir() {
            if let Ok(candidates) = scan_folder_for_executables(&app_dir.to_string_lossy()) {
                if let Some(best) = candidates.first() {
                    if let Some(existing) = config
                        .apps
                        .iter_mut()
                        .find(|a| a.id == id || a.name.to_lowercase() == name.to_lowercase())
                    {
                        if existing.executable_path.is_none()
                            || existing
                                .executable_path
                                .as_deref()
                                .unwrap_or("")
                                .trim()
                                .is_empty()
                        {
                            existing.executable_path = Some(best.executable_path.clone());
                            existing.working_directory = Some(best.working_directory.clone());
                        }
                    } else if config.apps.len() < 6 {
                        config.apps.push(AppConfig {
                            id: id.to_string(),
                            name: name.to_string(),
                            executable_path: Some(best.executable_path.clone()),
                            arguments: vec![],
                            working_directory: Some(best.working_directory.clone()),
                            icon_path: None,
                            enabled: true,
                        });
                    }
                }
            }
        }
    }
}

#[tauri::command]
pub fn get_apps(state: State<'_, AppDockState>) -> Result<Vec<AppTileState>, String> {
    let config = state.config.lock().map_err(|e| e.to_string())?;

    let tiles = config
        .apps
        .iter()
        .map(|app| {
            let (status, msg) = if !app.enabled {
                (
                    AppStatus::Disabled,
                    Some("Application is disabled.".to_string()),
                )
            } else if app
                .executable_path
                .as_deref()
                .unwrap_or("")
                .trim()
                .is_empty()
            {
                (
                    AppStatus::NotConfigured,
                    Some("Executable path is not configured.".to_string()),
                )
            } else {
                let path_str = app.executable_path.as_deref().unwrap();
                match validate_executable_path(path_str) {
                    Ok(_) => (AppStatus::Ready, None),
                    Err(err) => (AppStatus::MissingExecutable, Some(err)),
                }
            };

            AppTileState {
                id: app.id.clone(),
                name: app.name.clone(),
                executable_path: app.executable_path.clone(),
                arguments: app.arguments.clone(),
                working_directory: app.working_directory.clone(),
                icon_path: app.icon_path.clone(),
                enabled: app.enabled,
                status,
                status_message: msg,
            }
        })
        .collect();

    Ok(tiles)
}

#[tauri::command]
pub fn launch_app(
    id: String,
    window: Window,
    state: State<'_, AppDockState>,
) -> Result<LaunchResult, String> {
    let (app_to_launch, close_after) = {
        let config = state.config.lock().map_err(|e| e.to_string())?;
        let app = config
            .apps
            .iter()
            .find(|a| a.id == id)
            .ok_or_else(|| format!("Application with ID '{}' not found in configuration.", id))?
            .clone();

        if !app.enabled {
            return Err(format!("Application '{}' is disabled.", app.name));
        }

        (app, config.settings.close_after_launch)
    };

    let result = launch_application(&app_to_launch)?;

    // If configured to close after launch, exit or close window
    if close_after {
        let _ = window.close();
    }

    Ok(result)
}

#[tauri::command]
pub fn test_launch_app(id: String, state: State<'_, AppDockState>) -> Result<LaunchResult, String> {
    let app_to_launch = {
        let config = state.config.lock().map_err(|e| e.to_string())?;
        config
            .apps
            .iter()
            .find(|a| a.id == id)
            .ok_or_else(|| format!("Application with ID '{}' not found.", id))?
            .clone()
    };

    // Test launch never closes the launcher
    launch_application(&app_to_launch)
}

#[tauri::command]
pub fn get_settings(state: State<'_, AppDockState>) -> Result<LauncherSettings, String> {
    let config = state.config.lock().map_err(|e| e.to_string())?;
    Ok(config.settings.clone())
}

#[tauri::command]
pub fn update_settings(
    settings: LauncherSettings,
    window: Window,
    state: State<'_, AppDockState>,
) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| e.to_string())?;
    config.settings = settings.clone();
    save_config_atomic(&state.config_path, &config)?;

    // Synchronize window always_on_top state
    let _ = window.set_always_on_top(settings.keep_launcher_on_top);

    Ok(())
}

#[tauri::command]
pub fn update_app(app: AppConfig, state: State<'_, AppDockState>) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| e.to_string())?;
    if let Some(existing) = config.apps.iter_mut().find(|a| a.id == app.id) {
        *existing = app;
    } else {
        config.apps.push(app);
    }
    save_config_atomic(&state.config_path, &config)?;
    Ok(())
}

#[tauri::command]
pub fn save_all_apps(apps: Vec<AppConfig>, state: State<'_, AppDockState>) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| e.to_string())?;
    config.apps = apps;
    save_config_atomic(&state.config_path, &config)?;
    Ok(())
}

#[tauri::command]
pub fn delete_app(id: String, state: State<'_, AppDockState>) -> Result<(), String> {
    let mut config = state.config.lock().map_err(|e| e.to_string())?;
    config.apps.retain(|a| a.id != id);
    save_config_atomic(&state.config_path, &config)?;
    Ok(())
}

#[tauri::command]
pub fn auto_detect_installed_apps(
    state: State<'_, AppDockState>,
) -> Result<Vec<AppTileState>, String> {
    {
        let mut config = state.config.lock().map_err(|e| e.to_string())?;
        auto_populate_user_apps(&mut config);
        save_config_atomic(&state.config_path, &config)?;
    }
    get_apps(state)
}

#[tauri::command]
pub fn select_executable_dialog() -> Result<Option<String>, String> {
    let file = rfd::FileDialog::new()
        .set_title("Select Application Executable")
        .add_filter(
            "Executable Files (*.exe, *.bat, *.cmd)",
            &["exe", "bat", "cmd"],
        )
        .pick_file();

    Ok(file.map(|p| p.to_string_lossy().to_string()))
}

#[tauri::command]
pub fn select_folder_dialog(title: Option<String>) -> Result<Option<String>, String> {
    let dialog_title = title.unwrap_or_else(|| "Select Folder".to_string());
    let folder = rfd::FileDialog::new()
        .set_title(&dialog_title)
        .pick_folder();

    Ok(folder.map(|p| p.to_string_lossy().to_string()))
}

#[tauri::command]
pub fn select_icon_dialog() -> Result<Option<String>, String> {
    let file = rfd::FileDialog::new()
        .set_title("Select Application Icon")
        .add_filter("Image Files (*.ico, *.png, *.svg)", &["ico", "png", "svg"])
        .pick_file();

    Ok(file.map(|p| p.to_string_lossy().to_string()))
}

#[tauri::command]
pub fn detect_executables_in_folder(
    folder_path: String,
) -> Result<Vec<DetectedExecutable>, String> {
    scan_folder_for_executables(&folder_path)
}

#[tauri::command]
pub fn close_window(window: Window) -> Result<(), String> {
    window.close().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn minimize_window(window: Window) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn start_dragging(window: Window) -> Result<(), String> {
    window.start_dragging().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn toggle_always_on_top(
    window: Window,
    state: State<'_, AppDockState>,
) -> Result<bool, String> {
    let mut config = state.config.lock().map_err(|e| e.to_string())?;
    let new_val = !config.settings.keep_launcher_on_top;
    config.settings.keep_launcher_on_top = new_val;
    save_config_atomic(&state.config_path, &config)?;
    let _ = window.set_always_on_top(new_val);
    Ok(new_val)
}

