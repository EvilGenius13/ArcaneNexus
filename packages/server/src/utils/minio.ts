// utils/minio.ts
import * as Minio from 'minio';

// TODO: Switch out hardcoded test values with environment variables or configuration
export const minioClient = new Minio.Client({
  endPoint: 'localhost',      // Replace with your MinIO server endpoint
  port: 9000,                 // Default port for MinIO
  useSSL: false,              // Set to true if SSL is enabled
  accessKey: 'development',
  secretKey: 'dev-pass',
});

const defaultRegion = 'us-east-1'; // TODO: Switch out hardcoded region if necessary

/**
 * Checks if a bucket exists.
 * @param bucketName - The name of the bucket to check.
 * @returns {Promise<boolean>} True if the bucket exists, false otherwise.
 */
export const bucketExists = async (bucketName: string): Promise<boolean> => {
  try {
    const exists = await minioClient.bucketExists(bucketName);
    return exists;
  } catch (error) {
    console.error(`Error checking existence of bucket "${bucketName}":`, error);
    return false;
  }
};

/**
 * Creates a bucket.
 * @param bucketName - The name of the bucket to create.
 * @returns {Promise<void>}
 */
export const createBucket = async (bucketName: string): Promise<void> => {
  try {
    await minioClient.makeBucket(bucketName, defaultRegion);
    console.log(`Bucket "${bucketName}" created successfully.`);
  } catch (error) {
    console.error(`Error creating bucket "${bucketName}":`, error);
  }
};

/**
 * Initializes multiple MinIO buckets.
 * Checks if each bucket exists; if not, creates it.
 * @param bucketNames - An array of bucket names to initialize.
 */
export const initializeBuckets = async (bucketNames: string[]): Promise<void> => {
  for (const bucketName of bucketNames) {
    const exists = await bucketExists(bucketName);
    if (!exists) {
      await createBucket(bucketName);
    } else {
      console.log(`Bucket "${bucketName}" already exists.`);
    }
  }
};
