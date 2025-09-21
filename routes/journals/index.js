const router = require("express").Router();
const canAccess = require("../../models/middleware/canAccess");
const journalFunctions = require("../../models/journals");

router.get("/", canAccess([42]), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const journals = await journalFunctions.getJournals(userId);
    res.status(200).json(journals);
  } catch (error) {
    res.routeError("/journals", error);
  }
});

router.post("/journal", canAccess([42]), async (req, res) => {
  try {
    const { id, title, content } = req.body;
    const userId = req.auth.userId;

    if (!id || !title || !content)
      throw new Error("ID, title, and content are required");

    // Convert content to JSON string if it's an object
    const contentToStore =
      typeof content === "object" ? JSON.stringify(content) : content;

    const result = await journalFunctions.editJournal({
      id,
      title,
      content: contentToStore,
      userId,
    });

    res.status(200).json(result);
  } catch (error) {
    res.routeError("/journals/journal", error, {
      validation: error.message === "ID is required",
    });
  }
});

router.delete("/journal/:id", canAccess([42]), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth.userId;

    if (!id) throw new Error("Journal ID is required");

    await journalFunctions.deleteJournal(id, userId);
    res.status(200).json({ message: "Journal deleted successfully" });
  } catch (error) {
    res.routeError("/journals/journal/::id", error);
  }
});

module.exports = router;
