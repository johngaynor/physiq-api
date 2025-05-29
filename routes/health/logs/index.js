const router = require("express").Router();
const logFunctions = require("../../../models/health/logs");

router.get("/daily", async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await logFunctions.getDailyLogs(userId);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.post("/daily/weight", async (req, res) => {
  try {
    const userId = req.user.id;
    const { weight } = req.body;
    await logFunctions.editDailyWeight(userId, weight);
    res.status(200).json("Success");
  } catch (error) {
    res.status(400).json({ error });
  }
});

// used to manually edit sleep... don't need if using oura
router.post("/daily/steps", async (req, res) => {
  try {
    const userId = req.user.id;
    const { steps } = req.body;
    await logFunctions.editDailySteps(userId, steps);
    res.status(200).json("Success");
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.post("/daily/sleep", async (req, res) => {
  try {
    const userId = req.user.id;
    const { sleep } = req.body;
    await logFunctions.editDailySleep(userId, sleep);
    res.status(200).json("Success");
  } catch (error) {
    res.status(400).json({ error });
  }
});

module.exports = router;
