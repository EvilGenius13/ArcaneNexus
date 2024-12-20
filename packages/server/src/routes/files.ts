import express, {Request, Response, NextFunction, RequestHandler} from "express";
import { minioClient } from "../utils/minio";
import Busboy from "busboy";
import path from "path";

const router = express.Router();

router.post("/upload", async (req, res) => {
  try {
    await new Promise<void>((resolve, reject) => {
      const busboy = Busboy({ headers: req.headers });
      const bucketName = "game-assets";
      const files: Array<{ message: string; objectName: string }> = [];
      const fileUploadPromises: Array<Promise<void>> = [];
      let hasFile = false;

      let gameName: string | undefined;
      let versionNumber: string | undefined;

      // We'll store relative paths in a queue
      const relativePathsQueue: string[] = [];

      busboy.on("field", (fieldname: string, val: string) => {
        if (fieldname === "gameName") {
          gameName = val.trim();
        } else if (fieldname === "versionName") {
          versionNumber = val.trim();
        } else if (fieldname === "filePaths") {
          relativePathsQueue.push(val.trim());
        }
      });

      busboy.on("file", (fieldname: string, file: any, info: any) => {
        console.log(`Starting upload for ${info.filename}`);
        let bytesRead = 0;
        const { filename, mimeType } = info;
        hasFile = true;

        if (!gameName || !versionNumber) {
          file.resume(); // discard if missing fields
          return;
        }

        // Pop the corresponding relative path
        const relativePath = relativePathsQueue.shift() || filename;

        // Sanitize inputs
        const sanitizedGameName = gameName.replace(/[^a-zA-Z0-9-_]/g, "_");
        const sanitizedVersionName = versionNumber.replace(/[^a-zA-Z0-9-_]/g, "-");

        // Incorporate the full relativePath
        const objectName = `${sanitizedGameName}_${relativePath}`;

        const metaData = {
          "Content-Type": mimeType,
          "X-AN-TimeStamp": new Date().toISOString(),
        };

        const uploadPromise = minioClient.putObject(bucketName, objectName, file, undefined, metaData)
          .then(() => {
            files.push({ message: "File uploaded successfully", objectName });
          })
          .catch((err) => {
            throw err;
          });

        fileUploadPromises.push(uploadPromise);
      });

      busboy.on("error", (err: any) => {
        if (!res.headersSent) {
          res.status(500).json({ error: "Upload failed" });
        }
        reject(err);
      });

      busboy.on("finish", () => {
        if (!hasFile) {
          res.status(400).json({ error: "No file uploaded" });
          return reject(new Error("No file uploaded"));
        }

        if (!gameName || !versionNumber) {
          res.status(400).json({ error: "Missing gameName or versionNumber." });
          return reject(new Error("Missing gameName or versionNumber."));
        }

        Promise.all(fileUploadPromises)
          .then(() => {
            res.status(200).json({
              message: "All files uploaded successfully",
              files
            });
            resolve();
          })
          .catch((err) => {
            if (!res.headersSent) {
              res.status(500).json({ error: "File upload failed" });
            }
            reject(err);
          });
      });

      req.pipe(busboy);
    });
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

const downloadHandler: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
  const { gameName, versionName } = req.params;
  const relativePath = (req.params as any)[0];

  if (!gameName || !versionName || !relativePath) {
    res.status(400).send("Missing required parameters");
    return; // Return void
  }

  const sanitizedGameName = gameName.replace(/[^a-zA-Z0-9-_]/g, "_");
  const sanitizedVersionName = versionName.replace(/[^a-zA-Z0-9-_]/g, "-");
  const objectName = relativePath;

  try {
    console.log(`Fetching object: ${objectName}`);
    const objectStream = await minioClient.getObject("game-assets", objectName);
    const ext = path.extname(objectName);
    const contentType = ext === ".md" ? "text/markdown" : "application/octet-stream";

    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${path.basename(objectName)}"`);

    objectStream.on("error", (err) => {
      console.error("Error reading object stream:", err);
      res.status(500).send("Error streaming file");
    });

    objectStream.pipe(res);
  } catch (err) {
    console.error("Error fetching object from MinIO:", err);
    res.status(404).send("File not found");
  }
};

// Use the typed RequestHandler
router.get("/download/:gameName/:versionName/*", downloadHandler);

export default router;
