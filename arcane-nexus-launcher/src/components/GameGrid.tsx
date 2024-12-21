import React, { useEffect, useState } from "react";
import { useElectronAPI } from "../hooks/useElectronAPI";
import { useNavigate } from "react-router-dom";

interface Project {
  pathToProjectImageURL?: string;
  pathToProjectLogo?: string;
  version?: string;
}

const GameGrid: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Record<string, Project[]>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGames();
  }, []);

  async function loadGames() {
    try {
      const response = await fetch("http://localhost:3001/project_list");
      const projectList = await response.json();
      setProjects(projectList);
    } catch (err) {
      console.error("Error fetching game list:", err);
      setError("Failed to fetch game list.");
    }
  }

  return (
    <div>
      {error && <p className="text-red-400">{error}</p>}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-4">
        {Object.keys(projects).map((projectName) => {
          const project = projects[projectName][0];
          const logoUrl =
            project.pathToProjectImageURL || project.pathToProjectLogo;

          return (
            <div
              key={projectName}
              className="game-card bg-neutral-800 rounded p-4 cursor-pointer hover:bg-neutral-700 transition"
              onClick={() =>
                navigate(`/game/${encodeURIComponent(projectName)}`)
              }
            >
              <img
                src={logoUrl}
                alt={`${projectName} Logo`}
                className="w-full h-32 object-contain mb-2"
              />
              <h3 className="font-bebas text-xl">{projectName}</h3>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GameGrid;
