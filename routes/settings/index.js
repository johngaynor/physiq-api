const router = require("express").Router();
const canAccess = require("../../models/middleware/canAccess");
const settingsFunctions = require("../../models/settings");

router.post("/dashboard", canAccess([43]), async (req, res) => {
  try {
    const { key, value } = req.body;
    const userId = req.auth.userId;

    if (!userId || !key || value === undefined) {
      return res.status(400).json({
        error: "User ID, key, and value are required",
      });
    }

    const mappings = {
      dashboardWaterToday: "waterToday",
      dashboardWaterAdd: "waterAdd",
      dashboardCaloriesToday: "caloriesToday",
      dashboardCaloriesAdd: "caloriesAdd",
      dashboardStepsToday: "stepsToday",
    };

    const column = mappings[key];

    if (!column) {
      return res.status(400).json({
        error: "Invalid key provided",
      });
    }

    const result = await settingsFunctions.editDashboardSetting(
      userId,
      column,
      value
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("Error updating settings:", error);
    res.status(400).json({
      error: "Error updating settings",
    });
  }
});

module.exports = router;
