const router = require("express").Router();
const canAccess = require("../../../../models/middleware/canAccess");
const poseFunctions = require("../../../../models/ai/physique/poses");

router.get("/", canAccess(34), async (req, res) => {
  try {
    const userId = req.auth.userId;

    const result = await poseFunctions.getTrainingPhotos(userId);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in AI physique poses:", error);
    res.status(500).json({
      error: "Error processing request",
    });
  }
});

router.get("/model", canAccess(34), async (req, res) => {
  try {
    const result = await poseFunctions.getModelData();

    res.status(200).json(result);
  } catch (error) {
    console.error("Error in AI physique model calls:", error);
    res.status(500).json({
      error: "Error processing request",
    });
  }
});

module.exports = router;
