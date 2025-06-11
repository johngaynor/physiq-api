const router = require("express").Router();
const dietFunctions = require("../../../models/health/diet");

router.get("/log/latest", async (req, res) => {
  const userId = req.auth.userId;
  const logs = await dietFunctions.getLatestDiet(userId);

  if (!logs.length) {
    res.status(200).json({ log: {}, supplements: [] });
    return;
  }

  const log = logs[0];

  const supplements = await dietFunctions.getLatestDietSupplements(log.id);

  res.status(200).json({ log, supplements });
});

module.exports = router;
