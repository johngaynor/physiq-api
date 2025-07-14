const router = require("express").Router();

// GET / - Simple route that doesn't do anything, will be used to get stats for training model
router.get("/", async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "AI physique poses endpoint",
    });
  } catch (error) {
    console.error("Error in AI physique poses:", error);
    res.status(500).json({
      error: "Error processing request",
    });
  }
});

module.exports = router;
