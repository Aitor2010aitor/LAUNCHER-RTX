const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');
const koffi = require('koffi');

let mainWindow;

// ============================================================
// CONFIG
// ============================================================
const MODS_DIR = app.isPackaged
  ? path.join(process.resourcesPath, 'mods')
  : path.join(__dirname, 'mods');
const APP_VERSION = app.getVersion();

// ============================================================
// KOFFI - WIN32 API
// ============================================================
const PROCESS_ALL_ACCESS = 0x1F0FFF;
const MEM_COMMIT = 0x1000;
const MEM_RESERVE = 0x2000;
const PAGE_EXECUTE_READWRITE = 0x40;
const MEM_RELEASE = 0x8000;
const TH32CS_SNAPPROCESS = 0x00000002;

const PROCESSENTRY32W = koffi.struct('PROCESSENTRY32W', {
  dwSize: 'uint32',
  cntUsage: 'uint32',
  th32ProcessID: 'uint32',
  th32DefaultHeapID: 'uint64',
  th32ModuleID: 'uint32',
  th32ThreadCount: 'uint32',
  th32ParentProcessID: 'uint32',
  pcPriClassBase: 'int32',
  dwFlags: 'uint32',
  szExeFile: koffi.array('char16_t', 260),
});

const PDWORD = koffi.pointer('uint32');

let libOpenProcess, libCloseHandle, libVirtualAllocEx, libVirtualFreeEx;
let libWriteProcessMemory, libCreateRemoteThread, libWaitForSingleObject;
let libGetModuleHandleA, libGetProcAddress;
let libCreateToolhelp32Snapshot, libProcess32FirstW, libProcess32NextW;

function initWin32() {
  try {
    const kernel32 = koffi.load('kernel32.dll');
    libOpenProcess = kernel32.func('OpenProcess', 'void*', ['uint32', 'bool', 'uint32']);
    libCloseHandle = kernel32.func('CloseHandle', 'bool', ['void*']);
    libVirtualAllocEx = kernel32.func('VirtualAllocEx', 'void*', ['void*', 'void*', 'uint64', 'uint32', 'uint32']);
    libVirtualFreeEx = kernel32.func('VirtualFreeEx', 'bool', ['void*', 'void*', 'uint64', 'uint32']);
    libWriteProcessMemory = kernel32.func('WriteProcessMemory', 'bool', ['void*', 'void*', 'void*', 'uint64', PDWORD]);
    libCreateRemoteThread = kernel32.func('CreateRemoteThread', 'void*', ['void*', 'void*', 'uint64', 'void*', 'void*', 'uint32', PDWORD]);
    libWaitForSingleObject = kernel32.func('WaitForSingleObject', 'uint32', ['void*', 'uint32']);
    libGetModuleHandleA = kernel32.func('GetModuleHandleA', 'void*', ['str']);
    libGetProcAddress = kernel32.func('GetProcAddress', 'void*', ['void*', 'str']);
    libCreateToolhelp32Snapshot = kernel32.func('CreateToolhelp32Snapshot', 'void*', ['uint32', 'uint32']);
    libProcess32FirstW = kernel32.func('bool Process32FirstW(void*, _Inout_ PROCESSENTRY32W*)');
    libProcess32NextW = kernel32.func('bool Process32NextW(void*, _Inout_ PROCESSENTRY32W*)');
    return true;
  } catch (e) {
    console.error('Win32 init failed:', e.message);
    return false;
  }
}

// ============================================================
// PROCESS ENUM
// ============================================================
const TARGET_PROCESSES = ['GTA5.exe', 'GTA5_Enhanced.exe'];

function getProcesses() {
  if (!libCreateToolhelp32Snapshot) return [];
  const processes = [];
  const snapshot = libCreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
  if (!snapshot) return processes;

  let pe = { dwSize: koffi.sizeof(PROCESSENTRY32W) };
  try {
    if (libProcess32FirstW(snapshot, pe)) {
      do {
        let name = pe.szExeFile;
        if (Array.isArray(name)) {
          const end = name.indexOf(0);
          name = String.fromCharCode(...name.slice(0, end > 0 ? end : name.length));
        }
        if (pe.th32ProcessID > 0) {
          processes.push({ pid: pe.th32ProcessID, name });
        }
      } while (libProcess32NextW(snapshot, pe));
    }
  } catch (e) {
    console.error('Process enumeration error:', e.message);
  }
  libCloseHandle(snapshot);

  const targetProcesses = processes.filter(p => TARGET_PROCESSES.includes(p.name));
  if (targetProcesses.length === 0) {
    return processes.filter(p => p.name.toLowerCase().includes('gta'));
  }
  return targetProcesses;
}

