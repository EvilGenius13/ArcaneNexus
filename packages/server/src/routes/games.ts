import { Router } from 'express';
import { minioClient } from "../utils/minio";
import getGames from "../controllers/gamesController";

const router = Router();

// TODO: This absolutely needs to get changed. We should write to SQLite with the game name or even a JSON file if needed.

router.get("/", async (req, res) => {
  try {
    const games = await getGames();
    res.json(games);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to list games");
  }
});

export default router;