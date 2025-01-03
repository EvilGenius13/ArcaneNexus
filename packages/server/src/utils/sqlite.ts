// src/utils/sqlite.ts

import path from "path";
import fs from "fs";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";

export interface MyDatabase extends Database {}

let db: MyDatabase | null = null;

export const initializeDatabase = async (): Promise<MyDatabase> => {
  if (db) {
    console.log("Database already initialized");
    return db;
  }

  try {
    // Define the absolute path to the 'data' directory
    const dataDir = path.resolve(__dirname, '../data');

    // Ensure the 'data' directory exists
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log(`Created data directory at ${dataDir}`);
    } else {
      console.log(`Data directory already exists at ${dataDir}`);
    }

    // Define the absolute path to the database file
    const dbPath = path.join(dataDir, 'db.sqlite');

    // Initialize the database
    db = (await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })) as MyDatabase;

    // Create tables if they don't exist
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

    console.log(`Database initialized at ${dbPath}`);
    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error; // Re-throw to be caught in the startServer function
  }
};
