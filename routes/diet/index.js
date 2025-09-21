const router = require("express").Router();
const canAccess = require("../../models/middleware/canAccess");
const dietFunctions = require("../../models/diet");

router.get("/logs", canAccess(21), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const result = await dietFunctions.getDietLogs(userId);
    res.status(200).json(result);
  } catch (error) {
    res.routeError("/diet/logs", error);
  }
});

router.post("/log", canAccess(21), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const values = req.body;
    const result = await dietFunctions.editDietLog(userId, values);
    res.status(200).json(result);
  } catch (error) {
    res.routeError("/diet/log", error);
  }
});

router.get("/log/latest", canAccess(21), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const logs = await dietFunctions.getLatestDiet(userId);

    if (!logs.length) {
      res.status(200).json({ log: {}, supplements: [] });
      return;
    }

    const log = logs[0];

    const supplements = await dietFunctions.getLatestDietSupplements(log.id);

    res.status(200).json({ log, supplements });
  } catch (error) {
    res.routeError("/diet/log/latest", error);
  }
});

router.delete("/log/:id", canAccess(21), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const logId = req.params.id;
    const result = await dietFunctions.deleteDietLog(userId, logId);
    res.status(200).json(result);
  } catch (error) {
    res.routeError("/diet/log/::", error);
  }
});

module.exports = router;
