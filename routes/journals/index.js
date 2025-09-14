const router = require("express").Router();
const canAccess = require("../../models/middleware/canAccess");
const journalFunctions = require("../../models/journals");

router.get("/", canAccess([42]), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const journals = await journalFunctions.getJournals(userId);
    res.status(200).json(journals);
  } catch (error) {
    console.error("Error getting journals:", error);
    res.status(500).json({
      error: "Error retrieving journals",
    });
  }
});

module.exports = router;
