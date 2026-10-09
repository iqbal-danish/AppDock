use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};

use super::validator::{validate_executable_path, validate_working_directory};
use crate::config::{AppConfig, LaunchResult};

pub fn launch_application(app: &AppConfig) -> Result<LaunchResult, String> {
    let raw_path = match &app.executable_path {
        Some(p) if !p.trim().is_empty() => p,
        _ => {
            return Err(format!(
                "Application '{}' has no executable path configured.",
                app.name
            ));
        }
    };

    let exe_path = validate_executable_path(raw_path)?;

    // Determine working directory
    let working_dir = if let Some(custom_dir) = &app.working_directory {
        if !custom_dir.trim().is_empty() {
            validate_working_directory(custom_dir)?
        } else {
            get_fallback_working_dir(&exe_path)
        }
    } else {
        get_fallback_working_dir(&exe_path)
    };

    let mut cmd = Command::new(&exe_path);

    // Pass separate arguments directly without shell interpretation
    cmd.args(&app.arguments);
    cmd.current_dir(&working_dir);

    // Detach process and prevent inheritance of standard streams
    cmd.stdin(Stdio::null());
    cmd.stdout(Stdio::null());
    cmd.stderr(Stdio::null());

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        // CREATE_NEW_PROCESS_GROUP = 0x00000200
        // DETACHED_PROCESS = 0x00000008
        const CREATE_NEW_PROCESS_GROUP: u32 = 0x00000200;
        const DETACHED_PROCESS: u32 = 0x00000008;
        cmd.creation_flags(CREATE_NEW_PROCESS_GROUP | DETACHED_PROCESS);
    }

    match cmd.spawn() {
        Ok(child) => {
            let pid = child.id();
            Ok(LaunchResult {
                app_id: app.id.clone(),
                app_name: app.name.clone(),
                pid,
                message: format!("Successfully started '{}' (PID: {})", app.name, pid),
            })
        }
        Err(e) => Err(format!(
            "Failed to start executable '{}': {}",
            exe_path.display(),
            e
        )),
    }
}

fn get_fallback_working_dir(exe_path: &Path) -> PathBuf {
    exe_path
        .parent()
        .map(|p| p.to_path_buf())
        .unwrap_or_else(|| PathBuf::from("."))
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;

    #[test]
    fn test_launch_unconfigured_fails() {
        let app = AppConfig {
            id: "test".to_string(),
            name: "Test App".to_string(),
            executable_path: None,
            arguments: vec![],
            working_directory: None,
            icon_path: None,
            enabled: true,
        };
        let res = launch_application(&app);
        assert!(res.is_err());
        assert!(res.unwrap_err().contains("no executable path configured"));
    }

    #[test]
    fn test_launch_nonexistent_executable_fails() {
        let app = AppConfig {
            id: "test".to_string(),
            name: "Test App".to_string(),
            executable_path: Some(r"C:\NonExistent\nonexistent.exe".to_string()),
            arguments: vec![],
            working_directory: None,
            icon_path: None,
            enabled: true,
        };
        let res = launch_application(&app);
        assert!(res.is_err());
        assert!(res.unwrap_err().contains("does not exist"));
    }

    #[test]
    fn test_launch_invalid_working_directory_fails() {
        let where_exe = PathBuf::from(r"C:\Windows\System32\where.exe");
        if where_exe.exists() {
            let app = AppConfig {
                id: "test_dir".to_string(),
                name: "Test".to_string(),
                executable_path: Some(where_exe.to_string_lossy().to_string()),
                arguments: vec![],
                working_directory: Some(r"C:\NonExistent\Folder123456".to_string()),
                icon_path: None,
                enabled: true,
            };
            let res = launch_application(&app);
            assert!(res.is_err());
            assert!(
                res.unwrap_err()
                    .contains("Working directory does not exist")
            );
        }
    }

    #[test]
    fn test_path_with_spaces_and_non_ascii() {
        let dir = tempdir().unwrap();
        // Create folder with spaces and unicode characters
        let space_dir = dir.path().join("Folder With Spaces and 日本語");
        fs::create_dir_all(&space_dir).unwrap();
        let dummy_exe = space_dir.join("app test.exe");
        fs::write(&dummy_exe, "MZ").unwrap();

        // Path validation must accept this
        let validated = validate_executable_path(dummy_exe.to_str().unwrap());
        assert!(validated.is_ok());
        assert_eq!(validated.unwrap(), dummy_exe);

        // Fallback working directory must match space dir
        let fallback = get_fallback_working_dir(&dummy_exe);
        assert_eq!(fallback, space_dir);
    }

    #[test]
    fn test_no_shell_command_injection() {
        // Arguments containing shell metacharacters must be treated as literal args
        let where_exe = PathBuf::from(r"C:\Windows\System32\where.exe");
        if where_exe.exists() {
            let app = AppConfig {
                id: "safe_args".to_string(),
                name: "Safe Args Test".to_string(),
                executable_path: Some(where_exe.to_string_lossy().to_string()),
                arguments: vec!["& echo injected | more".to_string(), "cmd.exe".to_string()],
                working_directory: None,
                icon_path: None,
                enabled: true,
            };
            let res = launch_application(&app);
            // Must succeed safely by executing where.exe directly with literal string args, without invoking a shell
            assert!(res.is_ok());
        }
    }
}
