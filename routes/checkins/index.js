const router = require("express").Router();
const checkInFunctions = require("../../models/checkins");

router.get("/", async (req, res) => {
  const userId = req.auth.userId;
  const result = await checkInFunctions.getCheckIns(userId);
  res.status(200).json(result);
});
module.exports = router;
