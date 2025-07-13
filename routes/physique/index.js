const router = require("express").Router();
const physiqueAnalysis = require("../../models/physique");
const { upload } = require("../../config/awsConfig");

// Create upload middleware for physique analysis
const uploadPhotos = upload("physique-pose-training");

// Upload file and forward to external API for pose analysis
router.post("/analyze", uploadPhotos.single("file"), async (req, res) => {
  try {
    console.log("=== PHYSIQUE ANALYSIS ROUTE DEBUG ===");

    const userId = req.auth?.userId;
    console.log("User ID:", userId);

    if (!userId) {
      console.log("ERROR: No user ID found");
      return res.status(401).json({ error: "Authentication required" });
    }

    console.log("File received:", req.file ? "YES" : "NO");
    if (!req.file) {
      console.log("ERROR: No file provided");
      return res.status(400).json({ error: "No file provided" });
    }

    console.log("File details:", {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      s3Key: req.file.key,
    });

    // Get the file buffer from S3
    console.log("Fetching file from S3...");
    const { getFileAsBlob } = require("../../config/awsConfig");
    const bucketName = "physique-pose-training";
    console.log("S3 Bucket:", bucketName);

    const fileBuffer = await getFileAsBlob(bucketName, req.file.key);
    console.log("File buffer size:", fileBuffer.buffer.length, "bytes");

    // Call the physique analysis model
    console.log("Calling physique analysis model...");
    const analysisResult = await physiqueAnalysis.analyzePose(
      fileBuffer.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    console.log("Analysis completed successfully");
    console.log("Analysis result:", JSON.stringify(analysisResult, null, 2));
    console.log("==========================================");

    // Return the analysis result to the frontend
    res.status(200).json({
      success: true,
      fileUploaded: req.file.key,
      analysisResult: analysisResult,
    });
  } catch (error) {
    console.error("=== PHYSIQUE ANALYSIS ERROR ===");
    console.error("Error details:", error);
    console.error("Error message:", error.message);
    if (error.response) {
      console.error("External API response status:", error.response.status);
      console.error("External API response data:", error.response.data);
    }
    console.error("================================");

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
