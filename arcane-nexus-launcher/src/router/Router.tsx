import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "../components/Home";
import Status from "../components/Status";
import Settings from "../components/Settings";
import GameDetail from "../components/GameDetail";

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/status" element={<Status />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/game/:gameName" element={<GameDetail />} />
    </Routes>
  );
}
