const router = require("express").Router();
const canAccess = require("../../models/middleware/canAccess");
const supplementFunctions = require("../../models/supplements");

router.get("/", canAccess(29), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const result = await supplementFunctions.getSupplements(userId);
    res.status(200).json(result);
  } catch (error) {
    res.routeError("/supplements", error);
  }
});

router.get("/logs", canAccess(29), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const result = await supplementFunctions.getSupplementLogs(userId);
    res.status(200).json(result);
  } catch (error) {
    res.routeError("/supplements/logs", error);
  }
});

router.post("/logs", canAccess(29), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { date, supplementId, checked } = req.body;

    await supplementFunctions.toggleSupplementLog({
      userId,
      date,
      supplementId,
      checked,
    });
    res.status(200).json("Success");
  } catch (error) {
    res.routeError("/supplements/logs", error);
  }
});

module.exports = router;
