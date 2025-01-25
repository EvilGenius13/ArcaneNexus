import axiosInstance from "./axiosInstance";

/**
 * Retrieve the full list of games.
 */
export async function fetchGamesList() {
  const response = await axiosInstance.get("/");
  return response.data; // structure depends on your backend's response
}

/**
 * Retrieve a single game by its name.
 */
export async function fetchGame(name: string) {
  const response = await axiosInstance.get(`/${name}`);
  return response.data;
}

/**
 * Retrieve all versions for a given game.
 */
export async function fetchGameVersions(name: string) {
  const response = await axiosInstance.get(`/${name}/versions`);
  return response.data;
}

/**
 * Retrieve the latest version for a given game.
 */
export async function fetchLatestGameVersion(name: string) {
  const response = await axiosInstance.get(`/${name}/latest`);
  return response.data;
}
