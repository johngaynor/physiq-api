const router = require("express").Router();
const canAccess = require("../../../models/middleware/canAccess");
const exerciseFunctions = require("../../../models/training/exercises");

router.get("/", canAccess(38), async (req, res) => {
  const result = await exerciseFunctions.getExercises();
  res.status(200).json(result);
});

module.exports = router;
