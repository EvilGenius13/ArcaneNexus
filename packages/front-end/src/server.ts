// src/server.ts
import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import { generateManifest } from './utils/manifest'; // Adjust the path as necessary

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware to parse JSON and URL-encoded data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, '../public')));

/**
 * @route POST /api/manifest/upload
 * @desc Generate a manifest based on form data
 * @access Public
 */
app.post('/api/manifest/upload', (req, res) => {
  const {
    projectName,
    version,
    pathToProject,
    pathToProjectLogo,
    pathToProjectImageURL,
    executablePath,
  } = req.body;

  // Validate required fields
  if (!projectName || !version || !pathToProject) {
    return res.status(400).json({
      error: 'projectName, version, and pathToProject are required fields.',
    });
  }

  // Define the output folder (adjust as needed)
  const outputFolder = path.join(__dirname, '../server/output_manifests', projectName.toLowerCase());

  try {
    const result = generateManifest({
      projectName,
      version,
      pathToProject,
      pathToProjectLogo,
      pathToProjectImageURL,
      executablePath,
    }, outputFolder);

    res.status(200).json({
      message: result.message,
      manifestPath: result.manifestPath,
    });
  } catch (error:any) {
    console.error('Manifest Generation Error:', error.message);
    res.status(500).json({
      error: error.message,
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🌐 Front-end server is running on http://localhost:${PORT}`);
});
