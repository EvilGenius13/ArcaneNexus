import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

interface Project {
  name?: string;
  logo?: string;
  description?: string;
}

const GameGrid: React.FC = () => {
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGames();
  }, []);

  async function loadGames() {
    try {
      const response = await fetch("http://localhost:3000/api/games");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Fetched games:", data);

      setProjects(data);
    } catch (err) {
      console.error("Error fetching game list:", err);
      setError("Failed to fetch game list.");
    }
  }

  return (
    <div>
      {error && <p className="text-red-400">{error}</p>}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-4">
        {projects.map((project, index) => {
          return (
            <div
              key={index}
              className="game-card bg-neutral-800 rounded p-4 cursor-pointer hover:bg-neutral-700 transition"
              onClick={() =>
                navigate(`/game/${encodeURIComponent(project.name ?? "")}`)
              }
            >
              <img
                src={project.logo}
                alt={`${project.name} Logo`}
                className="w-full h-32 object-contain mb-2"
              />
              <h3 className="text-center font-bebas text-xl">{project.name}</h3>
              {/* optionally display description here */}
              <p className="text-center text-sm">{project.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GameGrid;
