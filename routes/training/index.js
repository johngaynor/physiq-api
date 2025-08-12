const router = require("express").Router();

router.use("/exercises", require("./exercises"));

module.exports = router;
