const router = require("express").Router();
const logFunctions = require("../../../models/health/logs");

router.get("/daily", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const result = await logFunctions.getDailyLogs(userId);
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res.status(400).json({ error });
  }
});

router.post("/daily/weight", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { weight, date } = req.body;

    await logFunctions.editDailyWeight(userId, { weight, date });
    res.status(200).json("Success");
  } catch (error) {
    console.log(error);
    res.status(400).json({ error });
  }
});

router.post("/daily/steps", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { steps, date } = req.body;

    await logFunctions.editDailySteps(userId, { steps, date });
    res.status(200).json("Success");
  } catch (error) {
    console.log(error);
    res.status(400).json({ error });
  }
});

router.post("/daily/bodyfat", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { bodyfat, date } = req.body;

    await logFunctions.editDailyBodyfat(userId, { bodyfat, date });
    res.status(200).json("Success");
  } catch (error) {
    console.log(error);
    res.status(400).json({ error });
  }
});

router.post("/daily/water", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { water, date } = req.body;

    await logFunctions.editDailyWater(userId, { water, date });
    res.status(200).json("Success");
  } catch (error) {
    console.log(error);
    res.status(400).json({ error });
  }
});
module.exports = router;
