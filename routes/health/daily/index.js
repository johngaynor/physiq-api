const router = require("express").Router();
const canAccess = require("../../../models/middleware/canAccess");
const logFunctions = require("../../../models/health/daily");

router.get("/", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const result = await logFunctions.getDailyLogs(userId);
    res.status(200).json(result);
  } catch (error) {
    res.routeError("/health/daily", error);
  }
});

router.post("/weight", canAccess(15), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { weight, date } = req.body;

    await logFunctions.editDailyWeight(userId, { weight, date });
    res.status(200).json("Success");
  } catch (error) {
    res.routeError("/health/daily/weight", error);
  }
});

router.post("/steps", canAccess(14), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { steps, date } = req.body;

    await logFunctions.editDailySteps(userId, { steps, date });
    res.status(200).json("Success");
  } catch (error) {
    res.routeError("/health/daily/steps", error);
  }
});

router.post("/bodyfat", canAccess(19), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { bodyfat, date } = req.body;

    await logFunctions.editDailyBodyfat(userId, { bodyfat, date });
    res.status(200).json("Success");
  } catch (error) {
    res.routeError("/health/daily/bodyfat", error);
  }
});

router.post("/water", canAccess(17), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { water, date } = req.body;

    await logFunctions.editDailyWater(userId, { water, date });
    res.status(200).json("Success");
  } catch (error) {
    res.routeError("/health/daily/water", error);
  }
});

router.post("/calories", canAccess(18), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { calories, date } = req.body;

    await logFunctions.editDailyCalories(userId, { calories, date });
    res.status(200).json("Success");
  } catch (error) {
    res.routeError("/health/daily/calories", error);
  }
});

router.get("/sleep/oura/:date", canAccess(16), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const date = req.params.date;
    const result = await logFunctions.getDailySleepOura(userId, date);
    res.status(200).json(result);
  } catch (error) {
    res.routeError("/health/daily/sleep/oura/::", error);
  }
});
module.exports = router;
