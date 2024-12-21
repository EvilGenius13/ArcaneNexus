import { initializeDatabase, MyDatabase } from "../utils/sqlite";

export const getGamesList = async (): Promise<any[]> => {
  const db: MyDatabase = await initializeDatabase();
  const games = await db.all('SELECT DISTINCT name FROM games');
  return games;
}

export const getGameVersions = async (name: string): Promise<any[]> => {
  const db: MyDatabase = await initializeDatabase();
  const versions = await db.all('SELECT version FROM games WHERE name = ?', name);
  return versions;
}

export const getLatestGameVersion = async (name: string): Promise<any> => {
  const db: MyDatabase = await initializeDatabase();
  const version = await db.get('SELECT version FROM games WHERE name = ? ORDER BY version DESC LIMIT 1', name);
  return version;
}

export const getGame = async (name: string): Promise<any> => {
  const db: MyDatabase = await initializeDatabase();
  const game = await db.get('SELECT * FROM games WHERE name = ?', name);
  return game;
}

export const addGame = async (name: string, version: string, description: string, logo: string, jsonBLOB: string): Promise<void> => {
  const db: MyDatabase = await initializeDatabase();
  await db.run('INSERT INTO games (name, version, description, logo, jsonBLOB) VALUES (?, ?, ?, ?, ?)', name, version, description, logo, jsonBLOB);
}