# AppDock — Unified Windows Desktop Launcher

AppDock is a fast, lightweight, and modern Windows desktop launcher built with **Rust**, **Tauri 2**, **React 19**, **TypeScript**, and **Tailwind CSS**.

It replaces cluttered Windows taskbar icons with a single pinned launcher dock, allowing you to launch, manage, and reorder all your portable tools and applications with one click.

---

## ✨ Key Features

- **Single Pinned Taskbar Entry**: Consolidates multiple independent portable applications into a single dock window.
- **Detached Process Management**: Applications launch fully detached from AppDock using Windows native `CREATE_NEW_PROCESS_GROUP | DETACHED_PROCESS` flags. Closing AppDock never terminates running child applications.
- **Auto-Close on Launch**: Automatically minimizes or closes AppDock after starting an app by default (configurable toggle to keep launcher open).
- **Fast Startup Performance**:
  - **Warm Launch**: ~10–12 ms
  - **Cold Launch**: Under 0.3s
- **Interactive Drag-and-Drop Reordering**:
  - Pointer-driven drag engine (works reliably in Windows desktop webviews without OLE drag cancellation).
  - Real-time visual drop indicators ("Move here").
  - Alternative one-click shift buttons (`←` / `→`) on each tile.
- **Folder Executable Auto-Discovery**: Select an application root directory and AppDock automatically discovers the primary `.exe`.
- **Keyboard Navigation**:
  - Launch apps directly with keys `1`–`9` or `Enter`.
  - Navigate tiles using `Arrow Keys`.
  - Open Settings with `Ctrl + ,`.
  - Close or dismiss with `Escape`.
- **Local-Only & Privacy-Friendly**:
  - Zero cloud dependencies, zero telemetry, zero analytics.
  - Configuration saved atomically to `%APPDATA%\AppDock\config.json`.

---

## 🛠️ Prerequisites & Dependencies

Before building or running AppDock, ensure your system has:

1. **Operating System**: Windows 10 or Windows 11 (64-bit).
2. **Rust Toolchain**:
   - Rust 1.75+ with the MSVC toolchain (`x86_64-pc-windows-msvc`).
   - Install via [rustup.rs](https://rustup.rs/).
   - Microsoft C++ Build Tools (included with Visual Studio or Visual Studio Build Tools).
3. **Node.js**:
   - Node.js LTS (v18, v20, or v22) and `npm`.
   - Install from [nodejs.org](https://nodejs.org/).
4. **WebView2 Runtime**:
   - Pre-installed on Windows 10 and Windows 11.

---

## 🚀 How to Run & Develop

### 1. Clone the Repository
```powershell
git clone https://github.com/iqbal-danish/AppDock.git
cd AppDock
```

### 2. Install Frontend Dependencies
```powershell
npm install
```

### 3. Run in Development Mode
To start the live-reload development environment:
```powershell
npx tauri dev
```
This runs Vite on `http://localhost:1420` and launches the native Tauri desktop window with hot reloading.

---

## 📦 How to Build the Production Application

### Build Standalone Executable (Fastest)
To compile an optimized, standalone executable without generating Windows installers:
```powershell
npx @tauri-apps/cli build --no-bundle
```
The compiled binary will be located at:
```
src-tauri/target/release/appdock.exe
```

### Copy to Root & Run
```powershell
Copy-Item src-tauri\target\release\appdock.exe .\AppDock.exe -Force
.\AppDock.exe
```

### Pinning to Windows Taskbar
1. Build or locate [`AppDock.exe`](AppDock.exe).
2. Right-click `AppDock.exe` and select **Pin to taskbar** (or drag `AppDock.exe` onto the Windows taskbar).

---

## 🧪 Running Automated Tests

### Frontend Unit Tests (Vitest)
```powershell
npm run test
```

### Backend Rust Tests
```powershell
cargo test --manifest-path src-tauri/Cargo.toml
```

---

## ⚙️ Configuration File Structure

AppDock stores its local configuration at:
```
%APPDATA%\AppDock\config.json
```

Example schema:
```json
{
  "version": 1,
  "settings": {
    "closeAfterLaunch": true,
    "keepLauncherOnTop": false
  },
  "apps": [
    {
      "id": "atlas",
      "name": "Atlas File Manager",
      "executablePath": "C:\\Tools\\Atlas\\Atlas.exe",
      "arguments": [],
      "workingDirectory": "C:\\Tools\\Atlas",
      "iconPath": null,
      "enabled": true
    }
  ]
}
```

---

## 📄 License

MIT License. Local personal utility built for fast portable application launching.
