const router = require("express").Router();
const canAccess = require("../../../models/middleware/canAccess");
const poseAnalysis = require("../../../models/physique/poses");
const { upload } = require("../../../config/awsConfig");

// Create upload middleware for pose analysis
const uploadPhotos = upload(process.env.POSE_CLASSIFICATION_BUCKET);

// GET /poses - Get all available poses for check-ins
router.get("/", canAccess([28, 34]), async (req, res) => {
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
router.post("/assign", canAccess(34), async (req, res) => {
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

// Upload files and forward to external API for pose analysis
router.post(
  "/analyze",
  canAccess(34),
  uploadPhotos.array("files", 10),
  async (req, res) => {
    try {
      const userId = req.auth?.userId;

      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No files provided" });
      }

      // Extract all file keys
      const fileKeys = req.files.map((file) => file.key);

      const analysisResults = await poseAnalysis.analyzePose({
        filenames: fileKeys,
        isTraining: 1,
        userId,
        bucket: process.env.POSE_CLASSIFICATION_BUCKET,
      });

      // Return the analysis result to the frontend
      res.status(200).json(analysisResults);
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
          .json({ error: "Failed to process files and call analysis API" });
      }
    }
  }
);

module.exports = router;
