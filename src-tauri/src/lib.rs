pub mod commands;
pub mod config;
pub mod launcher;

use commands::AppDockState;
use config::get_default_config_path;
use tauri::Manager;

pub fn run() {
    let config_path = get_default_config_path();
    let state = AppDockState::new(config_path);

    tauri::Builder::default()
        .manage(state)
        .setup(|app| {
            // Apply initial always_on_top state to main window
            if let Some(main_win) = app.get_webview_window("main") {
                let state: tauri::State<AppDockState> = app.state();
                if let Ok(cfg) = state.config.lock() {
                    let _ = main_win.set_always_on_top(cfg.settings.keep_launcher_on_top);
                }
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_apps,
            commands::launch_app,
            commands::test_launch_app,
            commands::get_settings,
            commands::update_settings,
            commands::update_app,
            commands::save_all_apps,
            commands::delete_app,
            commands::select_executable_dialog,
            commands::select_folder_dialog,
            commands::select_icon_dialog,
            commands::detect_executables_in_folder,
            commands::auto_detect_installed_apps,
            commands::close_window,
            commands::minimize_window,
            commands::toggle_always_on_top,
            commands::start_dragging
        ])
        .run(tauri::generate_context!())
        .expect("error while running AppDock application");
}
