const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config();

/**
 * Generates SHA-256 hash for a given file.
 * @param {string} filePath - Path to the file.
 * @returns {string} - Hexadecimal hash string.
 */
function generateFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash("sha256");
  hashSum.update(fileBuffer);
  return hashSum.digest("hex");
}

/**
 * Recursively scans a directory and returns a list of file paths.
 * @param {string} dir - The directory to scan.
 * @param {string} baseDir - The base directory to calculate relative paths.
 * @param {Array} ignoreFiles - Array of file names or extensions to ignore.
 * @returns {Array} - Array of file objects with relative paths.
 */
function scanDirectory(dir, baseDir, ignoreFiles = []) {
  let filesList = [];
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stats = fs.statSync(fullPath);

    // Skip files based on the ignore list
    if (shouldSkipFile(file, ignoreFiles)) {
      return;
    }

    if (stats.isDirectory()) {
      filesList = filesList.concat(
        scanDirectory(fullPath, baseDir, ignoreFiles)
      );
    } else {
      const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, "/");
      filesList.push({
        path: relativePath,
        size: stats.size,
        hash: generateFileHash(fullPath),
      });
    }
  });

  return filesList;
}

/**
 * Checks if the file should be skipped based on its name or extension.
 * @param {string} fileName - The name of the file.
 * @param {Array} ignoreFiles - Array of file names or extensions to ignore.
 * @returns {boolean} - True if the file should be skipped, false otherwise.
 */
function shouldSkipFile(fileName, ignoreFiles) {
  return ignoreFiles.some((pattern) => {
    if (pattern.startsWith(".")) {
      // Match by extension
      return fileName.endsWith(pattern);
    } else {
      // Match by exact file name
      return fileName === pattern;
    }
  });
}

// Load variables from environment
const projectName = process.env.PROJECT_NAME || "Project_Name";
const version = process.env.VERSION || "1.0.0";
const pathToProject =
  process.env.PATH_TO_PROJECT ||
  "/Users/[USER]/dev/ArcaneNexus/packages/server/public_files/your-project-windows";
const pathToProjectLogo = process.env.PATH_TO_PROJECT_LOGO || "";
const pathToProjectImageURL = process.env.PATH_TO_PROJECT_IMAGE_URL || "";
const executablePath = process.env.EXECUTABLE_PATH || "/bin/sample.pdf";

// Configuration
const folderToScan = pathToProject;
const outputFolder = path.join(
  __dirname,
  `../server/output_manifests/${projectName}`
);
const outputManifest = path.join(
  outputFolder,
  `${projectName}_${version}_manifest.json`
);

// Ensure the output folder exists, create it if not
if (!fs.existsSync(outputFolder)) {
  fs.mkdirSync(outputFolder, { recursive: true });
}

// Check if a manifest with the same project name and version already exists
if (fs.existsSync(outputManifest)) {
  console.error(
    `Error: A manifest for project "${projectName}" version "${version}" already exists at ${outputManifest}. Please update the version number.`
  );
  process.exit(1);
}

// Files or extensions to skip
const ignoreList = [".DS_Store", ".log", ".tmp"];

// Verify the folder exists
if (!fs.existsSync(folderToScan)) {
  console.error(`The folder ${folderToScan} does not exist.`);
  process.exit(1);
}

console.log(`Scanning folder: ${folderToScan}`);

// Generate Manifest
const manifest = {
  generatedAt: new Date().toISOString(),
  projectName: projectName,
  version: version,
  pathToProject: pathToProject,
  pathToProjectLogo: pathToProjectLogo,
  pathToProjectImageURL: pathToProjectImageURL,
  executablePath: executablePath,
  files: scanDirectory(folderToScan, folderToScan, ignoreList),
};

fs.writeFileSync(outputManifest, JSON.stringify(manifest, null, 2), "utf-8");

console.log(`Manifest generated at ${outputManifest}`);
