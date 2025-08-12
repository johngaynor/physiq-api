const router = require("express").Router();
const canAccess = require("../../../models/middleware/canAccess");
const exerciseFunctions = require("../../../models/training/exercises");

router.get("/", canAccess(38), async (req, res) => {
  const result = await exerciseFunctions.getExercises();
  res.status(200).json(result);
});

router.delete("/exercise/:id", canAccess(38), async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Exercise ID is required" });
    }

    await exerciseFunctions.deleteExercise(id);
    res.status(200).json({ message: "Exercise deleted successfully" });
  } catch (error) {
    console.error("Error deleting exercise:", error);
    if (error.message === "Exercise not found") {
      res.status(404).json({ error: "Exercise not found" });
    } else {
      res.status(500).json({ error: "Failed to delete exercise" });
    }
  }
});

router.post("/exercise", canAccess(38), async (req, res) => {
  try {
    const { id, name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Exercise name is required" });
    }

    const result = await exerciseFunctions.editExercise({ id, name });
    res.status(200).json({
      message: id
        ? "Exercise updated successfully"
        : "Exercise created successfully",
      exercise: result,
    });
  } catch (error) {
    console.error("Error editing exercise:", error);
    if (error.message === "Exercise not found") {
      res.status(404).json({ error: "Exercise not found" });
    } else {
      res.status(500).json({ error: "Failed to edit exercise" });
    }
  }
});

module.exports = router;
