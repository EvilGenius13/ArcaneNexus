const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const crypto = require('crypto');

let mainWindow;

// Enable hot reload for development
if (!app.isPackaged) {
    const path = require('path');

    console.log('process.execPath:', process.execPath); // Debugging line

    require('electron-reload')(__dirname, {
        electron: process.execPath
    });
}

// Replace with your server's IP or URL
const SERVER_IP = 'http://192.168.1.108:3000'; // Example: 'http://localhost:3000'

// Get the user data path for storing configuration
const userDataPath = app.getPath('userData');
const configFilePath = path.join(userDataPath, 'config.json');

const { spawn } = require('child_process'); // Import child_process

// Read configuration from file
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

// Write configuration to file
function writeConfig(config) {
    try {
        fs.writeFileSync(configFilePath, JSON.stringify(config, null, 4));
    } catch (err) {
        console.error('Error writing config:', err);
    }
}

let config = {};

// IPC Handler: Launch Game
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

    // Check if the executable exists
    if (!fs.existsSync(executablePath)) {
        console.error(`Executable not found at path: ${executablePath}`);
        return { success: false };
    }

    // Launch the executable
    try {
        // On Windows
        if (process.platform === 'win32') {
            spawn('cmd', ['/c', 'start', '', executablePath], { detached: true });
        } else if (process.platform === 'darwin') {
            spawn('open', [executablePath], { detached: true });
        } else if (process.platform === 'linux') {
            spawn('xdg-open', [executablePath], { detached: true });
        }

        // Optionally quit the launcher (still deciding)
        // app.quit();

        return { success: true };
    } catch (error) {
        console.error('Failed to launch the game:', error);
        return { success: false };
    }
});

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        icon: path.join(__dirname, 'assets', 'icons', 'icon.png'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false, // Disable Node.js integration
            contextIsolation: true, // Enable context isolation
        }
    });

    mainWindow.loadFile('index.html');

    if (!app.isPackaged) {
        mainWindow.webContents.openDevTools();
    }
}

app.whenReady().then(() => {
    // Read config on app start
    config = readConfig();

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
        const newManifest = response.data;

        // Compare with stored manifest
        const storedManifest = config.manifest;
        let updatesAvailable = false;

        if (!storedManifest) {
            updatesAvailable = true;
        } else {
            // Simple comparison logic
            updatesAvailable = JSON.stringify(newManifest) !== JSON.stringify(storedManifest);
        }

        return { success: true, data: newManifest, updatesAvailable };
    } catch (error) {
        return { success: false, error: error.message };
    }
});

// IPC Handler: Get Config
ipcMain.handle('get-config', async () => {
    return readConfig();
});

// IPC Handler: Set Config
ipcMain.handle('set-config', async (event, newConfig) => {
    config = { ...config, ...newConfig };
    writeConfig(config);
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

// Function to get all files in a directory recursively
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

// Function to clean up files not in the manifest
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

// IPC Handler: Download Files
// IPC Handler: Download Files
ipcMain.on('download-files', async (event, manifest, destination) => {
    let errorsOccurred = false; // Flag to track errors
    let downloadedFiles = 0;
    let totalBytesToDownload = 0;
    let totalBytesDownloaded = 0;

    // Variables for download speed calculation
    let bytesDownloadedSinceLastUpdate = 0;
    let downloadSpeed = 0; // in bytes per second

    // Timer reference
    let progressTimer = null;

    // Determine which files need to be downloaded
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

    // Send initial progress update to renderer
    mainWindow.webContents.send('download-started', {
        totalFiles: filesToDownload.length,
        totalBytes: totalBytesToDownload
    });

    // If there are no files to download, send 'download-complete' and return
    if (filesToDownload.length === 0) {
        mainWindow.webContents.send('download-complete');

        // Update the stored manifest and config if no errors occurred
        if (!errorsOccurred) {
            config.manifest = manifest;
            config.installDirectory = destination;
            writeConfig(config);
        }

        return;
    }

    // Start the progress timer to send updates every second
    progressTimer = setInterval(() => {
        // Calculate download speed
        downloadSpeed = bytesDownloadedSinceLastUpdate; // bytes per second

        // Remaining bytes
        const remainingBytes = totalBytesToDownload - totalBytesDownloaded;
        const safeRemainingBytes = remainingBytes > 0 ? remainingBytes : 0;

        // Send progress update to renderer
        mainWindow.webContents.send('download-progress-size', {
            remainingBytes: safeRemainingBytes,
            downloadSpeed: downloadSpeed
        });

        // Reset the counter for the next interval
        bytesDownloadedSinceLastUpdate = 0;
    }, 1000); // 1000 ms = 1 second

    // Loop over filesToDownload
    for (const file of filesToDownload) {
        const fileUrl = `${SERVER_IP}/public_files/${file.path}`;
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

            // Track bytes downloaded for the current file
            response.data.on('data', (chunk) => {
                totalBytesDownloaded += chunk.length;
                bytesDownloadedSinceLastUpdate += chunk.length;
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

            // Send file count progress update to renderer
            mainWindow.webContents.send('download-progress', {
                downloadedFiles: downloadedFiles,
                totalFiles: filesToDownload.length
            });

        } catch (error) {
            errorsOccurred = true; // Set the error flag
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

    // Clear the progress timer as the download is complete
    if (progressTimer) {
        clearInterval(progressTimer);
    }

    // Final progress update to set remaining bytes to 0
    mainWindow.webContents.send('download-progress-size', {
        remainingBytes: 0,
        downloadSpeed: 0
    });

    // Notify renderer that download is complete
    mainWindow.webContents.send('download-complete');

    if (!errorsOccurred) {
        // Clean up old files
        cleanUpFiles(destination, manifest.files);

        // Update the stored manifest
        config.manifest = manifest;
        config.installDirectory = destination;
        writeConfig(config);
    } else {
        console.error('Errors occurred during download. Manifest not updated.');
    }
});
