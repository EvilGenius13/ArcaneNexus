window.addEventListener('DOMContentLoaded', async () => {
    // DOM elements
    const actionButton = document.getElementById('action-button');
    const downloadInfo = document.getElementById('download-info');
    const downloadCount = document.getElementById('download-count');
    const progressBar = document.getElementById('progress-bar');
    const errorLog = document.getElementById('error-log');
    const gameVersionElement = document.getElementById('game-version');
    const gameStatusMessage = document.getElementById('game-status-message');
    const serverStatusElement = document.getElementById('server-status');

    // Navigation elements
    const navHome = document.getElementById('nav-home');
    const navStatus = document.getElementById('nav-status');
    const navSettings = document.getElementById('nav-settings');

    // Content sections
    const homeContent = document.getElementById('home-content');
    const statusContent = document.getElementById('status-content');
    const settingsContent = document.getElementById('settings-content');

    let totalFiles = 0;
    let downloadedFiles = 0;
    let totalBytes = 0;
    let remainingBytes = 0; // Remaining bytes to download
    let downloadSpeed = 0; // Current download speed in bytes per second
    let manifest = null;

    // Flag to track if errors occurred during download
    let errorsOccurredDuringDownload = false;

    // Function to validate the manifest structure
    function isValidManifest(manifestData) {
        if (!manifestData || !manifestData.files || !Array.isArray(manifestData.files)) return false;
        for (const file of manifestData.files) {
            if (typeof file.path !== 'string' || typeof file.size !== 'number' || typeof file.hash !== 'string') {
                return false;
            }
        }
        // Check for executablePath and versionName
        if (typeof manifestData.executablePath !== 'string') return false;
        if (typeof manifestData.versionName !== 'string') return false; // Updated from 'version' to 'versionName'
        return true;
    }

    // Function to show the selected content section
    function showContent(section) {
        homeContent.style.display = 'none';
        statusContent.style.display = 'none';
        settingsContent.style.display = 'none';

        if (section === 'home') {
            homeContent.style.display = 'block';
        } else if (section === 'status') {
            statusContent.style.display = 'block';
        } else if (section === 'settings') {
            settingsContent.style.display = 'block';
        }
    }

    // Event listeners for navigation
    navHome.addEventListener('click', (event) => {
        event.preventDefault();
        showContent('home');
    });

    navStatus.addEventListener('click', (event) => {
        event.preventDefault();
        showContent('status');
    });

    navSettings.addEventListener('click', (event) => {
        event.preventDefault();
        // Send IPC message to open Settings window
        window.electronAPI.openSettings();
    });

    // Initialize: Check Server Status
    async function initialize() {
        // Update server status in the nav bar
        const serverStatus = await window.electronAPI.checkServerStatus();
        if (serverStatus.online) {
            serverStatusElement.textContent = 'Server is Online 🟢';
        } else {
            serverStatusElement.textContent = 'Server is Offline 🔴';
        }

        // Fetch Manifest
        const manifestResponse = await window.electronAPI.fetchManifest();
        if (manifestResponse.success) {
            if (isValidManifest(manifestResponse.data)) {
                manifest = manifestResponse.data;

                // Update game version display
                gameVersionElement.textContent = `Game Version: ${manifest.versionName}`;

                const config = await window.electronAPI.getConfig();

                if (manifestResponse.updatesAvailable) {
                    actionButton.style.display = 'block';
                    actionButton.textContent = config.installDirectory ? 'Update' : 'Install';
                    gameStatusMessage.textContent = config.installDirectory ? 'Updates are available.' : 'Ready to install.';
                } else {
                    if (config.installDirectory) {
                        actionButton.style.display = 'block';
                        actionButton.textContent = 'Play';
                        gameStatusMessage.textContent = 'Your game is up to date.';
                    } else {
                        actionButton.style.display = 'block';
                        actionButton.textContent = 'Install';
                        gameStatusMessage.textContent = 'Ready to install.';
                    }
                }
            } else {
                gameStatusMessage.textContent = 'Invalid manifest format.';
                console.error('Invalid manifest format.');
                actionButton.style.display = 'none';
            }
        } else {
            gameStatusMessage.textContent = 'Failed to load manifest.';
            console.error('Manifest fetch error:', manifestResponse.error);
            actionButton.style.display = 'none';
        }
    }

    // Handle Action Button Click
    actionButton.addEventListener('click', async () => {
        const config = await window.electronAPI.getConfig();

        if (actionButton.textContent === 'Install' || actionButton.textContent === 'Update') {
            // Install or Update
            if (!manifest) {
                alert('Manifest is not loaded or is invalid.');
                return;
            }

            let destination = config.installDirectory;

            if (!destination) {
                // First-time install
                destination = await window.electronAPI.selectDestination();
                if (!destination) {
                    // User canceled the dialog
                    return;
                }
                // Save the install directory in config
                await window.electronAPI.setConfig({ installDirectory: destination });
            }

            // Reset UI
            errorsOccurredDuringDownload = false; // Reset error flag
            downloadInfo.style.display = 'none'; // Hide until download starts
            downloadCount.textContent = 'Remaining: 0 MB | Speed: 0 MB/s';
            progressBar.style.width = '0%'; // Start at 0% and increment
            errorLog.innerHTML = ''; // Clear previous errors

            // Start Download
            window.electronAPI.downloadFiles(manifest, destination);
        } else if (actionButton.textContent === 'Play') {
            // Play the game
            if (!config.installDirectory) {
                alert('Game is not installed.');
                return;
            }

            try {
                // Request main process to launch the game
                const result = await window.electronAPI.launchGame();
                if (!result.success) {
                    alert('Failed to launch the game.');
                }
            } catch (error) {
                console.error('Error launching the game:', error);
                alert('An error occurred while launching the game.');
            }
        }
    });

    // Listen for Download Started
    window.electronAPI.onDownloadStarted((data) => {
        totalFiles = data.totalFiles;
        totalBytes = data.totalBytes;
        remainingBytes = totalBytes; // Initialize remaining bytes

        downloadCount.textContent = `Remaining: ${formatBytes(remainingBytes)} | Speed: 0 MB/s`;
        progressBar.style.width = '0%'; // Start at 0% and increment

        downloadInfo.style.display = 'block';
    });

    // Listen for Download Progress (File Count)
    window.electronAPI.onDownloadProgress((data) => {
        downloadedFiles = data.downloadedFiles;
        // Optionally, you can also display file count progress
        // For this implementation, we'll focus on size-based countdown
    });

    // Listen for Download Progress (Size)
    window.electronAPI.onDownloadProgressSize((data) => {
        remainingBytes = data.remainingBytes;
        downloadSpeed = data.downloadSpeed;

        // Calculate downloaded bytes
        const downloadedBytes = totalBytes - remainingBytes;

        // Calculate percentage completed
        const percent = totalBytes > 0 ? (downloadedBytes / totalBytes) * 100 : 100;

        // Update download count with remaining bytes and speed
        downloadCount.textContent = `Remaining: ${formatBytes(remainingBytes)} | Speed: ${formatSpeed(downloadSpeed)}`;

        // Update progress bar based on downloaded bytes
        progressBar.style.width = `${percent}%`;
    });

    // Listen for Download Errors
    window.electronAPI.onDownloadError((data) => {
        errorsOccurredDuringDownload = true;
        const { file, error } = data;
        const errorMessage = `Failed to download ${file}: ${error}`;
        const errorItem = document.createElement('p');
        errorItem.textContent = errorMessage;
        errorLog.appendChild(errorItem);
    });

    // Listen for Download Completion
    window.electronAPI.onDownloadComplete(() => {
        if (errorsOccurredDuringDownload) {
            alert('Download completed with errors. Please try updating again.');
        } else if (totalFiles === 0) {
            alert('All files are up to date. No downloads were necessary.');
        } else {
            alert('All downloads completed successfully.');
        }
        initialize(); // Re-initialize to update status
    });

    // Helper function to format bytes
    function formatBytes(bytes) {
        if (bytes >= 1e9) {
            return (bytes / 1e9).toFixed(2) + ' GB';
        } else if (bytes >= 1e6) {
            return (bytes / 1e6).toFixed(2) + ' MB';
        } else if (bytes >= 1e3) {
            return (bytes / 1e3).toFixed(2) + ' KB';
        } else {
            return bytes + ' B';
        }
    }

    // Helper function to format download speed
    function formatSpeed(bytesPerSecond) {
        if (bytesPerSecond >= 1e6) {
            return (bytesPerSecond / 1e6).toFixed(2) + ' MB/s';
        } else if (bytesPerSecond >= 1e3) {
            return (bytesPerSecond / 1e3).toFixed(2) + ' KB/s';
        } else {
            return bytesPerSecond + ' B/s';
        }
    }

    // Initialize the application
    initialize();
});
