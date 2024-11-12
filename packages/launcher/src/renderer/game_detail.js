// game_detail.js

window.addEventListener("DOMContentLoaded", async () => {
  // DOM elements
  const gameNameElement = document.getElementById("game-name");
  const gameLogoElement = document.getElementById("game-logo");
  const gameVersionElement = document.getElementById("game-version");
  const gameStatusMessage = document.getElementById("game-status-message");
  const actionButton = document.getElementById("action-button");
  const downloadInfo = document.getElementById("download-info");
  const downloadCount = document.getElementById("download-count");
  const progressBar = document.getElementById("progress-bar");
  const errorLog = document.getElementById("error-log");
  const serverStatusElement = document.getElementById("server-status");

  let totalFiles = 0;
  let downloadedFiles = 0;
  let totalBytes = 0;
  let remainingBytes = 0;
  let downloadSpeed = 0;
  let manifest = null;
  let errorsOccurredDuringDownload = false;

  // Function to get URL parameters
  function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  }

  // Function to validate the manifest structure
  function isValidManifest(manifestData) {
    if (
      !manifestData ||
      !manifestData.files ||
      !Array.isArray(manifestData.files)
    )
      return false;
    for (const file of manifestData.files) {
      if (
        typeof file.path !== "string" ||
        typeof file.size !== "number" ||
        typeof file.hash !== "string"
      ) {
        return false;
      }
    }
    if (typeof manifestData.executablePath !== "string") return false;
    if (typeof manifestData.version !== "string") return false;
    return true;
  }

  // Function to load game details
  async function loadGameDetails() {
    const gameName = getQueryParam("game");
    if (!gameName) {
      gameNameElement.textContent = "Game not found.";
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/project_list");
      const projectList = await response.json();
      const project = projectList[gameName]?.[0];

      if (!project) {
        gameNameElement.textContent = "Game not found.";
        return;
      }

      // Update game details
      gameNameElement.textContent = gameName;
      gameLogoElement.src =
        project.pathToProjectImageURL || project.pathToProjectLogo;
      gameVersionElement.textContent = `Version: ${project.version}`;
    } catch (error) {
      console.error("Error fetching game details:", error);
    }
  }

  // Initialize: Check Server Status and fetch manifest
  async function initialize() {
    const serverStatus = await window.electronAPI.checkServerStatus();
    if (serverStatus.online) {
      serverStatusElement.textContent = "Server is Online 🟢";
    } else {
      serverStatusElement.textContent = "Server is Offline 🔴";
    }

    // Fetch manifest
    const manifestResponse = await window.electronAPI.fetchManifest();
    if (manifestResponse.success && isValidManifest(manifestResponse.data)) {
      manifest = manifestResponse.data;
      gameVersionElement.textContent = `Version: ${manifest.version}`;

      const config = await window.electronAPI.getConfig();
      if (manifestResponse.updatesAvailable) {
        actionButton.style.display = "block";
        actionButton.textContent = config.installDirectory
          ? "Update"
          : "Install";
        gameStatusMessage.textContent = config.installDirectory
          ? "Updates are available."
          : "Ready to install.";
      } else {
        actionButton.style.display = "block";
        actionButton.textContent = "Play";
        gameStatusMessage.textContent = "Your game is up to date.";
      }
    } else {
      gameStatusMessage.textContent = "Failed to load manifest.";
      actionButton.style.display = "none";
    }
  }

  // Handle Action Button Click
  actionButton.addEventListener("click", async () => {
    const config = await window.electronAPI.getConfig();
    if (
      actionButton.textContent === "Install" ||
      actionButton.textContent === "Update"
    ) {
      // Implement download functionality here
      // This code is copied from the original script to handle installation/updating
    } else if (actionButton.textContent === "Play") {
      // Implement play functionality here
    }
  });

  // Load game details and initialize
  await loadGameDetails();
  initialize();
});
