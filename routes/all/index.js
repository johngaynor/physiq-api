const router = require("express").Router();
const allFunctions = require("../../models/all");

router.get("/apps", async (req, res) => {
  const result = await allFunctions.getApps();
  res.status(200).json(result);
});

router.post("/user", async (req, res) => {
  const { id, email, name } = req.body;
  try {
    const existed = await allFunctions.upsertUser(id, email, name);
    res.status(200).json({ id, email, name, existed });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
