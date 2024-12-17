import React, { useEffect, useState } from "react";
import { useElectronAPI } from "../hooks/useElectronAPI";
import { Manifest } from "../types/Manifest";

const Sidebar: React.FC = () => {
  const { electronAPI } = useElectronAPI();

  // States
  const [gameVersion, setGameVersion] = useState<string>("N/A");
  const [gameStatusMessage, setGameStatusMessage] = useState<string>(
    "Loading game status..."
  );
  const [actionLabel, setActionLabel] = useState<string>("Install");
  const [showDownloadInfo, setShowDownloadInfo] = useState<boolean>(false);
  const [downloadCount, setDownloadCount] = useState<string>(
    "Remaining: 0 MB | Speed: 0 MB/s"
  );
  const [progressBarWidth, setProgressBarWidth] = useState<string>("0%");
  const [errorLog, setErrorLog] = useState<string[]>([]);

  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [errorsOccurredDuringDownload, setErrorsOccurredDuringDownload] =
    useState<boolean>(false);
  const [totalBytes, setTotalBytes] = useState<number>(0);
  const [remainingBytes, setRemainingBytes] = useState<number>(0);

  useEffect(() => {
    // On mount, initialize and set up listeners
    initialize();
    setupDownloadListeners();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setupDownloadListeners = () => {
    electronAPI.onDownloadStarted((data) => {
      const { totalFiles, totalBytes } = data;
      setTotalBytes(totalBytes);
      setRemainingBytes(totalBytes);
      setDownloadCount(`Remaining: ${formatBytes(totalBytes)} | Speed: 0 MB/s`);
      setProgressBarWidth("0%");
      setShowDownloadInfo(true);
      setErrorsOccurredDuringDownload(false);
      setErrorLog([]);
    });

    electronAPI.onDownloadProgress((data) => {
      // optional to handle file-count based progress
    });

    electronAPI.onDownloadProgressSize((data) => {
      const { remainingBytes, downloadSpeed } = data;
      setRemainingBytes(remainingBytes);
      const downloadedBytes = totalBytes - remainingBytes;
      const percent =
        totalBytes > 0 ? (downloadedBytes / totalBytes) * 100 : 100;
      setProgressBarWidth(`${percent.toFixed(2)}%`);
      setDownloadCount(
        `Remaining: ${formatBytes(remainingBytes)} | Speed: ${formatSpeed(
          downloadSpeed
        )}`
      );
    });

    electronAPI.onDownloadError((data) => {
      setErrorsOccurredDuringDownload(true);
      const { file, error } = data;
      setErrorLog((prev) => [...prev, `Failed to download ${file}: ${error}`]);
    });

    electronAPI.onDownloadComplete(() => {
      if (errorsOccurredDuringDownload) {
        alert("Download completed with errors. Please try updating again.");
      } else {
        alert("All downloads completed successfully.");
      }
      // Re-initialize UI
      initialize();
    });
  };

  const initialize = async () => {
    try {
      const manifestResponse = await electronAPI.fetchManifest();
      if (manifestResponse.success && manifestResponse.data) {
        const newManifest = manifestResponse.data;
        setManifest(newManifest);
        setGameVersion(newManifest.version);

        const config = await electronAPI.getConfig();
        if (manifestResponse.updatesAvailable) {
          setActionLabel(config.installDirectory ? "Update" : "Install");
          setGameStatusMessage(
            config.installDirectory
              ? "Updates are available."
              : "Ready to install."
          );
        } else {
          if (config.installDirectory) {
            setActionLabel("Play");
            setGameStatusMessage("Your game is up to date.");
          } else {
            setActionLabel("Install");
            setGameStatusMessage("Ready to install.");
          }
        }
      } else {
        setGameStatusMessage("Failed to load manifest.");
        setActionLabel("");
      }
    } catch (error) {
      console.error("Error initializing sidebar:", error);
      setGameStatusMessage("Failed to load manifest.");
      setActionLabel("");
    }
  };

  const handleActionClick = async () => {
    const config = await electronAPI.getConfig();
    if (actionLabel === "Install" || actionLabel === "Update") {
      if (!manifest) {
        alert("Manifest is not loaded or is invalid.");
        return;
      }
      let destination = config.installDirectory;
      if (!destination) {
        // user has not chosen an install directory yet
        destination = await electronAPI.selectDestination();
        if (!destination) {
          // user canceled
          return;
        }
        // save the directory
        await electronAPI.setConfig({ installDirectory: destination });
      }
      // Trigger the download in main process
      electronAPI.downloadFiles(manifest, destination);
    } else if (actionLabel === "Play") {
      if (!config.installDirectory) {
        alert("Game is not installed.");
        return;
      }
      try {
        const result = await electronAPI.launchGame();
        if (!result.success) {
          alert("Failed to launch the game.");
        }
      } catch (error) {
        console.error("Error launching the game:", error);
        alert("An error occurred while launching the game.");
      }
    }
  };

  // Helper functions
  function formatBytes(bytes: number): string {
    if (bytes >= 1e9) {
      return (bytes / 1e9).toFixed(2) + " GB";
    } else if (bytes >= 1e6) {
      return (bytes / 1e6).toFixed(2) + " MB";
    } else if (bytes >= 1e3) {
      return (bytes / 1e3).toFixed(2) + " KB";
    } else {
      return bytes + " B";
    }
  }

  function formatSpeed(bytesPerSecond: number): string {
    if (bytesPerSecond >= 1e6) {
      return (bytesPerSecond / 1e6).toFixed(2) + " MB/s";
    } else if (bytesPerSecond >= 1e3) {
      return (bytesPerSecond / 1e3).toFixed(2) + " KB/s";
    } else {
      return bytesPerSecond + " B/s";
    }
  }

  return (
    <div className="w-64 bg-neutral-900 flex-shrink-0 pt-4 pb-4 px-4 border-r border-neutral-800">
      <img
        src="/assets/logos/logo.webp"
        alt="Arcane Nexus Logo"
        className="w-full max-w-[200px] mx-auto mb-4 rounded"
      />
      <h2 className="text-2xl font-bebas mb-2 text-center">Arcane Nexus</h2>
      <p className="font-roboto text-sm mb-2">Game Version: {gameVersion}</p>
      <p className="font-roboto text-sm">{gameStatusMessage}</p>
      {actionLabel && (
        <button
          className="mt-4 py-2 w-full text-lg text-white bg-blue-600 rounded font-bebas hover:bg-blue-500 transition"
          onClick={handleActionClick}
        >
          {actionLabel}
        </button>
      )}

      {showDownloadInfo && (
        <div id="download-info" className="mt-4">
          <div className="w-full h-5 bg-gray-700 rounded overflow-hidden">
            <div
              className="h-5 bg-green-500 transition-all duration-1000 ease-in-out"
              style={{ width: progressBarWidth }}
            ></div>
          </div>
          <p className="font-roboto text-xs mt-2">{downloadCount}</p>
          <div className="text-red-400 mt-2 max-h-24 overflow-auto text-sm">
            {errorLog.map((err, idx) => (
              <p key={idx}>{err}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
