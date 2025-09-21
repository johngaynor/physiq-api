const router = require("express").Router();
const canAccess = require("../../../models/middleware/canAccess");
const poseAnalysis = require("../../../models/physique/poses");
const { upload } = require("../../../config/awsConfig");

const uploadPhotos = upload(process.env.POSE_CLASSIFICATION_BUCKET);

router.get("/", canAccess([28, 34]), async (req, res) => {
  try {
    const poses = await poseAnalysis.getPoses();
    res.status(200).json(poses);
  } catch (error) {
    res.routeError("/physique/poses", error);
  }
});

router.post("/assign", canAccess(34), async (req, res) => {
  try {
    const userId = req.auth?.userId;
    const { filename, id } = req.body;

    if (!filename || !id) throw new Error("Filename and pose ID are required");

    // Insert into physiquePoseClassification table
    const result = await poseAnalysis.assignPose(userId, id, filename);

    res.status(200).json({
      success: true,
      message: "Pose assignment saved successfully",
      data: result,
    });
  } catch (error) {
    res.routeError("/physique/poses/assign", error);
  }
});

router.post(
  "/analyze",
  canAccess(34),
  uploadPhotos.array("files", 10),
  async (req, res) => {
    try {
      const userId = req.auth?.userId;

      if (!req.files || req.files.length === 0)
        throw new Error("No files provided");

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
      res.routeError("/physique/poses/analyze", error, {
        apiError: error.response,
        fileType: error.message?.includes("Invalid file type"),
        fileSize: error.message?.includes("File too large"),
      });
    }
  }
);

module.exports = router;
