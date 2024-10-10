const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    selectDestination: () => ipcRenderer.invoke('select-destination'),
    checkServerStatus: () => ipcRenderer.invoke('check-server-status'),
    fetchManifest: () => ipcRenderer.invoke('fetch-manifest'),
    downloadFiles: (manifest, destination) => {
        ipcRenderer.send('download-files', manifest, destination);
    },
    onDownloadStarted: (callback) => ipcRenderer.on('download-started', (event, data) => callback(data)),
    onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (event, data) => callback(data)),
    onDownloadProgressSize: (callback) => ipcRenderer.on('download-progress-size', (event, data) => callback(data)),
    onDownloadError: (callback) => ipcRenderer.on('download-error', (event, data) => callback(data)),
    onDownloadComplete: (callback) => ipcRenderer.on('download-complete', () => callback()),
    launchGame: () => ipcRenderer.invoke('launch-game'),
    getConfig: () => ipcRenderer.invoke('get-config'),
    setConfig: (config) => ipcRenderer.invoke('set-config', config),
});
