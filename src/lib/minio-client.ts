import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';

// MinIO client configuration
// For local development, always use localhost instead of container name
let endPoint = process.env.MINIO_ENDPOINT || 'localhost';
if (endPoint === 'minio') {
  endPoint = 'localhost';
}

const minioClient = new Minio.Client({
  endPoint: endPoint,
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
});

// Default bucket name
const DEFAULT_BUCKET = process.env.MINIO_BUCKET || 'atlas-erp';

/**
 * Ensures that the specified bucket exists, creating it if necessary
 */
export async function ensureBucketExists(bucketName: string = DEFAULT_BUCKET): Promise<void> {
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName, 'us-east-1');
      console.log(`Bucket '${bucketName}' created successfully`);

      // Set bucket policy to allow public read access if needed
      // This is optional and depends on your security requirements
      /*
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucketName}/*`],
          },
        ],
      };
      await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
      */
    }
  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
    throw error;
  }
}

/**
 * Uploads a file to MinIO
 * @param file The file to upload (Buffer or ReadableStream)
 * @param fileName Original file name
 * @param contentType MIME type of the file
 * @param bucketName Bucket to upload to (defaults to DEFAULT_BUCKET)
 * @returns Object with file information including URL
 */
export async function uploadFile(
  file: Buffer | NodeJS.ReadableStream,
  fileName: string,
  contentType: string,
  bucketName: string = DEFAULT_BUCKET
): Promise<{
  fileName: string;
  objectName: string;
  etag: string;
  url: string;
}> {
  try {
    // Ensure bucket exists
    await ensureBucketExists(bucketName);

    // Generate a unique object name to prevent collisions
    const objectName = `${Date.now()}-${uuidv4()}-${fileName}`;

    // Upload the file
    const etag = await minioClient.putObject(
      bucketName,
      objectName,
      file,
      {
        'Content-Type': contentType,
      }
    );

    // Generate a URL for the uploaded file
    const url = await minioClient.presignedGetObject(bucketName, objectName, 24 * 60 * 60); // 24 hours link

    return {
      fileName,
      objectName,
      etag,
      url,
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

/**
 * Lists all files in a bucket
 * @param bucketName Bucket to list files from (defaults to DEFAULT_BUCKET)
 * @param prefix Optional prefix to filter objects
 * @returns Array of object information
 */
export async function listFiles(
  bucketName: string = DEFAULT_BUCKET,
  prefix: string = ''
): Promise<Minio.BucketItem[]> {
  try {
    // Ensure bucket exists
    await ensureBucketExists(bucketName);

    const objectsStream = minioClient.listObjects(bucketName, prefix, true);

    return new Promise((resolve, reject) => {
      const objects: Minio.BucketItem[] = [];

      objectsStream.on('data', (obj) => {
        objects.push(obj);
      });

      objectsStream.on('error', (err) => {
        reject(err);
      });

      objectsStream.on('end', () => {
        resolve(objects);
      });
    });
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
}

/**
 * Gets a presigned URL for a file
 * @param objectName The object name in MinIO
 * @param bucketName Bucket name (defaults to DEFAULT_BUCKET)
 * @param expirySeconds How long the URL should be valid for (in seconds)
 * @returns Presigned URL
 */
export async function getFileUrl(
  objectName: string,
  bucketName: string = DEFAULT_BUCKET,
  expirySeconds: number = 24 * 60 * 60
): Promise<string> {
  try {
    return await minioClient.presignedGetObject(bucketName, objectName, expirySeconds);
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw error;
  }
}

/**
 * Deletes a file from MinIO
 * @param objectName The object name to delete
 * @param bucketName Bucket name (defaults to DEFAULT_BUCKET)
 */
export async function deleteFile(
  objectName: string,
  bucketName: string = DEFAULT_BUCKET
): Promise<void> {
  try {
    await minioClient.removeObject(bucketName, objectName);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

export default {
  uploadFile,
  listFiles,
  getFileUrl,
  deleteFile,
  ensureBucketExists,
  client: minioClient,
};
