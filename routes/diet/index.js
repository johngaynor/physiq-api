const router = require("express").Router();
const dietFunctions = require("../../models/diet");

router.get("/logs", async (req, res) => {
  const userId = req.auth.userId;
  const result = await dietFunctions.getDietLogs(userId);
  res.status(200).json(result);
});

router.post("/log", async (req, res) => {
  const userId = req.auth.userId;
  const values = req.body;
  const result = await dietFunctions.editDietLog(userId, values);
  res.status(200).json(result);
});

router.delete("/log/:id", async (req, res) => {
  const userId = req.auth.userId;
  const logId = req.params.id;
  const result = await dietFunctions.deleteDietLog(userId, logId);
  res.status(200).json(result);
});

module.exports = router;
