const router = require("express").Router();
const canAccess = require("../../../models/middleware/canAccess");
const sleepFunctions = require("../../../models/health/sleep");

router.get("/logs", canAccess(16), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const result = await sleepFunctions.getSleepLogs(userId);
    res.status(200).json(result);
  } catch (error) {
    res.routeError("/health/sleep/logs", error);
  }
});

// GETTING RID OF THIS FOR NOW WHILE I DEBUG THE SLEEP ISSUE
// router.post("/log", canAccess(16), async (req, res) => {
//   try {
//     const userId = req.auth.userId;
//     const result = await sleepFunctions.editSleepLog(userId, req.body);
//     res.status(200).json(result);
//   } catch (error) {
//     res.routeError("/health/sleep/log", error);
//   }
// });

module.exports = router;
