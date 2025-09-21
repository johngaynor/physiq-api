const router = require("express").Router();
const checkInFunctions = require("../../models/checkins");
const poseAnalysis = require("../../models/physique/poses");
const { upload, getFileAsBlob } = require("../../config/awsConfig");
const { sendEmail } = require("../../config/mail");
const canAccess = require("../../models/middleware/canAccess");
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

router.get("/", canAccess(28), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const result = await checkInFunctions.getCheckIns(userId);
    res.status(200).json(result);
  } catch (error) {
    res.routeError("/checkins", error);
  }
});

router.get("/comments/:checkInId", canAccess(28), async (req, res) => {
  try {
    const { checkInId } = req.params;
    const result = await checkInFunctions.getCheckInComments(checkInId);
    res.status(200).json(result);
  } catch (error) {
    res.routeError("/checkins/comments/::", error);
  }
});

router.post("/comments", canAccess(28), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { checkInId, comment } = req.body;

    // Validate comment
    if (!comment || comment.trim() === "")
      throw new Error("Comment is required.");

    const result = await checkInFunctions.insertCheckInComment(
      checkInId,
      userId,
      comment.trim()
    );
    res.status(200).json(result);
  } catch (error) {
    res.routeError("/checkins/comments", error);
  }
});

router.post(
  "/",
  canAccess(28),
  uploadPhotos.array("images", 20),
  async (req, res) => {
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
      res.routeError("/checkins", error);
    }
  }
);

router.delete("/:id", canAccess(28), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const checkInId = req.params.id;

    const result = await checkInFunctions.deleteCheckIn(userId, checkInId);
    res.status(200).json(result);
  } catch (error) {
    res.routeError("/checkins/::", error);
  }
});

router.get("/attachments/:id", canAccess(28), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.params;

    const result = await checkInFunctions.getCheckInAttachments(userId, id);
    res.status(200).json(result);
  } catch (error) {
    res.routeError("/checkins/attachments/::", error);
  }
});

router.post("/attachments/:id/pose", canAccess(28), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const attachmentId = req.params.id;
    const { poseId } = req.body;

    // Validate poseId
    if (poseId === undefined || poseId === null)
      throw new Error("Pose ID is required");

    const result = await checkInFunctions.assignPose(
      userId,
      attachmentId,
      poseId
    );
    res.status(200).json(result);
  } catch (error) {
    res.routeError("/checkins/attachments/::/pose", error);
  }
});

router.post(
  "/send",
  canAccess(28),
  localStorage.single("file"),
  async (req, res) => {
    try {
      const { checkInId, date } = req.body;
      const userId = req.auth.userId;

      if (!req.file) throw new Error("No file provided");

      // get coach email
      const email = await checkInFunctions.getCoachEmail(userId);
      if (!email) throw new Error("Coach email not found");

      // Send email with attachment
      await sendEmail(
        email,
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
      // Clean up temp file in case of error
      if (req.file) {
        const fs = require("fs");
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.error("Error cleaning up temp file:", cleanupError);
        }
      }

      res.routeError("/checkins/send", error);
    }
  }
);

module.exports = router;
