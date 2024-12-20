import { Router } from 'express';
import { getGamesList, getGameVersions, getGame, addGame } from '../controllers/gamesController';
const router = Router();

router.get("/", async (req, res) => {
  try {
    const games = await getGamesList();
    res.json(games);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to list games");
  }
});

router.get("/:name", async (req, res) => {
  try {
    const name = req.params.name;
    const game = await getGame(name);
    res.json(game);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to get game");
  }
});

export default router;