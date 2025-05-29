const router = require("express").Router();

router.use("/logs", require("./logs"));

module.exports = router;
