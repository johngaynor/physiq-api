const router = require("express").Router();
const canAccess = require("../../models/middleware/canAccess");
const phaseFunctions = require("../../models/phases");

router.get("/", canAccess(44), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const result = await phaseFunctions.getPhases(userId);
    res.status(200).json(result);
  } catch (error) {
    res.routeError("/api/phases", error);
  }
});

router.post("/", canAccess(44), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const phaseData = req.body;

    if (!phaseData.name || !phaseData.startDate) {
      return res
        .status(400)
        .json({ error: "Name and start date are required" });
    }

    const result = await phaseFunctions.editPhase(userId, phaseData);
    res.status(200).json(result);
  } catch (error) {
    res.routeError("/api/phases", error);
  }
});

router.delete("/phase/:id", canAccess(44), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Phase ID is required" });
    }

    const result = await phaseFunctions.deletePhase(id, userId);
    res.status(200).json(result);
  } catch (error) {
    res.routeError("/api/phases/phase/::id", error, {
      notFound: error.message === "Phase not found or unauthorized",
    });
  }
});

module.exports = router;
