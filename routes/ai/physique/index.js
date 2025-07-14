const router = require("express").Router();

// Import poses routes
router.use("/poses", require("./poses"));

module.exports = router;
