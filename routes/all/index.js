const router = require("express").Router();
const allFunctions = require("../../models/all");

router.get("/apps", async (req, res) => {
  const result = await allFunctions.getApps();
  res.status(200).json(result);
});

router.post("/session", async (req, res) => {
  const { id, email, name } = req.body;
  try {
    // authenticate user
    const existed = await allFunctions.upsertUser(id, email, name);

    // get apps for user
    const apps = await allFunctions.getApps(id);
    res.status(200).json({ user: { id, email, name }, existed, apps });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
