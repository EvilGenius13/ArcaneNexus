const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const crypto = require('crypto');

let mainWindow;

// Replace with your server's IP or URL
const SERVER_IP = 'http://localhost:3000'; // Example: 'http://localhost:3000'

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false, // Disable Node.js integration
            contextIsolation: true, // Enable context isolation
        }
    });

    mainWindow.loadFile('index.html');

    // Optional: Open DevTools for debugging
    // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

// IPC Handler: Select Destination Folder
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

// IPC Handler: Check Server Status
ipcMain.handle('check-server-status', async () => {
    try {
        const response = await axios.get(SERVER_IP, { timeout: 5000 });
        return { online: true };
    } catch (error) {
        return { online: false };
    }
});

// IPC Handler: Fetch Manifest
ipcMain.handle('fetch-manifest', async () => {
    try {
        const manifestUrl = `${SERVER_IP}/manifest.json`;
        const response = await axios.get(manifestUrl);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// Function to compute SHA-256 hash of a file
function computeFileHash(filePath) {
    return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = fs.createReadStream(filePath);
        stream.on('error', (err) => reject(err));
        stream.on('data', (chunk) => hash.update(chunk));
        stream.on('end', () => resolve(hash.digest('hex')));
    });
}

// IPC Handler: Download Files
ipcMain.on('download-files', async (event, manifest, destination) => {
    const totalFiles = manifest.files.length;
    let downloadedFiles = 0;

    for (const file of manifest.files) {
        const fileUrl = `${SERVER_IP}/public_files/${file.path}`; // Could choose a different path but this is good for now
        const destPath = path.join(destination, file.path);

        try {
            // Ensure the directory exists
            fs.mkdirSync(path.dirname(destPath), { recursive: true });

            const writer = fs.createWriteStream(destPath);

            const response = await axios({
                url: fileUrl,
                method: 'GET',
                responseType: 'stream',
                timeout: 10000
            });

            response.data.pipe(writer);

            // Wait for the download to finish
            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            // Compute the hash of the downloaded file
            const computedHash = await computeFileHash(destPath);

            // Compare with the hash in the manifest
            if (computedHash !== file.hash) {
                throw new Error('Hash mismatch');
            }

            downloadedFiles++;

            // Send progress update to renderer
            mainWindow.webContents.send('download-progress', {
                downloaded: downloadedFiles,
                total: totalFiles
            });

        } catch (error) {
            console.error(`Error downloading ${file.path}:`, error.message);
            mainWindow.webContents.send('download-error', {
                file: file.path,
                error: error.message
            });

            // Delete the corrupted file
            if (fs.existsSync(destPath)) {
                fs.unlinkSync(destPath);
            }
        }
    }

    // Notify renderer that download is complete
    mainWindow.webContents.send('download-complete');
});
