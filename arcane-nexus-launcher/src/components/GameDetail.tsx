import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

interface ProjectData {
  pathToProjectImageURL?: string;
  pathToProjectLogo?: string;
  version?: string;
}

const GameDetail: React.FC = () => {
  const { gameName } = useParams();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!gameName) {
      setError("Game not specified.");
      return;
    }
    loadGameDetails(gameName);
  }, [gameName]);

  async function loadGameDetails(name: string) {
    try {
      const response = await fetch("http://localhost:3001/project_list");
      const projectList = await response.json();
      const thisProject = projectList[name]?.[0];

      if (!thisProject) {
        setError("Game not found.");
        return;
      }
      setProject(thisProject);
    } catch (err) {
      console.error("Error fetching game details:", err);
      setError("Error fetching game details.");
    }
  }

  if (error) {
    return <div className="text-red-400">{error}</div>;
  }

  if (!project) {
    return <div>Loading game details...</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bebas">{gameName}</h1>
      <img
        src={project.pathToProjectImageURL || project.pathToProjectLogo}
        alt="Game Logo"
        className="w-64 h-64 object-contain"
      />
      <p className="font-roboto">Version: {project.version}</p>
      <p className="font-roboto">Patch notes here [WIP]</p>
    </div>
  );
};

export default GameDetail;
