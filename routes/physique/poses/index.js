const router = require("express").Router();
const poseAnalysis = require("../../../models/physique/poses");
const { upload } = require("../../../config/awsConfig");

// Create upload middleware for pose analysis
const uploadPhotos = upload(process.env.POSE_CLASSIFICATION_BUCKET);

// GET /poses - Get all available poses for check-ins
router.get("/", async (req, res) => {
  try {
    const poses = await poseAnalysis.getPoses();
    res.status(200).json(poses);
  } catch (error) {
    console.error("Error getting poses:", error);
    res.status(500).json({
      error: "Error retrieving poses",
    });
  }
});

// POST /assign - Assign pose data
router.post("/assign", async (req, res) => {
  try {
    const userId = req.auth?.userId;
    const { filename, id } = req.body;

    if (!filename || !id) {
      return res.status(400).json({
        error: "Missing required fields: filename and id are required",
      });
    }

    // Insert into physiquePoseClassification table
    const result = await poseAnalysis.assignPose(userId, id, filename);

    res.status(200).json({
      success: true,
      message: "Pose assignment saved successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error in pose assignment:", error);
    res.status(500).json({
      error: "Error processing pose assignment",
      details: error.message,
    });
  }
});

// Upload file and forward to external API for pose analysis
router.post("/analyze", uploadPhotos.single("file"), async (req, res) => {
  try {
    const userId = req.auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    // Get the file buffer from S3
    const { getFileAsBlob } = require("../../../config/awsConfig");
    const bucketName = process.env.POSE_CLASSIFICATION_BUCKET;
    const fileBuffer = await getFileAsBlob(bucketName, req.file.key);

    // Call the pose analysis model
    const analysisResult = await poseAnalysis.analyzePose(
      fileBuffer.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    // Return the analysis result to the frontend
    res.status(200).json({
      success: true,
      fileUploaded: req.file.key,
      analysisResult: analysisResult,
    });
  } catch (error) {
    console.error("Error processing pose analysis:", error.message);

    // Handle specific error types
    if (error.response) {
      // External API returned an error
      res.status(error.response.status).json({
        error: "Analysis API error",
        details: error.response.data,
      });
    } else if (error.message?.includes("Invalid file type")) {
      res
        .status(400)
        .json({ error: "Invalid file type. Only image files are allowed." });
    } else if (error.message?.includes("File too large")) {
      res
        .status(400)
        .json({ error: "File size too large. Maximum 10MB per file." });
    } else {
      res
        .status(500)
        .json({ error: "Failed to process file and call analysis API" });
    }
  }
});

module.exports = router;
