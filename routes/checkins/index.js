const router = require("express").Router();
const checkInFunctions = require("../../models/checkins");
const poseAnalysis = require("../../models/physique/poses");
const { upload, getFileAsBlob } = require("../../config/awsConfig");
const { sendEmail } = require("../../config/mail");
const multer = require("multer");

// Create upload middleware for check-in photos
const uploadPhotos = upload(process.env.CHECKIN_BUCKET);

// Create local multer instance for email attachments
const localStorage = multer({
  dest: "temp/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype === "application/pdf"
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image files and PDFs are allowed"), false);
    }
  },
});

router.get("/", async (req, res) => {
  const userId = req.auth.userId;
  const result = await checkInFunctions.getCheckIns(userId);
  res.status(200).json(result);
});

// Get all check-in comments for a specific check-in
router.get("/comments/:checkInId", async (req, res) => {
  try {
    const { checkInId } = req.params;
    const result = await checkInFunctions.getCheckInComments(checkInId);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error getting check-in comments:", error);
    res.status(500).json({ error: "Failed to get check-in comments" });
  }
});

// Insert a new comment for a specific check-in
router.post("/comments", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { checkInId, comment } = req.body;

    // Validate comment
    if (!comment || comment.trim() === "") {
      return res.status(400).json({ error: "Comment is required" });
    }

    const result = await checkInFunctions.insertCheckInComment(
      checkInId,
      userId,
      comment.trim()
    );
    res.status(200).json(result);
  } catch (error) {
    console.error("Error inserting check-in comment:", error);
    res.status(500).json({ error: "Failed to insert check-in comment" });
  }
});

// Create or update check-in with optional photo upload
router.post("/", uploadPhotos.array("images", 20), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id, date, cheats, comments, training } = req.body;

    // Get uploaded files info from S3
    const uploadedFiles = req.files || [];
    const uploadedFileKeys = uploadedFiles.map((file) => file.key);

    // async function getPose(filename) {
    //   const blob = await getFileAsBlob(process.env.CHECKIN_BUCKET, filename);
    //   const result = await poseAnalysis.analyzePose({
    //     fileBuffer: blob.buffer,
    //     filename,
    //     mimetype: blob.mimetype,
    //     isTraining: 0,
    //     userId,
    //   });
    //   return result;
    // }

    // const analysisResults = await Promise.all(
    //   uploadedFileKeys.map((filename) => getPose(filename))
    // );

    // Create/update the check-in with the uploaded file names
    const result = await checkInFunctions.editCheckIn(userId, {
      id,
      date,
      cheats,
      comments,
      training,
      attachments: uploadedFileKeys.map((filename) => ({
        s3Filename: filename,
        poseId: null,
        // poseId:
        //   analysisResults.find((res) => res.filename === filename)?.prediction
        //     ?.predicted_class_id || null,
      })),
    });

    // add comment
    await checkInFunctions.insertCheckInComment(
      result.id,
      userId,
      id ? "Updated check-in" : "Original submission"
    );

    res.status(200).json({
      ...result,
      uploadedFiles: uploadedFileKeys,
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

// Assign pose ID to a specific attachment
router.post("/attachments/:id/pose", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const attachmentId = req.params.id;
    const { poseId } = req.body;

    // Validate poseId
    if (poseId === undefined || poseId === null) {
      return res.status(400).json({ error: "poseId is required" });
    }

    const result = await checkInFunctions.assignPose(
      userId,
      attachmentId,
      poseId
    );
    res.status(200).json(result);
  } catch (error) {
    console.error("Error assigning pose ID:", error);
    if (error.message === "Attachment not found or unauthorized") {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to assign pose ID" });
    }
  }
});

// Send PDF to coach via email
router.post("/send", localStorage.single("file"), async (req, res) => {
  try {
    const { checkInId, date } = req.body;
    const userId = req.auth.userId;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    // Send email with attachment
    await sendEmail(
      // "johngaynordev@gmail.com",
      "wbeuliss@gmail.com",
      "",
      "",
      `Gaynor Check-In - ${date}`,
      "",
      req.file.path,
      req.file.originalname
    );

    // Clean up temporary file
    const fs = require("fs");
    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupError) {
      console.error("Error cleaning up temp file:", cleanupError);
    }

    // Add comment to check-in
    if (checkInId && userId) {
      await checkInFunctions.insertCheckInComment(
        checkInId,
        userId,
        "Sent PDF to coach"
      );
    }

    res.status(200).json("success");
  } catch (error) {
    console.error("Error sending file to coach:", error);

    // Clean up temp file in case of error
    if (req.file) {
      const fs = require("fs");
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error("Error cleaning up temp file:", cleanupError);
      }
    }

    res.status(400).json({ error });
  }
});

module.exports = router;
