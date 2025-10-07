const router = require("express").Router();

router.use("/daily", require("./daily"));
router.use("/sleep", require("./sleep"));

module.exports = router;
