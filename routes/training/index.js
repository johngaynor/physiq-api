const router = require("express").Router();

router.use("/exercises", require("./exercises"));
router.use("/gyms", require("./gyms"));
router.use("/sessions", require("./sessions"));
router.use("/train", require("./train"));

module.exports = router;
