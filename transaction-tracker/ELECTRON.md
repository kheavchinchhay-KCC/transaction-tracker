# Transaction Tracker (Electron Desktop Application)

This is a premium, offline-first transaction tracker transformed into a native, high-performance desktop application using **Electron** and **React + Vite**. It tracks local cash flow, pastes and parses bank transactions, and processes duplicates, storing everything locally on the desktop.

---

## ⚡ Features

- **Built with Electron & Vite**: Experience instantaneous load times and smooth native window controls.
- **Strictly Local JSON Database**: All transaction records are saved locally directly in your operating system's sandbox application directory (`transactions.json`) instead of inside volatile browser registers. This prevents loss of session history even if you reset browser caches or delete junk files.
- **Fully Offline**: Works perfectly without cloud connection, third-party databases, or data leaks.
- **Responsive Theme Support**: Responsive dark-mode and light-mode designed for long business hours.
- **Multilingual UI**: Fully localized english and cambodian (Khmer standard translation) configurations.
- **Excel & API Compatible**: Export full structured data as Excel-optimized CSV (equipped with UTF-8 BOM encoding for perfect Khmer characters rendering in Excel) or structured JSON formats instantly.

---

## 🛠️ Prerequisites

Before starting, ensure you have the following installed on your machine:

- **Node.js**: [v18.0.0 or higher](https://nodejs.org/) (Recommended: LTS v20+)
- **NPM Package Manager** (Typically pre-installed with Node.js)

---

## 📦 Getting Started & Installation

### 1. Extract the bundle & Install Dependencies
Open your cmd or terminal, navigate to the extracted repository folder, and install all required files:
```bash
npm install
```

### 2. Live Desktop Development Mode
Launches the concurrent React frontend and connects Electron wrapper process. Hot reloading is activated for frontend code:
```bash
# Terminal - Start the desktop UI shell
npm run electron:dev
```

---

## 🏗️ Building and Packing the Windows Application (`.exe`)

To compile the application code and create a production-ready **Windows installer** (`.exe`) package, execute the following build instructions:

```bash
# Package the software natively for Windows OS
npm run electron:build
```

### What happens during compile?
1. `vite build` bundles the highly optimized React single-page application into the local `/dist` folder with relative assets (`./`).
2. `electron-builder` packages the application files (`/dist/**/*`, `/electron/**/*`, `package.json`) into a self-contained, lightweight `.exe` installer.
3. The resulting `.exe` setup installer file and unpacked files will be saved in the **`dist-electron/`** directory.

---

## 📁 Where is my file data saved?

To guarantee safety, the application stores your transaction entries in the operating system's native environment application data section. The physical JSON file is stored at:

- **Windows**: `C:\Users\<Your_Username>\AppData\Roaming\Transaction Tracker\transactions.json`
- **macOS**: `/Users/<Your_Username>/Library/Application Support/Transaction Tracker/transactions.json`
- **Linux**: `~/.config/Transaction Tracker/transactions.json`

Because it is saved to your standard hard disk system, you can easily copy, backup, restore, or clear this file manually whenever necessary!

---

## 🗒️ App Development Structure

- **`/electron/main.cjs`**: Electron main process. Initializes window parameters and handles state persistence IPC triggers.
- **`/electron/preload.cjs`**: Exposes secure native file APIs to the React client via Electron's sandbox-ready `contextBridge`.
- **`/src/utils/db.ts`**: High-performance local storage dispatcher. Automatically detects whether the app is running in a browser environment (uses IndexedDB / localStorage fallbacks) or inside the native Electron wrapper (engages direct OS file writing IPC), creating a unified, robust codebase.
