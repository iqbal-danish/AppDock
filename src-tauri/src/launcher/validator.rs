use std::path::PathBuf;
use walkdir::WalkDir;

use crate::config::DetectedExecutable;

pub fn validate_executable_path(path_str: &str) -> Result<PathBuf, String> {
    let trimmed = path_str.trim();
    if trimmed.is_empty() {
        return Err("Executable path cannot be empty.".to_string());
    }

    let path = PathBuf::from(trimmed);
    if !path.exists() {
        return Err(format!("The path does not exist: {}", trimmed));
    }

    // If it's a directory, automatically discover the application executable inside it
    if path.is_dir() {
        let candidates = scan_folder_for_executables(trimmed)?;
        if let Some(primary) = candidates.first() {
            return Ok(PathBuf::from(&primary.executable_path));
        }
        return Err(format!(
            "The selected path is a directory and no executable (.exe) was found inside it: {}",
            trimmed
        ));
    }

    // Windows executable check for files
    if let Some(ext) = path.extension().and_then(|s| s.to_str()) {
        let ext_lower = ext.to_lowercase();
        if ext_lower != "exe" && ext_lower != "bat" && ext_lower != "cmd" {
            return Err(format!(
                "File '{}' does not have an executable extension (.exe, .bat, .cmd).",
                trimmed
            ));
        }
    } else {
        return Err(format!("File '{}' has no file extension.", trimmed));
    }

    Ok(path)
}

pub fn validate_working_directory(dir_str: &str) -> Result<PathBuf, String> {
    let trimmed = dir_str.trim();
    if trimmed.is_empty() {
        return Err("Working directory cannot be empty.".to_string());
    }

    let path = PathBuf::from(trimmed);
    if !path.exists() {
        return Err(format!("Working directory does not exist: {}", trimmed));
    }

    if !path.is_dir() {
        return Err(format!(
            "Working directory path is not a directory: {}",
            trimmed
        ));
    }

    Ok(path)
}

pub fn scan_folder_for_executables(folder_str: &str) -> Result<Vec<DetectedExecutable>, String> {
    let folder_path = PathBuf::from(folder_str.trim());
    if !folder_path.exists() {
        return Err(format!("Folder does not exist: {}", folder_str));
    }
    if !folder_path.is_dir() {
        return Err(format!("Path is not a directory: {}", folder_str));
    }

    let folder_name = folder_path
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("App")
        .to_string();

    let mut candidates = Vec::new();

    // Traverse folder up to depth 5
    for entry in WalkDir::new(&folder_path)
        .max_depth(5)
        .follow_links(false)
        .into_iter()
        .filter_entry(|e| {
            let file_name = e.file_name().to_string_lossy().to_lowercase();
            // Skip large unrelated or intermediate build dirs
            !(file_name == ".git"
                || file_name == "node_modules"
                || file_name == "incremental"
                || file_name == "deps"
                || file_name == "build"
                || file_name == "benches"
                || file_name == "fuzz"
                || file_name == ".cargo")
        })
        .filter_map(|e| e.ok())
    {
        let path = entry.path();
        if !path.is_file() {
            continue;
        }

        let is_exe = path
            .extension()
            .and_then(|e| e.to_str())
            .is_some_and(|ext| ext.eq_ignore_ascii_case("exe"));

        if is_exe {
            let file_name = path.file_name().unwrap().to_string_lossy().to_string();
            let lower_name = file_name.to_lowercase();

            // Ignore installers, uninstallation scripts, and build runners
            if lower_name.ends_with("-setup.exe")
                || lower_name.starts_with("unins")
                || lower_name == "uninstall.exe"
                || lower_name.contains("installer")
                || lower_name.contains("build-script-build")
                || lower_name.contains("build_script_build")
                || lower_name.contains("stress_suite")
                || lower_name.starts_with("test_")
            {
                continue;
            }

            let path_str = path.to_string_lossy().to_string();
            let lower_path = path_str.to_lowercase();

            // Determine if this is likely the primary release or main app
            let in_release =
                lower_path.contains(r"\target\release\") || lower_path.contains("/target/release/");
            let in_bin = lower_path.contains(r"\bin\") || lower_path.contains("/bin/");
            let in_root = path.parent() == Some(&folder_path);

            let is_likely_primary = in_release || in_bin || in_root;

            // Suggested display name
            let stem = path.file_stem().unwrap().to_string_lossy().to_string();
            let display_name = if is_likely_primary && !in_root {
                folder_name.clone()
            } else {
                stem
            };

            let working_dir = if let Some(parent) = path.parent() {
                parent.to_string_lossy().to_string()
            } else {
                folder_str.to_string()
            };

            candidates.push(DetectedExecutable {
                name: display_name,
                executable_path: path_str,
                working_directory: working_dir,
                is_likely_primary,
            });
        }
    }

    // Sort candidates:
    // 1. Likely primary first (e.g. target/release or root)
    // 2. Executables matching folder name
    // 3. Alphabetical
    let lower_folder = folder_name.to_lowercase();
    candidates.sort_by(|a, b| {
        let a_match = a.executable_path.to_lowercase().contains(&lower_folder);
        let b_match = b.executable_path.to_lowercase().contains(&lower_folder);

        b.is_likely_primary
            .cmp(&a.is_likely_primary)
            .then_with(|| b_match.cmp(&a_match))
            .then_with(|| a.name.cmp(&b.name))
    });

    Ok(candidates)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::tempdir;

    #[test]
    fn test_validate_nonexistent_path() {
        let result = validate_executable_path(r"C:\NonExistent\app.exe");
        assert!(result.is_err());
    }

    #[test]
    fn test_validate_empty_directory_rejected() {
        let dir = tempdir().unwrap();
        let result = validate_executable_path(dir.path().to_str().unwrap());
        assert!(result.is_err());
        assert!(
            result
                .unwrap_err()
                .contains("no executable (.exe) was found")
        );
    }

    #[test]
    fn test_validate_directory_with_exe_auto_resolves() {
        let dir = tempdir().unwrap();
        let dummy_exe = dir.path().join("myapp.exe");
        fs::write(&dummy_exe, "MZ").unwrap();

        let result = validate_executable_path(dir.path().to_str().unwrap());
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), dummy_exe);
    }

    #[test]
    fn test_validate_wrong_extension() {
        let dir = tempdir().unwrap();
        let txt_file = dir.path().join("readme.txt");
        fs::write(&txt_file, "hello").unwrap();

        let result = validate_executable_path(txt_file.to_str().unwrap());
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("executable extension"));
    }

    #[test]
    fn test_scan_folder_filtering() {
        let dir = tempdir().unwrap();
        let folder = dir.path();

        // Create dummy structure
        let release_dir = folder.join("target").join("release");
        fs::create_dir_all(&release_dir).unwrap();
        let dummy_exe = release_dir.join("mainapp.exe");
        fs::write(&dummy_exe, "MZ").unwrap();

        let build_dir = release_dir.join("build");
        fs::create_dir_all(&build_dir).unwrap();
        let build_exe = build_dir.join("build-script-build.exe");
        fs::write(&build_exe, "MZ").unwrap();

        let candidates = scan_folder_for_executables(folder.to_str().unwrap()).unwrap();
        assert_eq!(candidates.len(), 1);
        assert_eq!(candidates[0].executable_path, dummy_exe.to_str().unwrap());
    }
}
