const router = require("express").Router();
const poseFunctions = require(".../../../models/ai/physique/poses");

router.get("/", async (req, res) => {
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

module.exports = router;
