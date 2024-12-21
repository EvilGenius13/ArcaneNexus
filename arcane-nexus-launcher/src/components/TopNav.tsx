import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useElectronAPI } from "../hooks/useElectronAPI";

const TopNav: React.FC = () => {
  const { electronAPI } = useElectronAPI();
  const [serverStatus, setServerStatus] = useState("Checking server status...");

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await electronAPI.checkServerStatus();
        if (status.online) {
          setServerStatus("Server is Online 🟢");
        } else {
          setServerStatus("Server is Offline 🔴");
        }
      } catch (error) {
        console.error("Error checking server status:", error);
        setServerStatus("Server is Offline 🔴");
      }
    };
    checkStatus();
  }, [electronAPI]);

  return (
    <div className="w-full h-12 bg-neutral-800 flex items-center px-4 justify-between">
      <div className="nav-left flex gap-4">
        <Link to="/" className="text-white font-oswald hover:text-gray-300">
          Home
        </Link>
        <Link
          to="/status"
          className="text-white font-oswald hover:text-gray-300"
        >
          Status
        </Link>
        <Link
          to="/settings"
          className="text-white font-oswald hover:text-gray-300"
        >
          Settings
        </Link>
      </div>
      <div className="nav-right text-white font-roboto">
        <span id="server-status">{serverStatus}</span>
      </div>
    </div>
  );
};

export default TopNav;
