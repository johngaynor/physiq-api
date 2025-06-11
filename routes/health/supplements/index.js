const router = require("express").Router();
const supplementFunctions = require("../../../models/health/supplements");

router.get("/", async (req, res) => {
  const result = await supplementFunctions.getSupplements();
  res.status(200).json(result);
});

router.get("/logs", async (req, res) => {
  const userId = req.auth.userId;
  const result = await supplementFunctions.getSupplementLogs(userId);
  res.status(200).json(result);
});

module.exports = router;
