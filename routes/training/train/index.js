const router = require("express").Router();
const canAccess = require("../../../models/middleware/canAccess");
const trainFunctions = require("../../../models/training/train");

router.post("/sync", canAccess(38), async (req, res) => {
  const { records } = req.body;
  console.log(`Sent over ${records.length} records to sync`);
  res.status(200).json("success");
});

router.get("/sessions/all", canAccess(38), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const sessions = await trainFunctions.getSessions(userId);
    res.status(200).json(sessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
