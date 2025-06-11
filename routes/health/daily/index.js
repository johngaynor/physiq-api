const router = require("express").Router();
const logFunctions = require("../../../models/health/daily");

router.get("/", async (req, res) => {
  const userId = req.auth.userId;
  const result = await logFunctions.getDailyLogs(userId);
  res.status(200).json(result);
});

router.post("/weight", async (req, res) => {
  const userId = req.auth.userId;
  const { weight, date } = req.body;

  await logFunctions.editDailyWeight(userId, { weight, date });
  res.status(200).json("Success");
});

router.post("/steps", async (req, res) => {
  const userId = req.auth.userId;
  const { steps, date } = req.body;

  await logFunctions.editDailySteps(userId, { steps, date });
  res.status(200).json("Success");
});

router.post("/bodyfat", async (req, res) => {
  const userId = req.auth.userId;
  const { bodyfat, date } = req.body;

  await logFunctions.editDailyBodyfat(userId, { bodyfat, date });
  res.status(200).json("Success");
});

router.post("/water", async (req, res) => {
  const userId = req.auth.userId;
  const { water, date } = req.body;

  await logFunctions.editDailyWater(userId, { water, date });
  res.status(200).json("Success");
});

router.post("/calories", async (req, res) => {
  const userId = req.auth.userId;
  const { calories, date } = req.body;

  await logFunctions.editDailyCalories(userId, { calories, date });
  res.status(200).json("Success");
});

router.get("/sleep/oura/:date", async (req, res) => {
  const userId = req.auth.userId;
  const date = req.params.date;
  const result = await logFunctions.getDailySleepOura(userId, date);
  res.status(200).json(result);
});
module.exports = router;
