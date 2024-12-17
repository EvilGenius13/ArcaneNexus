import React, { useEffect, useState } from "react";
import { useElectronAPI } from "../hooks/useElectronAPI";

const Settings: React.FC = () => {
  const { electronAPI } = useElectronAPI();
  const [maxDownloadSpeed, setMaxDownloadSpeed] = useState<number>(50);
  const [installDirectory, setInstallDirectory] = useState<string>("");
  const [errorLog, setErrorLog] = useState<string>("");

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadSettings() {
    const config = await electronAPI.getConfig();
    if (config.maxDownloadSpeed) setMaxDownloadSpeed(config.maxDownloadSpeed);
    if (config.installDirectory) setInstallDirectory(config.installDirectory);
  }

  async function handleChangeDirectory() {
    const selectedDir = await electronAPI.selectDestination();
    if (selectedDir) {
      setInstallDirectory(selectedDir);
    }
  }

  async function handleSave() {
    if (!maxDownloadSpeed || maxDownloadSpeed <= 0) {
      setErrorLog("Please enter a valid max download speed.");
      return;
    }
    if (!installDirectory) {
      setErrorLog("Please select a valid install directory.");
      return;
    }

    try {
      await electronAPI.setConfig({
        maxDownloadSpeed,
        installDirectory,
      });
      alert("Settings saved successfully.");
    } catch (error) {
      console.error("Error saving settings:", error);
      setErrorLog("Failed to save settings.");
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bebas">Settings</h1>

      <div className="flex flex-col space-y-2">
        <label htmlFor="max-download-speed" className="font-bold">
          Max Download Speed (MB/s):
        </label>
        <input
          type="number"
          id="max-download-speed"
          className="bg-neutral-700 border border-neutral-600 rounded p-2 text-white w-32"
          value={maxDownloadSpeed}
          onChange={(e) => setMaxDownloadSpeed(parseInt(e.target.value, 10))}
        />
      </div>

      <div className="flex flex-col space-y-2">
        <label htmlFor="install-directory" className="font-bold">
          Install Directory:
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            id="install-directory"
            className="bg-neutral-700 border border-neutral-600 rounded p-2 text-white flex-1"
            value={installDirectory}
            readOnly
          />
          <button
            className="bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded text-white"
            onClick={handleChangeDirectory}
          >
            Change
          </button>
        </div>
      </div>

      <div className="flex gap-4 mt-4">
        <button
          className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded text-white"
          onClick={handleSave}
        >
          Save
        </button>
        <button
          className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded text-white"
          onClick={() =>
            window.history.length > 1 ? window.history.back() : null
          }
        >
          Cancel
        </button>
      </div>

      {errorLog && <div className="text-red-400 mt-4">{errorLog}</div>}
    </div>
  );
};

export default Settings;
