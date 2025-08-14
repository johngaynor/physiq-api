const router = require("express").Router();
const canAccess = require("../../../models/middleware/canAccess");
const sessionFunctions = require("../../../models/training/sessions");

router.get("/", canAccess(38), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const result = await sessionFunctions.getSessions(userId);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error getting sessions:", error);
    res.status(500).json({ error: "Failed to get sessions" });
  }
});

router.delete("/session/:id", canAccess(38), async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.auth.userId;

    if (!id) {
      return res.status(400).json({ error: "Session ID is required" });
    }

    await sessionFunctions.deleteSession(userId, id);
    res.status(200).json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("Error deleting session:", error);
    if (error.message === "Session not found") {
      res.status(404).json({ error: "Session not found" });
    } else {
      res.status(500).json({ error: "Failed to delete session" });
    }
  }
});

router.post("/session", canAccess(38), async (req, res) => {
  try {
    const { id, name, comments, createdBy, type } = req.body;
    const userId = req.auth.userId;

    if (!name) {
      return res.status(400).json({ error: "Session name is required" });
    }

    const result = await sessionFunctions.editSession({
      id,
      userId,
      createdBy,
      name,
      comments,
      type,
    });

    res.status(200).json({
      message: id
        ? "Session updated successfully"
        : "Session created successfully",
      session: result,
    });
  } catch (error) {
    console.error("Error editing session:", error);
    if (error.message === "Session not found") {
      res.status(404).json({ error: "Session not found" });
    } else {
      res.status(500).json({ error: "Failed to edit session" });
    }
  }
});

module.exports = router;
