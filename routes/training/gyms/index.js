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
    const { id, name, address } = req.body;
    const userId = req.auth.userId;

    if (!name) {
      return res.status(400).json({ error: "Gym name is required" });
    }

    if (!address) {
      return res.status(400).json({ error: "Gym address is required" });
    }

    const result = await gymFunctions.editGym({ id, name, address, userId });
    res.status(200).json({
      message: id ? "Gym updated successfully" : "Gym created successfully",
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

module.exports = router;
