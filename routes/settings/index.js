const router = require("express").Router();
const canAccess = require("../../models/middleware/canAccess");
const settingsFunctions = require("../../models/settings");

router.post("/dashboard", canAccess([43]), async (req, res) => {
  try {
    const { key, value } = req.body;
    const userId = req.auth.userId;

    if (!userId || !key || value === undefined)
      throw new Error("Missing parameters of key or value.");

    const mappings = {
      dashboardWaterToday: "waterToday",
      dashboardWaterAdd: "waterAdd",
      dashboardCaloriesToday: "caloriesToday",
      dashboardCaloriesAdd: "caloriesAdd",
      dashboardStepsToday: "stepsToday",
    };

    const column = mappings[key];

    if (!column) throw new Error("Invalid setting key");

    const result = await settingsFunctions.editDashboardSetting(
      userId,
      column,
      value
    );

    res.status(200).json(result);
  } catch (error) {
    res.routeError("/settings/dashboard", error);
  }
});

module.exports = router;
