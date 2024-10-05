const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    selectDestination: () => ipcRenderer.invoke('select-destination'),
    checkServerStatus: () => ipcRenderer.invoke('check-server-status'),
    fetchManifest: () => ipcRenderer.invoke('fetch-manifest'),
    downloadFiles: (manifest, destination) => {
        ipcRenderer.send('download-files', manifest, destination);
    },
    onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (event, data) => callback(data)),
    onDownloadError: (callback) => ipcRenderer.on('download-error', (event, data) => callback(data)),
    onDownloadComplete: (callback) => ipcRenderer.on('download-complete', () => callback())
});