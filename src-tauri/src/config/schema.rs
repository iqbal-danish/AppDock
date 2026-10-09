use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct LauncherConfig {
    pub version: u32,
    pub settings: LauncherSettings,
    pub apps: Vec<AppConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct LauncherSettings {
    pub close_after_launch: bool,
    pub keep_launcher_on_top: bool,
}

impl Default for LauncherSettings {
    fn default() -> Self {
        Self {
            close_after_launch: true,
            keep_launcher_on_top: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub id: String,
    pub name: String,
    pub executable_path: Option<String>,
    #[serde(default)]
    pub arguments: Vec<String>,
    pub working_directory: Option<String>,
    pub icon_path: Option<String>,
    #[serde(default = "default_enabled")]
    pub enabled: bool,
}

fn default_enabled() -> bool {
    true
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum AppStatus {
    Ready,
    NotConfigured,
    MissingExecutable,
    Disabled,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct AppTileState {
    pub id: String,
    pub name: String,
    pub executable_path: Option<String>,
    pub arguments: Vec<String>,
    pub working_directory: Option<String>,
    pub icon_path: Option<String>,
    pub enabled: bool,
    pub status: AppStatus,
    pub status_message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct DetectedExecutable {
    pub name: String,
    pub executable_path: String,
    pub working_directory: String,
    pub is_likely_primary: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct LaunchResult {
    pub app_id: String,
    pub app_name: String,
    pub pid: u32,
    pub message: String,
}

impl LauncherConfig {
    pub fn default_config() -> Self {
        Self {
            version: 1,
            settings: LauncherSettings::default(),
            apps: vec![
                AppConfig {
                    id: "atlas".to_string(),
                    name: "Atlas File Manager".to_string(),
                    executable_path: None,
                    arguments: vec![],
                    working_directory: None,
                    icon_path: None,
                    enabled: true,
                },
                AppConfig {
                    id: "paperforge".to_string(),
                    name: "PaperForge".to_string(),
                    executable_path: None,
                    arguments: vec![],
                    working_directory: None,
                    icon_path: None,
                    enabled: true,
                },
                AppConfig {
                    id: "transformlab".to_string(),
                    name: "TransformLab".to_string(),
                    executable_path: None,
                    arguments: vec![],
                    working_directory: None,
                    icon_path: None,
                    enabled: true,
                },
                AppConfig {
                    id: "fourth-app".to_string(),
                    name: "Custom Application".to_string(),
                    executable_path: None,
                    arguments: vec![],
                    working_directory: None,
                    icon_path: None,
                    enabled: true,
                },
            ],
        }
    }
}
