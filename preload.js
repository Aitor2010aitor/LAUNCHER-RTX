const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Process & Mods
  getProcesses: () => ipcRenderer.invoke('get-processes'),
  scanMods: () => ipcRenderer.invoke('scan-mods'),
  injectDLL: (dllPath, processId) => ipcRenderer.invoke('inject-dll', dllPath, processId),

  // App info
  getVersion: () => ipcRenderer.invoke('get-version'),

  // Updates
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  onUpdateChecking: (cb) => ipcRenderer.on('update-checking', () => cb()),
  onUpdateAvailable: (cb) => ipcRenderer.on('update-available', (e, data) => cb(data)),
  onUpdateNotAvailable: (cb) => ipcRenderer.on('update-not-available', () => cb()),
  onUpdateProgress: (cb) => ipcRenderer.on('update-progress', (e, data) => cb(data)),
  onUpdateDownloaded: (cb) => ipcRenderer.on('update-downloaded', (e, data) => cb(data)),
  onUpdateError: (cb) => ipcRenderer.on('update-error', (e, data) => cb(data)),

  // Window controls
  minimize: () => ipcRenderer.send('minimize-window'),
  maximize: () => ipcRenderer.send('maximize-window'),
  close: () => ipcRenderer.send('close-window'),
});
