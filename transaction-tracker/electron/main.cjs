/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Path to store physical transactions database locally on user's disk
const DATA_FILE = path.join(app.getPath('userData'), 'transactions.json');

// Helper to safely read from local database file
function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(content) || [];
    }
  } catch (err) {
    console.error('Electron main read data file failure:', err);
  }
  return [];
}

// Helper to safely write to local database file
function writeData(data) {
  try {
    // Ensure parent directories exist
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Electron main write data file failure:', err);
  }
}

// Initialize electron IPC handlers
ipcMain.handle('get-transactions', () => {
  return readData();
});

ipcMain.handle('save-transactions', (event, txsToUpsert) => {
  const existing = readData();
  const map = new Map(existing.map((t) => [t.id, t]));
  txsToUpsert.forEach((t) => map.set(t.id, t));
  writeData(Array.from(map.values()));
  return true;
});

ipcMain.handle('delete-transaction', (event, id) => {
  const existing = readData();
  const filtered = existing.filter((t) => t.id !== id);
  writeData(filtered);
  return true;
});

ipcMain.handle('clear-all-transactions', () => {
  writeData([]);
  return true;
});

// Window creation
function createWindow() {
  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

  const win = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 800,
    minHeight: 600,
    title: 'Transaction Tracker',
    autoHideMenuBar: true,
    backgroundColor: '#ffffff',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    },
  });

  if (isDev) {
    // Use fallback local dev hosting or pass in dynamic dev port
    win.loadURL(process.env.VITE_DEV_SERVER_URL || 'http://localhost:3000');
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
