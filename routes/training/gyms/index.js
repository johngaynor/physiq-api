const router = require("express").Router();
const canAccess = require("../../../models/middleware/canAccess");
const gymFunctions = require("../../../models/training/gyms");
const { upload } = require("../../../config/awsConfig");

// Create upload middleware for gym photos
const uploadPhotos = upload(process.env.GYM_PHOTOS_BUCKET);

router.get("/", canAccess(38), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const result = await gymFunctions.getGyms(userId);
    res.status(200).json(result);
  } catch (error) {
    res.routeError("/training/gyms", error);
  }
});

router.delete("/gym/:id", canAccess(38), async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) throw new Error("Gym ID is required");

    await gymFunctions.deleteGym(id);
    res.status(200).json({ message: "Gym deleted successfully" });
  } catch (error) {
    res.routeError("/training/gyms/gym/::", error);
  }
});

router.post("/gym", canAccess(38), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const result = await gymFunctions.editGym({
      ...req.body,
      userId: userId,
    });
    res.status(200).json(result);
  } catch (error) {
    res.routeError("/training/gyms/gym", error, {
      notFound: error.message === "Gym not found",
    });
  }
});

router.get("/photos/:id", canAccess(38), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await gymFunctions.getGymPhotos(id);
    res.status(200).json(result);
  } catch (error) {
    res.routeError("/training/gyms/photos/::", error, {
      notFound: error.message === "Gym not found",
    });
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

      if (!gymId) throw new Error("Gym ID is required");

      // Get uploaded files info from S3
      const uploadedFiles = req.files || [];

      if (uploadedFiles.length === 0) throw new Error("No files were uploaded");

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
      res.routeError("/training/gyms/photos", error);
    }
  }
);

router.delete("/photos/:id", canAccess(38), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.params;

    if (!id) throw new Error("Photo ID is required");

    const result = await gymFunctions.deleteGymPhoto(id, userId);

    res.status(200).json({
      message: "Photo deleted successfully",
      ...result,
    });
  } catch (error) {
    res.routeError("/training/gyms/photos/::", error);
  }
});

router.get("/reviews/:id", canAccess(38), async (req, res) => {
  try {
    const { id } = req.params;

    const result = await gymFunctions.getGymReviews(id);
    res.status(200).json(result);
  } catch (error) {
    res.routeError("/training/gyms/reviews/::id", error, {
      notFound: error.message === "Gym not found",
    });
  }
});

router.post("/review", canAccess(38), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id, gymId, rating, review } = req.body;

    // Validate required fields
    if (!rating || rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    if (!id && !gymId) {
      throw new Error("Gym ID is required for new reviews");
    }

    const result = await gymFunctions.upsertGymReview({
      id,
      gymId,
      userId,
      rating,
      review,
    });

    res.status(200).json(result);
  } catch (error) {
    res.routeError("/training/gyms/review", error);
  }
});

module.exports = router;
