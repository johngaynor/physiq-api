const router = require("express").Router();
const canAccess = require("../../../models/middleware/canAccess");
const exerciseFunctions = require("../../../models/training/exercises");

router.get("/", canAccess(38), async (req, res) => {
  try {
    const result = await exerciseFunctions.getExercises();
    res.status(200).json(result);
  } catch (error) {
    res.routeError("/training/exercises", error);
  }
});

router.delete("/exercise/:id", canAccess(38), async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) throw new Error("Exercise ID is required");

    await exerciseFunctions.deleteExercise(id);
    res.status(200).json({ message: "Exercise deleted successfully" });
  } catch (error) {
    res.routeError("/training/exercises/exercise/::", error);
  }
});

router.post("/exercise", canAccess(38), async (req, res) => {
  try {
    const { id, name, defaultPrimaryUnit, defaultSecondaryUnit, targets } =
      req.body;

    if (!name) throw new Error("Name is required");

    const result = await exerciseFunctions.editExercise({
      id,
      name,
      defaultPrimaryUnit: defaultPrimaryUnit || null,
      defaultSecondaryUnit: defaultSecondaryUnit || null,
      targets,
    });

    res.status(200).json(result);
  } catch (error) {
    res.routeError("/training/exercises/exercise", error);
  }
});

module.exports = router;
