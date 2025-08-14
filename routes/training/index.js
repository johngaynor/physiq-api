const router = require("express").Router();

router.use("/exercises", require("./exercises"));
router.use("/gyms", require("./gyms"));
router.use("/sessions", require("./sessions"));

module.exports = router;
