const router = require("express").Router();
const canAccess = require("../../../models/middleware/canAccess");
const gymFunctions = require("../../../models/training/gyms");
const { upload } = require("../../../config/awsConfig");

// Create upload middleware for gym photos
const uploadPhotos = upload(process.env.GYM_PHOTOS_BUCKET);

router.get("/", canAccess(38), async (req, res) => {
  const result = await gymFunctions.getGyms();
  res.status(200).json(result);
});

router.delete("/gym/:id", canAccess(38), async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Gym ID is required" });
    }

    await gymFunctions.deleteGym(id);
    res.status(200).json({ message: "Gym deleted successfully" });
  } catch (error) {
    console.error("Error deleting gym:", error);
    if (error.message === "Gym not found") {
      res.status(404).json({ error: "Gym not found" });
    } else {
      res.status(500).json({ error: "Failed to delete gym" });
    }
  }
});

router.post("/gym", canAccess(38), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const result = await gymFunctions.editGym({
      ...req.body,
      createdBy: userId,
    });
    res.status(200).json({
      message: req.body.id
        ? "Gym updated successfully"
        : "Gym created successfully",
      gym: result,
    });
  } catch (error) {
    console.error("Error editing gym:", error);
    if (error.message === "Gym not found") {
      res.status(404).json({ error: "Gym not found" });
    } else {
      res.status(500).json({ error: "Failed to edit gym" });
    }
  }
});

router.get("/photos/:id", canAccess(38), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await gymFunctions.getGymPhotos(id);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error getting gym photos:", error);
    if (error.message === "Gym not found") {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to get gym photos" });
    }
  }
});

router.post(
  "/photos",
  canAccess(38),
  uploadPhotos.array("images", 20),
  async (req, res) => {
    try {
      const userId = req.auth.userId;
      const { gymId } = req.body;

      if (!gymId) {
        return res.status(400).json({ error: "Gym ID is required" });
      }

      // Get uploaded files info from S3
      const uploadedFiles = req.files || [];

      if (uploadedFiles.length === 0) {
        return res.status(400).json({ error: "No photos were uploaded" });
      }

      const uploadedFileKeys = uploadedFiles.map((file) => file.key);

      // Save the photo references to the database
      const result = await gymFunctions.uploadGymPhotos(
        gymId,
        userId,
        uploadedFileKeys
      );

      res.status(200).json({
        message: "Gym photos uploaded successfully",
        ...result,
      });
    } catch (error) {
      console.error("Error uploading gym photos:", error);
      if (error.message === "Gym not found") {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: "Failed to upload gym photos" });
      }
    }
  }
);

router.delete("/photos/:id", canAccess(38), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Photo ID is required" });
    }

    const result = await gymFunctions.deleteGymPhoto(id, userId);

    res.status(200).json({
      message: "Photo deleted successfully",
      ...result,
    });
  } catch (error) {
    console.error("Error deleting gym photo:", error);
    if (error.message === "Photo not found") {
      res.status(404).json({ error: error.message });
    } else if (error.message === "Unauthorized to delete this photo") {
      res.status(403).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to delete gym photo" });
    }
  }
});

router.get("/reviews/:id", canAccess(38), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await gymFunctions.getGymReviews(id);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error getting gym reviews:", error);
    if (error.message === "Gym not found") {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to get gym reviews" });
    }
  }
});

module.exports = router;
