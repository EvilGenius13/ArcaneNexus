import { useEffect, useState } from "react";
import { ManifestResponse, Manifest } from "../types/Manifest";

declare global {
  interface Window {
    electronAPI: {
      checkServerStatus: () => Promise<{ online: boolean }>;
      fetchManifest: () => Promise<ManifestResponse>;
      getConfig: () => Promise<any>;
      setConfig: (config: any) => Promise<void>;
      selectDestination: () => Promise<string | undefined>;
      downloadFiles: (manifest: Manifest, destination: string) => void;
      launchGame: () => Promise<{ success: boolean }>;
      openSettings: () => void;
      onDownloadStarted: (callback: (data: any) => void) => void;
      onDownloadProgress: (callback: (data: any) => void) => void;
      onDownloadProgressSize: (callback: (data: any) => void) => void;
      onDownloadError: (callback: (data: any) => void) => void;
      onDownloadComplete: (callback: () => void) => void;
    };
  }
}

// Example usage:
// const { electronAPI } = useElectronAPI();
// electronAPI.checkServerStatus().then(...);

export function useElectronAPI() {
  // If you need to do any setup or handle listeners, you can do so here.
  const electronAPI = window.electronAPI;
  return { electronAPI };
}
