const router = require("express").Router();
const sleepFunctions = require("../../../models/health/sleep");

router.get("/logs", async (req, res) => {
  const userId = req.auth.userId;
  const result = await sleepFunctions.getSleepLogs(userId);
  res.status(200).json(result);
});

module.exports = router;
