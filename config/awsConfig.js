const multer = require("multer");
const multerS3 = require("multer-s3");
const {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const path = require("path");

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_PUBLIC_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  sslEnabled: true, // Enable SSL for security
  signatureVersion: "v4",
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith("image/")) {
    // Additional check for file extensions
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only image files are allowed."), false);
    }
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

function upload(bucket) {
  return multer({
    storage: multerS3({
      s3: s3,
      bucket: bucket,
      metadata: function (req, file, cb) {
        cb(null, {
          fieldName: file.fieldname,
          userId: req.auth?.userId || "unknown",
          uploadDate: new Date().toISOString(),
        });
      },
      contentType: function (req, file, cb) {
        cb(null, file.mimetype);
      },
      key: function (req, file, cb) {
        const timestamp = Date.now().toString();
        const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "");

        // Use folder if provided, otherwise just userId
        const path = `${timestamp}-${sanitizedName}`;
        cb(null, path);
      },
    }),
    fileFilter: fileFilter,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
      files: 20, // Maximum 20 files
    },
  });
}

async function getUrl(bucket, filename) {
  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: filename,
    });

    // Generate the presigned URL with shorter expiration
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour
    return url;
  } catch (error) {
    console.error("Error generating signed URL:", error);
    throw error;
  }
}

async function deleteFile(bucket, filename) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: filename,
    });

    const response = await s3.send(command);
    return response;
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
}

async function getFileAsBlob(bucket, filename) {
  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: filename,
    });

    const response = await s3.send(command);

    // Convert the readable stream to buffer
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    return {
      buffer: buffer,
      contentType: response.ContentType,
      contentLength: response.ContentLength,
      lastModified: response.LastModified,
    };
  } catch (error) {
    console.error("Error downloading file as blob:", error);
    throw error;
  }
}

module.exports = { upload, getUrl, deleteFile, getFileAsBlob };
