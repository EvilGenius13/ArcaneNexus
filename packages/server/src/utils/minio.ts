// utils/minio.ts
import * as Minio from 'minio';

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT || 'localhost';
const MINIO_PORT = process.env.MINIO_PORT ? parseInt(process.env.MINIO_PORT) : 9000;
const MINIO_REGION = process.env.MINIO_REGION || 'us-east-1';
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY || 'development';
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY || 'dev-pass';

export const minioClient = new Minio.Client({
  endPoint: MINIO_ENDPOINT,
  port: MINIO_PORT,
  useSSL: false, // TODO: Look into enabling SSL
  accessKey: MINIO_ACCESS_KEY,
  secretKey: MINIO_SECRET_KEY,
});

const defaultRegion = MINIO_REGION;

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
