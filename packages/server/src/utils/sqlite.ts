import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";

export interface MyDatabase extends Database {
}

let db: MyDatabase | null = null;

export const initializeDatabase = async (): Promise<MyDatabase> => {
  if (db){
    console.log("Database already initialized");
    return db;
  }

  db = (await open({
    filename: "./db.sqlite",
    driver: sqlite3.Database,
  })) as MyDatabase;
  
  await db.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      name TEXT NOT NULL, 
      version TEXT NOT NULL,
      description TEXT NOT NULL,
      logo TEXT NOT NULL,
      jsonBLOB BLOB NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

  console.log("Database initialized");
  return db;
}

