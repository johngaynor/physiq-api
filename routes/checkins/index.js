const router = require("express").Router();
const checkInFunctions = require("../../models/checkins");
const { upload } = require("../../config/awsConfig");

// Create upload middleware for check-in photos
const uploadPhotos = upload(process.env.CHECKIN_BUCKET);

router.get("/", async (req, res) => {
  const userId = req.auth.userId;
  const result = await checkInFunctions.getCheckIns(userId);
  res.status(200).json(result);
});

// Create or update check-in with optional photo upload
router.post("/", uploadPhotos.array("images", 20), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id, date, cheats, comments, training } = req.body;

    // Get uploaded file names from S3
    const uploadedFiles = req.files ? req.files.map((file) => file.key) : [];

    // Create/update the check-in with the uploaded file names
    const result = await checkInFunctions.editCheckIn(userId, {
      id,
      date,
      cheats,
      comments,
      training,
      attachments: uploadedFiles.map((filename) => ({
        s3Filename: filename,
        poseId: null,
      })),
    });

    res.status(200).json({
      ...result,
      uploadedFiles: uploadedFiles,
    });
  } catch (error) {
    console.error("Error creating/editing check-in:", error);

    // Handle specific error types
    if (
      error.message?.includes("Invalid file type") ||
      error.message?.includes("Only image files")
    ) {
      res
        .status(400)
        .json({ error: "Invalid file type. Only image files are allowed." });
    } else if (error.message?.includes("File too large")) {
      res
        .status(400)
        .json({ error: "File size too large. Maximum 10MB per file." });
    } else {
      res.status(500).json({ error: "Failed to create/edit check-in" });
    }
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const checkInId = req.params.id;

    const result = await checkInFunctions.deleteCheckIn(userId, checkInId);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error deleting check-in:", error);
    if (error.message === "Check-in not found or unauthorized") {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to delete check-in" });
    }
  }
});

// Get attachments for a specific check-in
router.get("/attachments/:id", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.params;

    const result = await checkInFunctions.getCheckInAttachments(userId, id);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error getting check-in attachments:", error);
    if (error.message === "Check-in not found or unauthorized") {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to get check-in attachments" });
    }
  }
});

// // Upload photos to existing check-in
// router.post("/photos", uploadPhotos.array("images", 20), async (req, res) => {
//   try {
//     const userId = req.auth.userId;
//     const { checkInId } = req.body;

//     // Validate checkInId
//     if (!checkInId) {
//       return res.status(400).json({ error: "checkInId is required" });
//     }

//     // Validate that files were uploaded
//     if (!req.files || req.files.length === 0) {
//       return res.status(400).json({ error: "No images uploaded" });
//     }

//     // Extract file keys (S3 filenames) from uploaded files
//     const fileNames = req.files.map((file) => file.key);

//     // Add photos to the check-in
//     const result = await checkInFunctions.addPhotos(
//       userId,
//       checkInId,
//       fileNames
//     );

//     res.status(200).json({
//       message: "Photos uploaded successfully",
//       filesUploaded: fileNames,
//       ...result,
//     });
//   } catch (error) {
//     console.error("Error uploading photos:", error);

//     // Handle specific error types
//     if (error.message === "Check-in not found or unauthorized") {
//       res.status(404).json({ error: error.message });
//     } else if (
//       error.message?.includes("Invalid file type") ||
//       error.message?.includes("Only image files")
//     ) {
//       res
//         .status(400)
//         .json({ error: "Invalid file type. Only image files are allowed." });
//     } else if (error.message?.includes("File too large")) {
//       res
//         .status(400)
//         .json({ error: "File size too large. Maximum 10MB per file." });
//     } else {
//       res.status(500).json({ error: "Failed to upload photos" });
//     }
//   }
// });

// // Remove a specific photo from a check-in
// router.delete("/:checkInId/photos/:photoId", async (req, res) => {
//   try {
//     const userId = req.auth.userId;
//     const { checkInId, photoId } = req.params;

//     const result = await checkInFunctions.removePhoto(
//       userId,
//       checkInId,
//       photoId
//     );
//     res.status(200).json(result);
//   } catch (error) {
//     console.error("Error removing photo:", error);
//     if (error.message === "Photo not found or unauthorized") {
//       res.status(404).json({ error: error.message });
//     } else {
//       res.status(500).json({ error: "Failed to remove photo" });
//     }
//   }
// });

// // Get signed URLs for check-in photos
// router.get("/:checkInId/photos/urls", async (req, res) => {
//   try {
//     const userId = req.auth.userId;
//     const { checkInId } = req.params;

//     const result = await checkInFunctions.getPhotoUrls(userId, checkInId);
//     res.status(200).json(result);
//   } catch (error) {
//     console.error("Error getting photo URLs:", error);
//     if (error.message === "Check-in not found or unauthorized") {
//       res.status(404).json({ error: error.message });
//     } else {
//       res.status(500).json({ error: "Failed to get photo URLs" });
//     }
//   }
// });

module.exports = router;
