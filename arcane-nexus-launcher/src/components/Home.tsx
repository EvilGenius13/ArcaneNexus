import React from "react";
import GameGrid from "./GameGrid";

const Home: React.FC = () => {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bebas">Welcome to Arcane Nexus Launcher</h1>
      <GameGrid />
    </div>
  );
};

export default Home;
