// index.js

window.addEventListener("DOMContentLoaded", async () => {
  // DOM elements
  const gameGrid = document.getElementById("game-grid");
  const serverStatusElement = document.getElementById("server-status");

  // Function to load game data from the API
  async function loadGames() {
    try {
      const response = await fetch("http://localhost:3000/project_list");
      const projectList = await response.json();

      // Create game cards for each project
      for (const projectName in projectList) {
        if (projectList.hasOwnProperty(projectName)) {
          const project = projectList[projectName][0];
          const logoUrl =
            project.pathToProjectImageURL || project.pathToProjectLogo;

          // Create game card
          const gameCard = document.createElement("div");
          gameCard.classList.add("game-card");
          gameCard.addEventListener("click", () => {
            window.location.href = `game_detail.html?game=${encodeURIComponent(
              projectName
            )}`;
          });

          // Logo image
          const logoImg = document.createElement("img");
          logoImg.src = logoUrl;
          logoImg.alt = `${projectName} Logo`;

          // Title
          const title = document.createElement("h3");
          title.textContent = projectName;

          // Append elements to the game card
          gameCard.appendChild(logoImg);
          gameCard.appendChild(title);
          gameGrid.appendChild(gameCard);
        }
      }
    } catch (error) {
      console.error("Error fetching game list:", error);
    }
  }

  // Initialize: Check Server Status
  async function initialize() {
    // Update server status in the nav bar
    const serverStatus = await window.electronAPI.checkServerStatus();
    if (serverStatus.online) {
      serverStatusElement.textContent = "Server is Online 🟢";
    } else {
      serverStatusElement.textContent = "Server is Offline 🔴";
    }
  }

  // Load games and initialize on page load
  await initialize();
  loadGames();
});
