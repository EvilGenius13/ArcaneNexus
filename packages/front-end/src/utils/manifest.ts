// src/utils/manifest.ts
import fs from "fs";
import path from "path";
import crypto from "crypto";

interface FileInfo {
  path: string;
  size: number;
  hash: string;
}

interface ManifestParams {
  projectName: string;
  version: string;
  pathToProject: string;
  pathToProjectLogo?: string;
  pathToProjectImageURL?: string;
  executablePath?: string;
}

interface ManifestResult {
  message: string;
  manifestPath: string;
}

/**
 * Generates SHA-256 hash for a given file.
 * @param {string} filePath - Path to the file.
 * @returns {string} - Hexadecimal hash string.
 */
function generateFileHash(filePath: string): string {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash("sha256");
  hashSum.update(fileBuffer);
  return hashSum.digest("hex");
}

/**
 * Recursively scans a directory and returns a list of file paths.
 * @param {string} dir - The directory to scan.
 * @param {string} baseDir - The base directory to calculate relative paths.
 * @param {Array<string>} ignoreFiles - Array of file names or extensions to ignore.
 * @returns {Array<FileInfo>} - Array of file objects with relative paths.
 */
function scanDirectory(dir: string, baseDir: string, ignoreFiles: string[] = []): FileInfo[] {
  let filesList: FileInfo[] = [];
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
 * @param {Array<string>} ignoreFiles - Array of file names or extensions to ignore.
 * @returns {boolean} - True if the file should be skipped, false otherwise.
 */
function shouldSkipFile(fileName: string, ignoreFiles: string[]): boolean {
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

/**
 * Generates a manifest based on provided parameters.
 * @param {ManifestParams} params - Parameters for manifest generation.
 * @param {string} outputFolder - Folder to save the manifest.
 * @returns {ManifestResult} - The result containing message and manifest path.
 */
export function generateManifest(
  params: ManifestParams,
  outputFolder: string
): ManifestResult {
  const {
    projectName = "project_name",
    version = "1.0.0",
    pathToProject,
    pathToProjectLogo = "",
    pathToProjectImageURL = "",
    executablePath = "/bin/sample.pdf",
  } = params;

  const lowerProjectName = projectName.toLowerCase();

  const manifest = {
    generatedAt: new Date().toISOString(),
    projectName: lowerProjectName,
    version: version,
    pathToProject: pathToProject,
    pathToProjectLogo: pathToProjectLogo,
    pathToProjectImageURL: pathToProjectImageURL,
    executablePath: executablePath,
    files: scanDirectory(pathToProject, pathToProject, [".DS_Store", ".log", ".tmp"]),
  };

  // Ensure the output folder exists
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }

  const outputManifest = path.join(
    outputFolder,
    `${lowerProjectName}_${version}_manifest.json`
  );

  // Check if a manifest with the same project name and version already exists
  if (fs.existsSync(outputManifest)) {
    throw new Error(`A manifest for project "${projectName}" version "${version}" already exists at ${outputManifest}. Please update the version number.`);
  }

  fs.writeFileSync(outputManifest, JSON.stringify(manifest, null, 2), "utf-8");

  return {
    message: `Manifest generated at ${outputManifest}`,
    manifestPath: outputManifest,
  };
}