// ============================================================
// MOD SCANNER
// ============================================================
function scanMods() {
  const mods = {};
  if (!fs.existsSync(MODS_DIR)) {
    fs.mkdirSync(MODS_DIR, { recursive: true });
    return mods;
  }

  const versions = fs.readdirSync(MODS_DIR).filter(d => {
    try { return fs.statSync(path.join(MODS_DIR, d)).isDirectory(); } catch { return false; }
  });

  for (const version of versions) {
    const dllDir = path.join(MODS_DIR, version, 'DLL');
    mods[version] = [];

    if (!fs.existsSync(dllDir)) continue;

    const entries = fs.readdirSync(dllDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const modPath = path.join(dllDir, entry.name);
        const dllFiles = fs.readdirSync(modPath).filter(f => f.toLowerCase().endsWith('.dll'));
        if (dllFiles.length > 0) {
          const metaPath = path.join(modPath, 'mod.json');
          let meta = {};
          if (fs.existsSync(metaPath)) {
            try { meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')); } catch {}
          }
          mods[version].push({
            id: entry.name,
            name: meta.name || entry.name,
            description: meta.description || '',
            key: meta.key || 'INSERT',
            badge: meta.badge || 'MOD',
            badgeColor: meta.badgeColor || 'cyan',
            dllPath: path.join(modPath, dllFiles[0]),
            dllName: dllFiles[0],
            icon: meta.icon || 'bolt',
          });
        }
      } else if (entry.name.toLowerCase().endsWith('.dll')) {
        const metaPath = path.join(dllDir, 'mod.json');
        let meta = {};
        if (fs.existsSync(metaPath)) {
          try { meta = JSON.parse(fs.readFileSync(metaPath, 'utf8')); } catch {}
        }
        mods[version].push({
          id: entry.name.replace(/\.dll$/i, ''),
          name: meta.name || entry.name.replace(/\.dll$/i, ''),
          description: meta.description || '',
          key: meta.key || 'INSERT',
          badge: meta.badge || 'MOD',
          badgeColor: meta.badgeColor || 'cyan',
          dllPath: path.join(dllDir, entry.name),
          dllName: entry.name,
          icon: meta.icon || 'bolt',
        });
      }
    }
  }
  return mods;
}

// ============================================================
// DLL INJECTION
// ============================================================
function injectDLL(dllPath, processId) {
  if (!libOpenProcess) return { success: false, message: 'Win32 API no disponible' };
  if (!fs.existsSync(dllPath)) return { success: false, message: 'DLL no encontrada: ' + dllPath };
  if (!dllPath.toLowerCase().endsWith('.dll')) return { success: false, message: 'El archivo debe ser .dll' };

  const hProcess = libOpenProcess(PROCESS_ALL_ACCESS, false, processId);
  if (!hProcess) return { success: false, message: 'No se pudo abrir el proceso' };

  const dllPathAbs = path.resolve(dllPath);
  const dllPathBuf = Buffer.from(dllPathAbs, 'ucs2');
  const allocSize = dllPathBuf.length + 2;

  const allocAddr = libVirtualAllocEx(hProcess, null, allocSize, MEM_COMMIT | MEM_RESERVE, PAGE_EXECUTE_READWRITE);
  if (!allocAddr) {
    libCloseHandle(hProcess);
    return { success: false, message: 'No se pudo asignar memoria' };
  }

  const written = Buffer.alloc(8);
  if (!libWriteProcessMemory(hProcess, allocAddr, dllPathBuf, allocSize, written)) {
    libVirtualFreeEx(hProcess, allocAddr, 0, MEM_RELEASE);
    libCloseHandle(hProcess);
    return { success: false, message: 'No se pudo escribir en memoria' };
  }

  const kernel32Handle = libGetModuleHandleA('kernel32.dll');
  const loadLibAddr = libGetProcAddress(kernel32Handle, 'LoadLibraryW');
  if (!loadLibAddr) {
    libVirtualFreeEx(hProcess, allocAddr, 0, MEM_RELEASE);
    libCloseHandle(hProcess);
    return { success: false, message: 'No se pudo obtener LoadLibraryW' };
  }

  const threadHandle = libCreateRemoteThread(hProcess, null, 0, loadLibAddr, allocAddr, 0, null);
  if (!threadHandle) {
    libVirtualFreeEx(hProcess, allocAddr, 0, MEM_RELEASE);
    libCloseHandle(hProcess);
    return { success: false, message: 'No se pudo crear el hilo remoto' };
  }

  libWaitForSingleObject(threadHandle, 5000);
  libCloseHandle(threadHandle);
  libVirtualFreeEx(hProcess, allocAddr, 0, MEM_RELEASE);
  libCloseHandle(hProcess);

  return { success: true, message: 'DLL inyectada correctamente' };
}

// ============================================================
// AUTO UPDATER
// ============================================================
function initAutoUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('checking-for-update', () => {
    sendToRenderer('update-checking');
  });

  autoUpdater.on('update-available', (info) => {
    sendToRenderer('update-available', {
      version: info.version,
      releaseDate: info.releaseDate,
    });
  });

  autoUpdater.on('update-not-available', () => {
    sendToRenderer('update-not-available');
  });

  autoUpdater.on('download-progress', (progress) => {
    sendToRenderer('update-progress', {
      percent: Math.round(progress.percent),
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total,
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    sendToRenderer('update-downloaded', {
      version: info.version,
    });
  });

  autoUpdater.on('error', (err) => {
    sendToRenderer('update-error', { message: err.message });
  });
}

function sendToRenderer(channel, data) {
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send(channel, data);
  }
}

// ============================================================
// WINDOW
// ============================================================
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    backgroundColor: '#0a0a0c',
    icon: path.join(__dirname, 'assets', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    autoUpdater.checkForUpdatesAndNotify();
  });
}

// ============================================================
// IPC HANDLERS
// ============================================================
ipcMain.handle('get-processes', () => getProcesses());
ipcMain.handle('scan-mods', () => scanMods());
ipcMain.handle('inject-dll', (e, dllPath, processId) => injectDLL(dllPath, processId));
ipcMain.handle('get-version', () => APP_VERSION);

ipcMain.handle('check-for-updates', () => {
  autoUpdater.checkForUpdates();
});

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall();
});

ipcMain.on('minimize-window', () => mainWindow?.minimize());
ipcMain.on('maximize-window', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.on('close-window', () => mainWindow?.close());

// ============================================================
// APP LIFECYCLE
// ============================================================
app.whenReady().then(() => {
  initWin32();
  initAutoUpdater();
  createWindow();
});

app.on('window-all-closed', () => {
  app.quit();
});
