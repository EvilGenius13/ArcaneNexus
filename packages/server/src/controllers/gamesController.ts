import { Database, Statement } from "sqlite";
import db from "../utils/sqlite";

const sqlDB = db

export default async function getGames(sqlDB: Database): Promise<string[]> {
  const sql = "SELECT DISTINCT game_name FROM games";
  const result = await db.all(sql);
  if (!result) {
    throw new Error("No games found");
  }
  return result.map(row => row.game_name);
}

