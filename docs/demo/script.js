document.addEventListener('DOMContentLoaded', () => {
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

  // Settings form elements
  const maxDownloadSpeedInput = document.getElementById('max-download-speed');
  const installDirectoryInput = document.getElementById('install-directory');
  const changeDirectoryButton = document.getElementById('change-directory');
  const saveSettingsButton = document.getElementById('save-settings');
  const cancelSettingsButton = document.getElementById('cancel-settings');
  const settingsErrorLog = document.getElementById('settings-error-log');

  let totalFiles = 100; // Simulated total files
  let downloadedFiles = 0;
  let totalBytes = 500 * 1e6; // Simulated total size: 500 MB
  let remainingBytes = totalBytes;
  let downloadSpeed = 15 * 1e6; // Simulated download speed: 5 MB/s
  let manifest = null;

  // Flag to track if errors occurred during download
  let errorsOccurredDuringDownload = false;

  // Simulated config object
  let config = {
      maxDownloadSpeed: 50,
      installDirectory: 'C:/Games/ArcaneNexus',
  };

  // Function to simulate fetching the manifest
  function fetchManifest() {
      return new Promise((resolve) => {
          setTimeout(() => {
              manifest = {
                  version: "1.0.0",
                  files: [], // Simulated file list
              };
              resolve({ success: true, data: manifest, updatesAvailable: true });
          }, 1000);
      });
  }

  // Function to simulate server status check
  function checkServerStatus() {
      return new Promise((resolve) => {
          setTimeout(() => {
              resolve({ online: true });
          }, 500);
      });
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
          loadSettings();
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

  // Initialize the app
  async function initialize() {
      // Update server status
      const serverStatus = await checkServerStatus();
      if (serverStatus.online) {
          serverStatusElement.textContent = 'Server is Online 🟢';
      } else {
          serverStatusElement.textContent = 'Server is Offline 🔴';
      }

      // Fetch manifest
      const manifestResponse = await fetchManifest();
      if (manifestResponse.success) {
          manifest = manifestResponse.data;
          gameVersionElement.textContent = `Game Version: ${manifest.version}`;
          actionButton.textContent = 'Install';
          gameStatusMessage.textContent = 'Ready to install.';
      } else {
          gameStatusMessage.textContent = 'Failed to load manifest.';
          actionButton.style.display = 'none';
      }
  }

  // Handle Action Button Click
  actionButton.addEventListener('click', () => {
      if (actionButton.textContent === 'Install' || actionButton.textContent === 'Update') {
          // Start simulated download
          startDownload();
      } else if (actionButton.textContent === 'Play') {
          alert('Launching the game...');
      }
  });

  // Simulate the download process
  function startDownload() {
      errorsOccurredDuringDownload = false;
      downloadInfo.style.display = 'block';
      downloadCount.textContent = `Remaining: ${formatBytes(remainingBytes)} | Speed: 0 MB/s`;
      progressBar.style.width = '0%';
      errorLog.innerHTML = '';
      actionButton.disabled = true;

      const downloadInterval = setInterval(() => {
          if (remainingBytes > 0) {
              const bytesDownloaded = Math.min(downloadSpeed, remainingBytes);
              remainingBytes -= bytesDownloaded;
              downloadedFiles = totalFiles * ((totalBytes - remainingBytes) / totalBytes);
              updateDownloadProgress();
          } else {
              clearInterval(downloadInterval);
              completeDownload();
          }
      }, 1000);
  }

  // Update download progress UI
  function updateDownloadProgress() {
      const percent = ((totalBytes - remainingBytes) / totalBytes) * 100;
      progressBar.style.width = `${percent}%`;
      downloadCount.textContent = `Remaining: ${formatBytes(remainingBytes)} | Speed: ${formatSpeed(downloadSpeed)}`;
  }

  // Complete the download process
  function completeDownload() {
      actionButton.disabled = false;
      actionButton.textContent = 'Play';
      gameStatusMessage.textContent = 'Your game is up to date.';
      alert('Download completed successfully.');
  }

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

  // Load settings into the form
  function loadSettings() {
      maxDownloadSpeedInput.value = config.maxDownloadSpeed;
      installDirectoryInput.value = config.installDirectory;
  }

  // Save settings
  saveSettingsButton.addEventListener('click', () => {
      const newMaxDownloadSpeed = parseInt(maxDownloadSpeedInput.value, 10);
      const newInstallDirectory = installDirectoryInput.value;

      // Input validation
      if (isNaN(newMaxDownloadSpeed) || newMaxDownloadSpeed <= 0) {
          settingsErrorLog.textContent = 'Please enter a valid max download speed.';
          return;
      }

      if (!newInstallDirectory) {
          settingsErrorLog.textContent = 'Please enter a valid install directory.';
          return;
      }

      // Update config
      config.maxDownloadSpeed = newMaxDownloadSpeed;
      config.installDirectory = newInstallDirectory;
      settingsErrorLog.textContent = '';
      alert('Settings saved successfully.');
  });

  // Cancel settings
  cancelSettingsButton.addEventListener('click', () => {
      // Reload settings
      loadSettings();
      settingsErrorLog.textContent = '';
  });

  // Change Directory (simulated)
  changeDirectoryButton.addEventListener('click', () => {
      // Simulate directory selection
      const newDirectory = prompt('Enter new install directory:', config.installDirectory);
      if (newDirectory) {
          installDirectoryInput.value = newDirectory;
      }
  });

  // Initialize the application
  initialize();
});
