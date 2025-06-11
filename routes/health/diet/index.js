const router = require("express").Router();
const dietFunctions = require("../../../models/health/diet");

router.get("/", async (req, res) => {
  const userId = req.auth.userId;
  const result = await dietFunctions.getDietLogs(userId);
  res.status(200).json(result);
});

module.exports = router;
