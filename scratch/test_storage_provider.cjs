/**
 * MedsZop Phase 10B.2 - Task 4: S3 & Local Storage Provider Verification Suite
 * Tests contract completeness, parameter validation, encryption flags,
 * and seamless fallback across LocalStorageProvider and S3StorageProvider.
 */

const path = require("path");
const fs = require("fs");
const assert = require("assert");

const {
  LocalStorageProvider,
  S3StorageProvider,
  getStorageProvider
} = require("../backend/utils/storageService");

async function runStorageTests() {
  console.log("================================================================================");
  console.log("🚀 STARTING STORAGE PROVIDER AUDIT & S3 IMPLEMENTATION VERIFICATION");
  console.log("================================================================================");

  let passed = 0;
  let failed = 0;

  function record(name, isPass, details = "") {
    if (isPass) {
      passed++;
      console.log(`  ✅ [PASS] ${name} ${details ? "- " + details : ""}`);
    } else {
      failed++;
      console.log(`  ❌ [FAIL] ${name} ${details ? "- " + details : ""}`);
    }
  }

  // ----------------------------------------------------------------------------
  // SECTION 1: LocalStorageProvider Verification
  // ----------------------------------------------------------------------------
  console.log("\n[1/3] Testing LocalStorageProvider Contract...");
  try {
    const tempDir = path.resolve(__dirname, "temp_storage_test");
    const localProvider = new LocalStorageProvider(tempDir);

    const testFilename = "rx_test_local_sample.pdf";
    const testContent = Buffer.from("%PDF-1.4 sample prescription content");

    // 1. Save file
    const saveRes = await localProvider.saveFile(testContent, testFilename);
    record("LocalStorage saveFile", saveRes.storage === "local" && saveRes.filename === testFilename, `File path: ${saveRes.filePath}`);

    // 2. Read file stream
    const stream = await localProvider.getFileStream(testFilename);
    let streamData = Buffer.alloc(0);
    for await (const chunk of stream) {
      streamData = Buffer.concat([streamData, chunk]);
    }
    record("LocalStorage getFileStream", streamData.toString() === testContent.toString(), `Bytes read: ${streamData.length}`);

    // 3. Signed URL (Local path routing)
    const signedUrl = await localProvider.getSignedUrl(testFilename);
    record("LocalStorage getSignedUrl", signedUrl === `/uploads/prescriptions/${testFilename}`, `URL: ${signedUrl}`);

    // 4. Delete file
    const deleteRes = await localProvider.deleteFile(testFilename);
    record("LocalStorage deleteFile", deleteRes === true && !fs.existsSync(path.join(tempDir, testFilename)), "File unlinked cleanly");

    // Clean up test dir
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  } catch (err) {
    record("LocalStorageProvider Error", false, err.message);
  }

  // ----------------------------------------------------------------------------
  // SECTION 2: S3StorageProvider Contract & Command Dispatch
  // ----------------------------------------------------------------------------
  console.log("\n[2/3] Testing S3StorageProvider Implementation & Encryption...");
  try {
    let capturedCommands = [];

    // Simulated S3Client to verify command parameters without making network calls or incurring charges
    const mockS3Client = {
      send: async (command) => {
        capturedCommands.push({
          name: command.constructor.name,
          input: command.input
        });

        if (command.constructor.name === "GetObjectCommand") {
          const { Readable } = require("stream");
          return {
            Body: Readable.from([Buffer.from("%PDF-1.4 mocked s3 stream")])
          };
        }
        if (command.constructor.name === "PutObjectCommand") {
          return { ETag: '"mocked-etag-12345"' };
        }
        if (command.constructor.name === "DeleteObjectCommand") {
          return {};
        }
        return {};
      }
    };

    const s3Provider = new S3StorageProvider({
      bucket: "medszop-staging-prescriptions-private",
      region: "ap-south-1",
      kmsKeyId: "arn:aws:kms:ap-south-1:123456789012:key/test-key",
      s3Client: mockS3Client
    });

    // 1. Key Sanitization
    const s3Key = s3Provider.getS3Key("path/traversal/../rx_patient_123.pdf");
    record("S3 Key Sanitization", s3Key === "prescriptions/rx_patient_123.pdf", `Generated S3 Key: ${s3Key}`);

    // 2. PutObject with KMS Encryption
    const putRes = await s3Provider.saveFile(
      Buffer.from("sample content"),
      "rx_patient_123.pdf",
      "application/pdf"
    );
    const putCommand = capturedCommands.find(c => c.name === "PutObjectCommand");
    const isKmsEncrypted = putCommand && putCommand.input.ServerSideEncryption === "aws:kms" && putCommand.input.SSEKMSKeyId.includes("test-key");
    record("S3 saveFile with SSE-KMS Encryption", isKmsEncrypted && putRes.storage === "s3", `Encryption: ${putCommand?.input.ServerSideEncryption}, Bucket: ${putCommand?.input.Bucket}`);

    // 3. GetObject Stream Retrieval
    const s3Stream = await s3Provider.getFileStream("rx_patient_123.pdf");
    const getCommand = capturedCommands.find(c => c.name === "GetObjectCommand");
    let s3Data = Buffer.alloc(0);
    for await (const chunk of s3Stream) {
      s3Data = Buffer.concat([s3Data, chunk]);
    }
    record("S3 getFileStream", Boolean(getCommand && s3Data.length > 0), `Streamed bytes: ${s3Data.length}, Key: ${getCommand?.input.Key}`);

    // 4. DeleteObject Command
    const s3DeleteRes = await s3Provider.deleteFile("rx_patient_123.pdf");
    const deleteCommand = capturedCommands.find(c => c.name === "DeleteObjectCommand");
    record("S3 deleteFile", s3DeleteRes === true && deleteCommand?.input.Key === "prescriptions/rx_patient_123.pdf", `Key: ${deleteCommand?.input.Key}`);

    // 5. Presigned URL generation with offline SigV4 client
    const { S3Client } = require(path.resolve(__dirname, "../backend/node_modules/@aws-sdk/client-s3"));
    const realSigClient = new S3Client({
      region: "ap-south-1",
      credentials: { accessKeyId: "MOCK_KEY_ID_12345", secretAccessKey: "MOCK_SECRET_KEY_12345" }
    });
    const s3ProviderForSigning = new S3StorageProvider({
      bucket: "medszop-staging-prescriptions-private",
      region: "ap-south-1",
      s3Client: realSigClient
    });

    const presignedUrl = await s3ProviderForSigning.getSignedUrl("rx_patient_123.pdf", 300);
    record("S3 getSignedUrl Generation (SigV4)", presignedUrl.includes("X-Amz-Signature") && presignedUrl.includes("X-Amz-Expires=300"), `URL: ${presignedUrl.substring(0, 75)}...`);

  } catch (err) {
    record("S3StorageProvider Error", false, err.message);
  }

  // ----------------------------------------------------------------------------
  // SECTION 3: Storage Factory Dispatch
  // ----------------------------------------------------------------------------
  console.log("\n[3/3] Testing Storage Factory Dispatch...");
  try {
    process.env.STORAGE_PROVIDER = "local";
    const localFactory = getStorageProvider();
    record("Factory returns LocalStorageProvider when local", localFactory instanceof LocalStorageProvider);

    process.env.STORAGE_PROVIDER = "s3";
    const s3Factory = getStorageProvider();
    record("Factory returns S3StorageProvider when s3", s3Factory instanceof S3StorageProvider);

    // Reset env
    process.env.STORAGE_PROVIDER = "local";
  } catch (err) {
    record("Storage Factory Error", false, err.message);
  }

  console.log("\n================================================================================");
  console.log(`STORAGE TEST SUMMARY: Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
  console.log("================================================================================");

  if (failed > 0) process.exit(1);
}

runStorageTests();
