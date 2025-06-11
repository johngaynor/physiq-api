const router = require("express").Router();

router.use("/daily", require("./daily"));
router.use("/diet", require("./diet"));
router.use("/supplements", require("./supplements"));

module.exports = router;
