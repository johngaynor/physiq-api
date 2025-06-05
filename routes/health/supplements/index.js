const router = require("express").Router();
const supplementFunctions = require("../../../models/health/supplements");

router.get("/", async (req, res) => {
  try {
    const result = await supplementFunctions.getSupplements();
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(400).json({ error });
  }
});

router.get("/logs", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const result = await supplementFunctions.getSupplementLogs(userId);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error });
  }
});

module.exports = router;
