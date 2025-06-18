const router = require("express").Router();
const dietFunctions = require("../../models/diet");

router.get("/logs", async (req, res) => {
  const userId = req.auth.userId;
  const result = await dietFunctions.getDietLogs(userId);
  res.status(200).json(result);
});

module.exports = router;
