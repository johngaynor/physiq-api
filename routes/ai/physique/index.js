const router = require("express").Router();

router.use("/poses", require("./poses"));

module.exports = router;
