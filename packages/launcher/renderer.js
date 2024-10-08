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
        // Check for executablePath and version
        if (typeof manifestData.executablePath !== 'string') return false;
        if (typeof manifestData.version !== 'string') return false;
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
        showContent('settings');
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
                gameVersionElement.textContent = `Game Version: ${manifest.version}`;

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
        totalFiles = data.total;
        downloadedFiles = 0;
        downloadCount.textContent = `Downloaded ${downloadedFiles}/${totalFiles} files.`;
        progressBar.style.width = '0%';
        downloadInfo.style.display = 'block';
    });

    // Listen for Download Progress
    window.electronAPI.onDownloadProgress((data) => {
        downloadedFiles = data.downloaded;
        totalFiles = data.total;
        downloadCount.textContent = `Downloaded ${downloadedFiles}/${totalFiles} files.`;
        const percent = totalFiles > 0 ? (downloadedFiles / totalFiles) * 100 : 100;
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

    // Initialize the application
    initialize();
});
