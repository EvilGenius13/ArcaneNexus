// src/routes/media.ts

import express, { Request, Response, NextFunction, RequestHandler } from "express";
import { minioClient } from "../utils/minio";
import path from "path";
import mime from "mime-types";
import rateLimit from "express-rate-limit";

const router = express.Router();

// Define rate limiter to prevent abuse
const downloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many download requests from this IP, please try again later.",
});

// Define TypeScript interface for route parameters
interface DownloadParams {
  gameName: string;
  versionNumber: string;
  "0": string; // Captures the wildcard part of the route (relativePath)
}

// Download Handler
const downloadHandler: RequestHandler<DownloadParams> = async (req, res, next) => {
  const { gameName, versionNumber, "0": relativePath } = req.params;

  // Validate presence of parameters
  if (!gameName || !versionNumber || !relativePath) {
    console.error("Missing gameName, versionNumber, or relativePath in parameters.");
    res.status(400).json({ error: "Missing gameName, versionNumber, or relativePath in parameters." });
    return;
  }

  // Define bucketName as a constant
  const bucketName = "game-assets";

  // Sanitize inputs to prevent malicious paths
  const sanitizedGameName = gameName.replace(/[^a-zA-Z0-9-_]/g, "_");
  const sanitizedVersionNumber = versionNumber.replace(/[^a-zA-Z0-9._-]/g, "-");
  
  // **Updated Sanitization to Allow Dots in Relative Path**
  const sanitizedRelativePath = relativePath.replace(/[^a-zA-Z0-9-_.\/]/g, "_");

  // Reconstruct objectPath to match the upload structure
  const objectPath = `${sanitizedGameName}_v${sanitizedVersionNumber}/${sanitizedRelativePath}`;

  console.log(`Attempting to fetch object: ${objectPath} from bucket: ${bucketName}`);

  try {
    // Check if the object exists
    await minioClient.statObject(bucketName, objectPath);

    // Determine content type based on file extension
    const ext = path.extname(objectPath);
    const contentType = mime.lookup(ext) || "application/octet-stream";

    // Set response headers
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${path.basename(objectPath)}"`);
    res.setHeader("Cache-Control", "public, max-age=31536000"); // Optional: cache for 1 year

    // Fetch the object as a stream
    const downloadStream = await minioClient.getObject(bucketName, objectPath);

    // Handle stream errors
    downloadStream.on("error", (err: any) => {
      console.error(`Error streaming object ${objectPath}:`, err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Error streaming the file." });
      }
    });

    // Pipe the stream to the response
    downloadStream.pipe(res);
  } catch (err: any) {
    if (err.code === "NotFound" || err.code === "NoSuchKey") {
      console.warn(`File not found: ${objectPath} in bucket: ${bucketName}`);
      res.status(404).json({ error: "File not found." });
    } else {
      console.error(`Error retrieving object ${objectPath} from bucket ${bucketName}:`, err);
      res.status(500).json({ error: "Internal server error." });
    }
  }
};

// Define the route with wildcard
router.get("/download/:gameName/:versionNumber/*", downloadLimiter, downloadHandler as any);

export default router;
