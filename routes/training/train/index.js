const router = require("express").Router();
const canAccess = require("../../../models/middleware/canAccess");

router.post("/sync", canAccess(38), async (req, res) => {
  const { records } = req.body;
  console.log(`Sent over ${records.length} records to sync`);
  res.status(200).json("success");
});

module.exports = router;
