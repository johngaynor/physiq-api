const router = require("express").Router();

router.use("/logs", require("./logs"));
router.use("/supplements", require("./supplements"));

module.exports = router;
