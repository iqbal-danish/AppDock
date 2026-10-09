use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};

use super::schema::LauncherConfig;

pub fn get_default_config_path() -> PathBuf {
    if let Some(app_data) = std::env::var_os("APPDATA") {
        PathBuf::from(app_data).join("AppDock").join("config.json")
    } else if let Some(home) = std::env::var_os("USERPROFILE") {
        PathBuf::from(home)
            .join("AppData")
            .join("Roaming")
            .join("AppDock")
            .join("config.json")
    } else {
        PathBuf::from("AppDock").join("config.json")
    }
}

pub fn load_config_from_file(path: &Path) -> Result<LauncherConfig, String> {
    if !path.exists() {
        return Ok(LauncherConfig::default_config());
    }

    let contents = fs::read_to_string(path)
        .map_err(|e| format!("Failed to read configuration file: {}", e))?;

    if contents.trim().is_empty() {
        return Ok(LauncherConfig::default_config());
    }

    match serde_json::from_str::<LauncherConfig>(&contents) {
        Ok(config) => Ok(config),
        Err(e) => {
            eprintln!(
                "Configuration parse warning: {}. Attempting partial recovery or default fallback.",
                e
            );
            // Try to parse as generic JSON value to see if version migration or partial recovery is possible
            if let Ok(value) = serde_json::from_str::<serde_json::Value>(&contents) {
                let mut default = LauncherConfig::default_config();

                if let Some(settings) = value
                    .get("settings")
                    .and_then(|v| serde_json::from_value(v.clone()).ok())
                {
                    default.settings = settings;
                }

                if let Some(recovered_apps) =
                    value
                        .get("apps")
                        .and_then(|a| a.as_array())
                        .and_then(|arr| {
                            serde_json::from_value::<Vec<super::schema::AppConfig>>(
                                serde_json::Value::Array(arr.clone()),
                            )
                            .ok()
                        })
                {
                    default.apps = recovered_apps;
                }

                return Ok(default);
            }
            Err(format!(
                "Malformed configuration: {}. Safe defaults preserved.",
                e
            ))
        }
    }
}

pub fn save_config_atomic(path: &Path, config: &LauncherConfig) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create config directory {:?}: {}", parent, e))?;
    }

    let json_data = serde_json::to_string_pretty(config)
        .map_err(|e| format!("Failed to serialize config to JSON: {}", e))?;

    let tmp_path = path.with_extension("tmp");
    let bak_path = path.with_extension("bak");

    // Write to temporary file
    {
        let mut file = fs::OpenOptions::new()
            .write(true)
            .create(true)
            .truncate(true)
            .open(&tmp_path)
            .map_err(|e| format!("Failed to open temp file {:?}: {}", tmp_path, e))?;

        file.write_all(json_data.as_bytes())
            .map_err(|e| format!("Failed to write to temp file: {}", e))?;

        file.sync_all()
            .map_err(|e| format!("Failed to sync temp file: {}", e))?;
    }

    // Windows atomic replacement:
    // If target exists, backup first, then rename tmp to target
    if path.exists() {
        let _ = fs::remove_file(&bak_path);
        if let Err(e) = fs::rename(path, &bak_path) {
            let _ = fs::remove_file(&tmp_path);
            return Err(format!("Failed to rotate existing config to backup: {}", e));
        }

        if let Err(e) = fs::rename(&tmp_path, path) {
            // Restore from backup
            let _ = fs::rename(&bak_path, path);
            let _ = fs::remove_file(&tmp_path);
            return Err(format!("Failed to activate new config: {}", e));
        }

        let _ = fs::remove_file(&bak_path);
    } else {
        if let Err(e) = fs::rename(&tmp_path, path) {
            let _ = fs::remove_file(&tmp_path);
            return Err(format!("Failed to write initial config: {}", e));
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::tempdir;

    #[test]
    fn test_first_run_default_config() {
        let dir = tempdir().unwrap();
        let non_existent = dir.path().join("does_not_exist.json");
        let config = load_config_from_file(&non_existent).unwrap();

        assert_eq!(config.version, 1);
        assert_eq!(config.apps.len(), 4);
        assert_eq!(config.apps[0].id, "atlas");
        assert_eq!(config.apps[1].id, "paperforge");
        assert_eq!(config.apps[2].id, "transformlab");
        assert_eq!(config.apps[3].id, "fourth-app");
        assert!(config.settings.close_after_launch);
        assert!(!config.settings.keep_launcher_on_top);
    }

    #[test]
    fn test_atomic_save_and_reload() {
        let dir = tempdir().unwrap();
        let config_path = dir.path().join("config.json");

        let mut config = LauncherConfig::default_config();
        config.apps[0].executable_path = Some(r"C:\Tools\Atlas\atlas.exe".to_string());
        config.settings.close_after_launch = false;
        config.settings.keep_launcher_on_top = true;

        save_config_atomic(&config_path, &config).expect("Save should succeed");
        assert!(config_path.exists());

        let loaded = load_config_from_file(&config_path).expect("Load should succeed");
        assert_eq!(
            loaded.apps[0].executable_path,
            Some(r"C:\Tools\Atlas\atlas.exe".to_string())
        );
        assert!(!loaded.settings.close_after_launch);
        assert!(loaded.settings.keep_launcher_on_top);
    }

    #[test]
    fn test_missing_fields_and_version_recovery() {
        let dir = tempdir().unwrap();
        let config_path = dir.path().join("config.json");

        // Simulating future version or schema with extra fields and missing optional arguments
        let json_with_partial_fields = r#"{
            "version": 2,
            "settings": {
                "closeAfterLaunch": false,
                "keepLauncherOnTop": true
            },
            "apps": [
                {
                    "id": "my_custom_tool",
                    "name": "Custom Tool",
                    "executablePath": "C:\\Tools\\custom.exe"
                }
            ]
        }"#;

        fs::write(&config_path, json_with_partial_fields).unwrap();
        let loaded =
            load_config_from_file(&config_path).expect("Should recover valid partial config");

        assert_eq!(loaded.apps.len(), 1);
        assert_eq!(loaded.apps[0].id, "my_custom_tool");
        assert_eq!(loaded.apps[0].name, "Custom Tool");
        assert_eq!(loaded.apps[0].arguments.len(), 0); // Defaulted
        assert!(loaded.apps[0].enabled); // Defaulted to true
        assert!(!loaded.settings.close_after_launch);
        assert!(loaded.settings.keep_launcher_on_top);
    }

    #[test]
    fn test_malformed_unparseable_json_error() {
        let dir = tempdir().unwrap();
        let config_path = dir.path().join("config.json");

        fs::write(&config_path, "{ broken invalid json }").unwrap();
        let result = load_config_from_file(&config_path);
        assert!(result.is_err());
    }
}
