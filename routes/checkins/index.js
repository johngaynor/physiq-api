const router = require("express").Router();
const checkInFunctions = require("../../models/checkins");

router.get("/", async (req, res) => {
  const userId = req.auth.userId;
  const result = await checkInFunctions.getCheckIns(userId);
  res.status(200).json(result);
});

router.post("/", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const {
      id,
      date,
      hormones,
      phase,
      timeline,
      cheats,
      comments,
      training,
      avgTotalSleep,
      avgTotalBed,
      avgRecoveryIndex,
      avgRemQty,
      avgDeepQty,
      attachments,
    } = req.body;

    const result = await checkInFunctions.editCheckIn(userId, {
      id,
      date,
      hormones,
      phase,
      timeline,
      cheats,
      comments,
      training,
      avgTotalSleep,
      avgTotalBed,
      avgRecoveryIndex,
      avgRemQty,
      avgDeepQty,
      attachments,
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Error editing check-in:", error);
    res.status(500).json({ error: "Failed to edit check-in" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const userId = req.auth.userId;
    const checkInId = req.params.id;

    const result = await checkInFunctions.deleteCheckIn(userId, checkInId);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error deleting check-in:", error);
    if (error.message === "Check-in not found or unauthorized") {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Failed to delete check-in" });
    }
  }
});

module.exports = router;
