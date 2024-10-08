const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Generates SHA-256 hash for a given file.
 * @param {string} filePath - Path to the file.
 * @returns {string} - Hexadecimal hash string.
 */
function generateFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('sha256');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
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
            filesList = filesList.concat(scanDirectory(fullPath, baseDir, ignoreFiles));
        } else {
            const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
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
        if (pattern.startsWith('.')) {
            // Match by extension
            return fileName.endsWith(pattern);
        } else {
            // Match by exact file name
            return fileName === pattern;
        }
    });
}

// Configuration
const folderToScan = '/Users/jaina/Documents/example'; // <--- Change Me
const outputManifest = path.join(__dirname, 'manifest.json');

// Files or extensions to skip
const ignoreList = ['.DS_Store', '.log', '.tmp'];

// Verify the folder exists
if (!fs.existsSync(folderToScan)) {
    console.error(`The folder ${folderToScan} does not exist.`);
    process.exit(1);
}

console.log(`Scanning folder: ${folderToScan}`);

// Generate Manifest (These will turn into environment variables later)
const manifest = {
    generatedAt: new Date().toISOString(),
    version: '1.0.1',
    executablePath: "/bin/sample.pdf",
    files: scanDirectory(folderToScan, folderToScan, ignoreList),
};

fs.writeFileSync(outputManifest, JSON.stringify(manifest, null, 2), 'utf-8');

console.log(`Manifest generated at ${outputManifest}`);
