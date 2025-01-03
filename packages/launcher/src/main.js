const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const crypto = require('crypto');
const { spawn } = require('child_process');

if (!app.isPackaged) {
    console.log('process.execPath:', process.execPath);
    require('electron-reload')(__dirname, {
        electron: process.execPath
    });
}

const SERVER_IP = 'http://localhost:3000/api';
const userDataPath = app.getPath('userData');
const configFilePath = path.join(userDataPath, 'config.json');

function readConfig() {
    try {
        if (fs.existsSync(configFilePath)) {
            const data = fs.readFileSync(configFilePath, 'utf-8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error('Error reading config:', err);
    }
    return {};
}

function writeConfig(config) {
    try {
        fs.writeFileSync(configFilePath, JSON.stringify(config, null, 4));
    } catch (err) {
        console.error('Error writing config:', err);
    }
}

let config = {};

ipcMain.handle('launch-game', async () => {
    if (!config.installDirectory || !config.manifest) {
        console.error('Game is not installed or manifest is missing.');
        return { success: false };
    }

    const executableRelativePath = config.manifest.executablePath;
    if (!executableRelativePath) {
        console.error('Executable path is not specified in the manifest.');
        return { success: false };
    }

    const executablePath = path.join(config.installDirectory, executableRelativePath);

    if (!fs.existsSync(executablePath)) {
        console.error(`Executable not found at path: ${executablePath}`);
        return { success: false };
    }

    try {
        if (process.platform === 'win32') {
            spawn('cmd', ['/c', 'start', '', executablePath], { detached: true });
        } else if (process.platform === 'darwin') {
            spawn('open', [executablePath], { detached: true });
        } else if (process.platform === 'linux') {
            spawn('xdg-open', [executablePath], { detached: true });
        }

        return { success: true };
    } catch (error) {
        console.error('Failed to launch the game:', error);
        return { success: false };
    }
});

let mainWindow;
let settingsWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        icon: path.join(__dirname, 'assets', 'icons', 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

    if (!app.isPackaged) {
        mainWindow.webContents.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

function createSettingsWindow() {
    if (settingsWindow) {
        settingsWindow.focus();
        return;
    }

    settingsWindow = new BrowserWindow({
        width: 500,
        height: 400,
        parent: mainWindow,
        modal: true,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
        }
    });

    settingsWindow.loadFile(path.join(__dirname, 'renderer', 'settings.html'));

    settingsWindow.once('ready-to-show', () => {
        settingsWindow.show();
    });

    settingsWindow.on('closed', () => {
        settingsWindow = null;
    });
}

app.whenReady().then(() => {
    config = readConfig();
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('select-destination', async () => {
    const result = await dialog.showOpenDialog({
        properties: ['openDirectory']
    });
    if (result.canceled) {
        return null;
    } else {
        return result.filePaths[0];
    }
});

ipcMain.handle('check-server-status', async () => {
    try {
        const response = await axios.get(`${SERVER_IP}/infra/healthcheck`, { timeout: 5000 });
        console.log(response);
        return { online: true };
    } catch (error) {
        return { online: false };
    }
});

ipcMain.handle('fetch-manifest', async () => {
    try {
        const manifestUrl = `${SERVER_IP}/games/The Corridor`;
        const response = await axios.get(manifestUrl);
        console.log("RESPONSE DATA", response.data.jsonBLOB);

        if (!response.data || !response.data.jsonBLOB) {
            throw new Error('Invalid manifest format: jsonBLOB is missing.');
        }

        let newManifest;

        if (typeof response.data.jsonBLOB === 'string') {
            try {
                newManifest = JSON.parse(response.data.jsonBLOB);
            } catch (parseError) {
                throw new Error('Failed to parse jsonBLOB: ' + parseError.message);
            }
        } else if (typeof response.data.jsonBLOB === 'object') {
            newManifest = response.data.jsonBLOB;
        } else {
            throw new Error('Invalid jsonBLOB type. Expected string or object.');
        }

        const storedManifest = config.manifest;
        let updatesAvailable = !storedManifest || JSON.stringify(newManifest) !== JSON.stringify(storedManifest);

        return { success: true, data: newManifest, updatesAvailable };
    } catch (error) {
        console.error('Error fetching manifest:', error.message);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('get-config', async () => {
    return readConfig();
});

ipcMain.handle('set-config', async (event, newConfig) => {
    config = { ...config, ...newConfig };
    writeConfig(config);
});

ipcMain.on('open-settings', () => {
    createSettingsWindow();
});

function computeFileHash(filePath) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);
        stream.on('error', (err) => reject(err));
        stream.on('data', (chunk) => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
    });
}

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach((file) => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else {
            arrayOfFiles.push(fullPath);
        }
    });

    return arrayOfFiles;
}

function cleanUpFiles(destination, manifestFiles) {
    const allFiles = getAllFiles(destination);
    const manifestFilePaths = manifestFiles.map((file) => path.join(destination, file.path));

    const filesToDelete = allFiles.filter((file) => !manifestFilePaths.includes(file));

    filesToDelete.forEach((file) => {
        try {
            fs.unlinkSync(file);
            console.log(`Deleted old file: ${file}`);
        } catch (err) {
            console.error(`Error deleting file ${file}:`, err.message);
        }
    });
}

ipcMain.on('download-files', async (event, manifest, destination) => {
    const { Throttle } = require('stream-throttle');

    let errorsOccurred = false;
    let downloadedFiles = 0;
    let totalBytesToDownload = 0;
    let totalBytesDownloaded = 0;

    let bytesDownloadedSinceLastUpdate = 0;
    let downloadSpeed = 0;

    let progressTimer = null;

    const gameName = manifest.gameName;
    const versionName = manifest.versionName;

    // Create topLevelDir here for reconstructing keys
    const sanitizedGameName = gameName.replace(/[^a-zA-Z0-9-_]/g, "_");
    const sanitizedVersionName = versionName.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const topLevelDir = `${sanitizedGameName}_v${sanitizedVersionName}`;

    let filesToDownload = [];
    for (const file of manifest.files) {
        const destPath = path.join(destination, file.path);
        let shouldDownload = true;

        if (fs.existsSync(destPath)) {
            const existingFileHash = await computeFileHash(destPath);
            if (existingFileHash === file.hash) {
                shouldDownload = false;
            }
        }

        if (shouldDownload) {
            filesToDownload.push(file);
            totalBytesToDownload += file.size;
        }
    }

    mainWindow.webContents.send('download-started', {
        totalFiles: filesToDownload.length,
        totalBytes: totalBytesToDownload
    });

    if (filesToDownload.length === 0) {
        mainWindow.webContents.send('download-complete');
        if (!errorsOccurred) {
            config.manifest = manifest;
            config.installDirectory = destination;
            writeConfig(config);
        }
        return;
    }

    progressTimer = setInterval(() => {
        downloadSpeed = bytesDownloadedSinceLastUpdate;
        const remainingBytes = totalBytesToDownload - totalBytesDownloaded;
        const safeRemainingBytes = remainingBytes > 0 ? remainingBytes : 0;

        mainWindow.webContents.send('download-progress-size', {
            remainingBytes: safeRemainingBytes,
            downloadSpeed: downloadSpeed
        });

        bytesDownloadedSinceLastUpdate = 0;
    }, 1000);

    for (const file of filesToDownload) {
        // Prepend topLevelDir to file.path to match Minio keys
        const remoteKey = file.path;
        const fileUrl = `${SERVER_IP}/files/download/${encodeURIComponent(gameName)}/${encodeURIComponent(versionName)}/${encodeURIComponent(remoteKey)}`;
        
        console.log('Downloading:', fileUrl);

        const destPath = path.join(destination, file.path);

        try {
            fs.mkdirSync(path.dirname(destPath), { recursive: true });

            const writer = fs.createWriteStream(destPath);

            const response = await axios({
                url: fileUrl,
                method: 'GET',
                responseType: 'stream',
                timeout: 10000
            });

            let throttleStream = null;

            if (config.maxDownloadSpeed) {
                const bytesPerSecond = config.maxDownloadSpeed * 1e6;
                throttleStream = new Throttle({ rate: bytesPerSecond });
                response.data = response.data.pipe(throttleStream);
            }

            response.data.on('data', (chunk) => {
                totalBytesDownloaded += chunk.length;
                bytesDownloadedSinceLastUpdate += chunk.length;
            });

            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            const computedHash = await computeFileHash(destPath);
            if (computedHash !== file.hash) {
                throw new Error('Hash mismatch');
            }

            downloadedFiles++;

            mainWindow.webContents.send('download-progress', {
                downloadedFiles: downloadedFiles,
                totalFiles: filesToDownload.length
            });

        } catch (error) {
            errorsOccurred = true;
            console.error(`Error downloading ${file.path}:`, error.message);
            mainWindow.webContents.send('download-error', {
                file: file.path,
                error: error.message
            });

            if (fs.existsSync(destPath)) {
                fs.unlinkSync(destPath);
            }
        }
    }

    if (progressTimer) {
        clearInterval(progressTimer);
    }

    mainWindow.webContents.send('download-progress-size', {
        remainingBytes: 0,
        downloadSpeed: 0
    });

    mainWindow.webContents.send('download-complete');

    if (!errorsOccurred) {
        // Since your manifest.files already don't have top-level directory in their path,
        // we do not need to modify them again.
        cleanUpFiles(destination, manifest.files);
        config.manifest = manifest;
        config.installDirectory = destination;
        writeConfig(config);
    } else {
        console.error('Errors occurred during download. Manifest not updated.');
    }
});
