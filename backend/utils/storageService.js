/**
 * MedsZop Prescription Storage Implementation (Phase 10B.2 Production-Ready)
 *
 * Provides a unified storage interface supporting:
 * 1. LocalStorageProvider (Private on-disk storage with header-only Bearer authorization)
 * 2. S3StorageProvider (Private S3 bucket in ap-south-1 with SSE encryption & presigned access)
 *
 * Ensures smooth migration from local disk to private cloud object storage
 * without modifying existing prescription records or breaking API contracts.
 */

const fs = require("fs");
const path = require("path");
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

class StorageProvider {
  async saveFile(buffer, filename, mimeType) {
    throw new Error("saveFile not implemented");
  }
  async getFileStream(filename) {
    throw new Error("getFileStream not implemented");
  }
  async deleteFile(filename) {
    throw new Error("deleteFile not implemented");
  }
  async getSignedUrl(filename, expiresInSeconds) {
    throw new Error("getSignedUrl not implemented");
  }
}

/**
 * Local Disk Provider (Phase 9B.1 Hardened)
 */
class LocalStorageProvider extends StorageProvider {
  constructor(baseDir) {
    super();
    this.baseDir = baseDir || path.resolve(__dirname, "../uploads/prescriptions");
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async saveFile(buffer, filename) {
    const fullPath = path.join(this.baseDir, path.basename(filename));
    await fs.promises.writeFile(fullPath, buffer);
    return {
      storage: "local",
      filename: path.basename(filename),
      filePath: `/uploads/prescriptions/${path.basename(filename)}`
    };
  }

  async getFileStream(filename) {
    const safePath = path.join(this.baseDir, path.basename(filename));
    if (!fs.existsSync(safePath)) {
      throw new Error("File not found");
    }
    return fs.createReadStream(safePath);
  }

  async deleteFile(filename) {
    const safePath = path.join(this.baseDir, path.basename(filename));
    if (fs.existsSync(safePath)) {
      await fs.promises.unlink(safePath);
      return true;
    }
    return false;
  }

  async getSignedUrl(filename, expiresInSeconds = 300) {
    // In local storage, authorization is enforced via Bearer header in getPrescriptionFile
    return `/uploads/prescriptions/${path.basename(filename)}`;
  }
}

/**
 * Cloud S3 Storage Provider (Phase 10B.2 Production-Ready Implementation)
 * Configured with Server-Side Encryption (SSE-KMS or AES256) and presigned URL capabilities.
 */
class S3StorageProvider extends StorageProvider {
  constructor(config = {}) {
    super();
    this.bucket = config.bucket || process.env.AWS_S3_PRESCRIPTION_BUCKET || "medszop-staging-prescriptions-private";
    this.region = config.region || process.env.AWS_REGION || "ap-south-1";
    this.kmsKeyId = config.kmsKeyId || process.env.AWS_KMS_KEY_ID;

    const clientConfig = { region: this.region };
    if (config.credentials || (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)) {
      clientConfig.credentials = config.credentials || {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      };
    }
    if (config.endpoint) {
      clientConfig.endpoint = config.endpoint; // Support custom endpoint (e.g. MinIO / LocalStack)
      clientConfig.forcePathStyle = true;
    }

    this.s3Client = config.s3Client || new S3Client(clientConfig);
  }

  getS3Key(filename) {
    const cleanName = path.basename(filename);
    return `prescriptions/${cleanName}`;
  }

  async saveFile(buffer, filename, mimeType = "application/pdf") {
    const key = this.getS3Key(filename);
    const putParams = {
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ServerSideEncryption: this.kmsKeyId ? "aws:kms" : "AES256"
    };

    if (this.kmsKeyId) {
      putParams.SSEKMSKeyId = this.kmsKeyId;
    }

    const command = new PutObjectCommand(putParams);
    const result = await this.s3Client.send(command);

    return {
      storage: "s3",
      bucket: this.bucket,
      key: key,
      filename: path.basename(filename),
      filePath: `/uploads/prescriptions/${path.basename(filename)}`,
      eTag: result.ETag,
      serverSideEncryption: putParams.ServerSideEncryption
    };
  }

  async getFileStream(filename) {
    const key = this.getS3Key(filename);
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key
    });

    const response = await this.s3Client.send(command);
    return response.Body; // Node.js Readable stream
  }

  async deleteFile(filename) {
    const key = this.getS3Key(filename);
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key
    });

    await this.s3Client.send(command);
    return true;
  }

  async getSignedUrl(filename, expiresInSeconds = 300) {
    const key = this.getS3Key(filename);
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn: expiresInSeconds });
  }
}

// Storage Factory
function getStorageProvider(customType) {
  const provider = customType || process.env.STORAGE_PROVIDER || "local";
  if (provider === "s3") {
    return new S3StorageProvider();
  }
  return new LocalStorageProvider();
}

module.exports = {
  StorageProvider,
  LocalStorageProvider,
  S3StorageProvider,
  getStorageProvider
};
