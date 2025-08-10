const router = require("express").Router();
const canAccess = require("../../../models/middleware/canAccess");
const sleepFunctions = require("../../../models/health/sleep");

router.get("/logs", canAccess(16), async (req, res) => {
  const userId = req.auth.userId;
  const result = await sleepFunctions.getSleepLogs(userId);
  res.status(200).json(result);
});

router.post("/log", canAccess(16), async (req, res) => {
  const userId = req.auth.userId;
  try {
    const result = await sleepFunctions.editSleepLog(userId, req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
