const router = require("express").Router();

// Import physique routes
router.use("/physique", require("./physique"));

module.exports = router;
