const router = require("express").Router();
const allFunctions = require("../../models/all");

router.get("/apps", async (req, res) => {
  const result = await allFunctions.getApps();
  res.status(200).json(result);
});

module.exports = router;
