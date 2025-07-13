const router = require("express").Router();

// Include poses routes
router.use("/poses", require("./poses"));

module.exports = router;
