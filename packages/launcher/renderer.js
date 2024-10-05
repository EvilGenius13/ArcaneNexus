window.addEventListener('DOMContentLoaded', () => {
    const statusElement = document.getElementById('status');
    const selectFolderBtn = document.getElementById('select-folder');
    const downloadInfo = document.getElementById('download-info');
    const downloadCount = document.getElementById('download-count');
    const progressBar = document.getElementById('progress-bar');
    const errorLog = document.getElementById('error-log');

    let totalFiles = 0;
    let downloadedFiles = 0;
    let manifest = null;

    // Function to validate the manifest structure
    function isValidManifest(manifestData) {
        if (!manifestData || !manifestData.files || !Array.isArray(manifestData.files)) return false;
        for (const file of manifestData.files) {
            if (typeof file.path !== 'string' || typeof file.size !== 'number' || typeof file.hash !== 'string') {
                return false;
            }
        }
        return true;
    }

    // Initialize: Check Server Status
    async function initialize() {
        const serverStatus = await window.electronAPI.checkServerStatus();
        if (serverStatus.online) {
            statusElement.textContent = 'Server is Online ✅';
        } else {
            statusElement.textContent = 'Server is Offline ❌';
            return;
        }

        // Fetch Manifest
        const manifestResponse = await window.electronAPI.fetchManifest();
        if (manifestResponse.success) {
            if (isValidManifest(manifestResponse.data)) {
                manifest = manifestResponse.data;
                totalFiles = manifest.files.length;
                downloadCount.textContent = `Downloaded 0/${totalFiles} files.`;
            } else {
                statusElement.textContent = 'Invalid manifest format.';
                console.error('Invalid manifest format.');
            }
        } else {
            statusElement.textContent = 'Failed to load manifest.';
            console.error(manifestResponse.error);
        }
    }

    // Handle Folder Selection and Start Download
    selectFolderBtn.addEventListener('click', async () => {
        if (!manifest) {
            alert('Manifest is not loaded or is invalid.');
            return;
        }

        const destination = await window.electronAPI.selectDestination();
        if (!destination) {
            // User canceled the dialog
            return;
        }

        // Reset UI
        downloadedFiles = 0;
        downloadCount.textContent = `Downloaded 0/${manifest.files.length} files.`;
        progressBar.style.width = '0%';
        errorLog.innerHTML = '';
        downloadInfo.style.display = 'block';

        // Start Download
        window.electronAPI.downloadFiles(manifest, destination);
    });

    // Listen for Download Progress
    window.electronAPI.onDownloadProgress((data) => {
        downloadedFiles = data.downloaded;
        downloadCount.textContent = `Downloaded ${downloadedFiles}/${totalFiles} files.`;
        const percent = (downloadedFiles / totalFiles) * 100;
        progressBar.style.width = `${percent}%`;
    });

    // Listen for Download Errors
    window.electronAPI.onDownloadError((data) => {
        const { file, error } = data;
        const errorMessage = `Failed to download ${file}: ${error}`;
        const errorItem = document.createElement('p');
        errorItem.textContent = errorMessage;
        errorLog.appendChild(errorItem);
    });

    // Listen for Download Completion
    window.electronAPI.onDownloadComplete(() => {
        alert('All downloads completed.');
    });

    // Initialize the application
    initialize();
});