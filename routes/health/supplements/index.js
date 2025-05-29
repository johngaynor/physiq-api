const router = require("express").Router();
const supplementFunctions = require("../../../models/health/supplements");

// this route will change to use the diet logs to determine which supplements the user is taking via the nutrition/diet logs
router.get("/", async (req, res) => {
  try {
    // const userId = req.user.id;
    // const result = await supplementFunctions.getSupplements(userId);
    const result = [
      {
        id: 0,
        name: "Creatine",
        dosage: "5g",
        description: "TEST DESCRIPTION",
      },
    ];
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/logs", async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await supplementFunctions.getSupplementLogs(userId);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error });
  }
});

module.exports = router;
