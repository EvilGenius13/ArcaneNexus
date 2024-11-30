import express from 'express';
import { minioClient } from '../utils/minio';
import Busboy from 'busboy';

const router = express.Router();

router.post('/upload', async (req, res) => {
  try {
    await new Promise<void>((resolve, reject) => {
      const busboy = Busboy({ headers: req.headers });
      const bucketName = 'game-manifests';
      const files: Array<{ message: string; objectName: string }> = [];
      const fileUploadPromises: Array<Promise<void>> = [];
      let hasFile = false;

      let gameName: string | undefined;
      let versionNumber: string | undefined;

      // Handle 'field' events to capture form fields
      busboy.on('field', (fieldname: string, val: string) => {
        if (fieldname === 'gameName') {
          gameName = val.trim();
          console.log(`Received gameName: ${gameName}`);
        } else if (fieldname === 'versionName') {
          versionNumber = val.trim();
          console.log(`Received versionName: ${versionNumber}`);
        }
      });

      // Handle 'file' events to process file uploads
      busboy.on('file', (fieldname: string, file: any, info: any) => {
        const { filename, encoding, mimeType } = info;
        console.log(`Receiving file: ${filename} (${mimeType}) under field: ${fieldname}`);
        hasFile = true;

        if (!gameName || !versionNumber) {
          console.error('Missing gameName or versionName');
          file.resume(); // Discard the file stream if missing
          return;
        }

        // Optional: Validate file types if needed TODO: I don't feel strongly about having this
        /*
        const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!allowedTypes.includes(mimeType)) {
          console.log(`Invalid file type: ${mimeType}. Skipping file: ${filename}`);
          file.resume(); // Discard the stream
          return;
        }
        */

        // Sanitize inputs to prevent security issues TODO: Figure out if we can get away with certain patterns
        const sanitizedGameName = gameName.replace(/[^a-zA-Z0-9-_]/g, '_');
        const sanitizedVersionName = versionNumber.replace(/[^a-zA-Z0-9-_]/g, '-');
        const objectName = `${sanitizedGameName}_v${sanitizedVersionName}_${filename}`;
        const metaData = {
          'Content-Type': mimeType,
          'X-AN-Meta-Data': 'test',
          'X-AN-TimeStamp': new Date().toISOString(),
        };

        // Create a promise for each file upload
        const uploadPromise = minioClient
          .putObject(bucketName, objectName, file, undefined, metaData)
          .then(() => {
            console.log(`File uploaded successfully: ${objectName}`);
            files.push({ message: 'File uploaded successfully', objectName });
          })
          .catch((err) => {
            console.error(`Error uploading file ${objectName}:`, err);
            throw err; // Propagate the error to be caught in Promise.all
          });

        fileUploadPromises.push(uploadPromise);
      });

      // Handle errors from Busboy
      busboy.on('error', (err: any) => {
        console.error('Busboy error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Upload failed' });
        }
        reject(err);
      });

      // Handle 'finish' event when Busboy is done parsing the request
      busboy.on('finish', () => {
        if (!hasFile) {
          console.log('No file uploaded.');
          res.status(400).json({ error: 'No file uploaded' });
          return reject(new Error('No file uploaded'));
        }

        // Validate that both gameName and versionNumber are provided
        if (!gameName || !versionNumber) {
          console.log('Missing gameName or versionNumber.');
          res.status(400).json({ error: 'Missing gameName or versionNumber.' });
          return reject(new Error('Missing gameName or versionNumber.'));
        }

        // Wait for all file uploads to complete
        Promise.all(fileUploadPromises)
          .then(() => {
            console.log('All files uploaded successfully.');
            res.status(200).json({ message: 'All files uploaded successfully', files });
            resolve();
          })
          .catch((err) => {
            console.error('Error during file uploads:', err);
            if (!res.headersSent) {
              res.status(500).json({ error: 'File upload failed' });
            }
            reject(err);
          });
      });

      // Pipe the request stream to Busboy for parsing
      req.pipe(busboy);
    });
  } catch (err_2) {
    console.error('Upload process failed:', err_2);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' }); // Ensure a response is sent
    }
  }
});

export default router;
