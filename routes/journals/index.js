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

router.post("/journal", canAccess([42]), async (req, res) => {
  try {
    const { id, title, content } = req.body;
    const userId = req.auth.userId;

    if (!id || !title || !content) {
      return res.status(400).json({
        error: "ID, title, and content are required",
      });
    }

    const result = await journalFunctions.editJournal({
      id,
      title,
      content,
      userId,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Error editing journal:", error);
    if (error.message === "ID is required") {
      res.status(400).json({ error: "ID is required" });
    } else {
      res.status(500).json({ error: "Failed to save journal" });
    }
  }
});

module.exports = router;
