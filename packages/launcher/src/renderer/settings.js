window.addEventListener('DOMContentLoaded', async () => {
  const maxDownloadSpeedInput = document.getElementById('max-download-speed');
  const installDirectoryInput = document.getElementById('install-directory');
  const changeDirectoryButton = document.getElementById('change-directory');
  const saveSettingsButton = document.getElementById('save-settings');
  const cancelSettingsButton = document.getElementById('cancel-settings');
  const settingsErrorLog = document.getElementById('settings-error-log');

  // Load current settings
  const config = await window.electronAPI.getConfig();
  if (config.maxDownloadSpeed) {
      maxDownloadSpeedInput.value = config.maxDownloadSpeed;
  }
  if (config.installDirectory) {
      installDirectoryInput.value = config.installDirectory;
  }

  // Change Directory Button Click
  changeDirectoryButton.addEventListener('click', async () => {
      const selectedDirectory = await window.electronAPI.selectDestination();
      if (selectedDirectory) {
          installDirectoryInput.value = selectedDirectory;
      }
  });

  // Save Settings Button Click
  saveSettingsButton.addEventListener('click', async () => {
      const newMaxDownloadSpeed = parseInt(maxDownloadSpeedInput.value, 10);
      const newInstallDirectory = installDirectoryInput.value;

      // Input validation
      if (isNaN(newMaxDownloadSpeed) || newMaxDownloadSpeed <= 0) {
          settingsErrorLog.textContent = 'Please enter a valid max download speed.';
          return;
      }

      if (!newInstallDirectory) {
          settingsErrorLog.textContent = 'Please select a valid install directory.';
          return;
      }

      // Update config
      try {
          await window.electronAPI.setConfig({
              maxDownloadSpeed: newMaxDownloadSpeed,
              installDirectory: newInstallDirectory
          });
          // Optionally, send a message to main process to apply settings
          alert('Settings saved successfully.');
          window.close(); // Close the settings window
      } catch (error) {
          console.error('Error saving settings:', error);
          settingsErrorLog.textContent = 'Failed to save settings.';
      }
  });

  // Cancel Settings Button Click
  cancelSettingsButton.addEventListener('click', () => {
      window.close();
  });
});
