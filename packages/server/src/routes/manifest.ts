import express from "express";
import Busboy from "busboy";
import { addGame } from "../controllers/gamesController";

const router = express.Router();

router.post("/upload", (req, res) => {
  const busboy = Busboy({ headers: req.headers });

  let gameName: string | undefined;
  let versionName: string | undefined;
  let description: string | undefined;
  let logo: string | undefined;
  let jsonBLOB: string | undefined;
  
  busboy.on("field", (fieldname, val) => {
    switch (fieldname) {
      case "gameName":
        gameName = val.trim();
        break;
      case "versionName":
        versionName = val.trim();
        break;
      case "description":
        description = val.trim();
        break;
      case "logo":
        logo = val.trim();
        break;
    }
  });

  busboy.on("file", (fieldname, file, info) => {
    const chunks: Buffer[] = [];
    file.on("data", (chunk: Buffer) => chunks.push(chunk));
    file.on("end", () => {
      jsonBLOB = Buffer.concat(chunks).toString();
    });
  });

  busboy.on("finish", async () => {
    if (!gameName || !versionName || !description || !jsonBLOB) {
      return res.status(400).json({ error: "Missing required fields or file." });
    }

    try {
      await addGame(gameName, versionName, description, logo || "", jsonBLOB);
      res.status(200).json({ message: "Manifest uploaded and saved successfully." });
    } catch (error) {
      console.error("Error saving to database:", error);
      res.status(500).json({ error: "Failed to save manifest to database." });
    }
  });

  req.pipe(busboy);
});

export default router;
