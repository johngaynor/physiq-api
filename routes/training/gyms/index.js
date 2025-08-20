const router = require("express").Router();
const canAccess = require("../../../models/middleware/canAccess");
const gymFunctions = require("../../../models/training/gyms");

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

module.exports = router;
