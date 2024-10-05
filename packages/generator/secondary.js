const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * Generates SHA-256 hash for a given file.
 * @param {string} filePath - Path to the file.
 * @returns {Promise<string>} - Hexadecimal hash string.
 */
async function generateFileHash(filePath) {
    const fileBuffer = await fs.readFile(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
}

/**
 * Recursively scans a directory and returns a list of file paths.
 * @param {string} dir - The directory to scan.
 * @param {string} baseDir - The base directory to calculate relative paths.
 * @param {Array} ignoreFiles - Array of file names or extensions to ignore.
 * @returns {Promise<Array>} - Array of file objects with relative paths.
 */
async function scanDirectory(dir, baseDir, ignoreFiles = []) {
    let filesList = [];
    const files = await fs.readdir(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stats = await fs.stat(fullPath);

        // Skip files based on the ignore list
        if (shouldSkipFile(file, ignoreFiles)) {
            continue;
        }

        if (stats.isDirectory()) {
            const subFiles = await scanDirectory(fullPath, baseDir, ignoreFiles);
            filesList = filesList.concat(subFiles);
        } else {
            const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
            const hash = await generateFileHash(fullPath);
            filesList.push({
                path: relativePath,
                size: stats.size,
                hash: hash,
            });
        }
    }

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
const folderToScan = '/Users/jaina/Documents/my_folder'; // <--- Change Me
const outputManifest = path.join(__dirname, 'manifest.json');

// Files or extensions to skip
const ignoreList = ['.DS_Store', '.log', '.tmp'];

// Verify the folder exists
fs.access(folderToScan)
    .then(() => {
        console.log(`Scanning folder: ${folderToScan}`);

        // Generate Manifest
        return scanDirectory(folderToScan, folderToScan, ignoreList);
    })
    .then((files) => {
        const manifest = {
            generatedAt: new Date().toISOString(),
            files: files,
        };

        return fs.writeFile(outputManifest, JSON.stringify(manifest, null, 2), 'utf-8');
    })
    .then(() => {
        console.log(`Manifest generated at ${outputManifest}`);
    })
    .catch((err) => {
        console.error(`Error: ${err.message}`);
    });
