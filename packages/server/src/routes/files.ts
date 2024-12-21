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
        const { filename, mimeType } = info;
        hasFile = true;

        if (!gameName || !versionNumber) {
          file.resume(); 
          return;
        }

        let relativePath = relativePathsQueue.shift() || filename;

        // Remove user's chosen top-level folder:
        const parts = relativePath.split('/');
        parts.shift(); // remove user-chosen folder name

        const sanitizedGameName = gameName.replace(/[^a-zA-Z0-9-_]/g, "_");
        const sanitizedVersionName = versionNumber.replace(/[^a-zA-Z0-9._-]/g, "-");
        const topLevelDir = `${sanitizedGameName}_v${sanitizedVersionName}`;

        relativePath = `${topLevelDir}/${parts.join('/')}`;

        const metaData = {
          "Content-Type": mimeType,
          "X-AN-TimeStamp": new Date().toISOString(),
        };

        const uploadPromise = minioClient.putObject(bucketName, relativePath, file, undefined, metaData)
          .then(() => {
            files.push({ message: "File uploaded successfully", objectName: relativePath });
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
    return;
  }

  // The manifest and front-end code ensure relativePath starts with `GameName_vVersion`,
  // so we can just use relativePath directly.
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

router.get("/download/:gameName/:versionName/*", downloadHandler);

export default router;
