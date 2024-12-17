import React from "react";
import TopNav from "./components/TopNav";
import Sidebar from "./components/Sidebar";
import AppRouter from "./router/Router";

function App() {
  return (
    <div className="w-full h-screen bg-neutral-900 text-white flex flex-col">
      {/* Top Navigation Bar */}
      <TopNav />

      {/* Main Layout Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-4">
          <AppRouter />
        </div>
      </div>
    </div>
  );
}

export default App;
