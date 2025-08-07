const router = require("express").Router();

router.use("/daily", require("./daily"));
router.use("/supplements", require("./supplements"));

module.exports = router;
