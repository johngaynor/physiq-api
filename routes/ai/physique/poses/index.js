const router = require("express").Router();
const canAccess = require("../../../../models/middleware/canAccess");
const poseFunctions = require("../../../../models/ai/physique/poses");

router.get("/", canAccess(34), async (req, res) => {
  try {
    const userId = req.auth.userId;

    const result = await poseFunctions.getTrainingPhotos(userId);
    res.status(200).json(result);
  } catch (error) {
    res.routeError("/api/ai/physique/poses", error);
  }
});

router.get("/model", canAccess(34), async (req, res) => {
  try {
    const result = await poseFunctions.getModelData();

    res.status(200).json(result);
  } catch (error) {
    res.routeError("/api/ai/physique/poses/model", error);
  }
});

module.exports = router;
