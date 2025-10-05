const router = require("express").Router();
const canAccess = require("../../models/middleware/canAccess");
const settingsFunctions = require("../../models/settings");

router.post("/dashboard", canAccess([43]), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const settings = req.body;
    const result = await settingsFunctions.editDashboardSettings(
      userId,
      settings
    );

    res.status(200).json(result);
  } catch (error) {
    res.routeError("/settings/dashboard", error);
  }
});

module.exports = router;
