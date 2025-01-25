import { useQuery } from "react-query";
import {
  fetchGamesList,
  fetchGame,
  fetchGameVersions,
  fetchLatestGameVersion,
} from "../api/gamesAPI";

/**
 * Example interface for a Game.
 * You'd replace this with the actual shape of your Game object.
 */
export interface Game {
  id: string;
  name: string;
  // ... any other properties
}

/**
 * Fetch the list of games.
 */
export function useGamesList() {
  // The key 'gamesList' is the unique cache key for React Query
  // You can choose any string key you want, but keep it consistent.
  return useQuery<Game[]>("gamesList", fetchGamesList);
}

/**
 * Fetch a single game by name.
 *
 * @param name The game's name
 */
export function useGame(name: string) {
  // We use an array key so that we can differentiate data for different names
  return useQuery<Game | null>(["game", name], () => fetchGame(name), {
    enabled: !!name, // won't run unless we have a valid name
  });
}

/**
 * Fetch all versions for a given game.
 *
 * @param name The game's name
 */
export function useGameVersions(name: string) {
  return useQuery<any>(["gameVersions", name], () => fetchGameVersions(name), {
    enabled: !!name,
  });
}

/**
 * Fetch the latest version for a given game.
 *
 * @param name The game's name
 */
export function useLatestGameVersion(name: string) {
  return useQuery<any>(
    ["gameLatestVersion", name],
    () => fetchLatestGameVersion(name),
    {
      enabled: !!name,
    }
  );
}
