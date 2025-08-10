const router = require("express").Router();
const canAccess = require("../../models/middleware/canAccess");
const allFunctions = require("../../models/all");

router.get("/apps", canAccess(1), async (req, res) => {
  const result = await allFunctions.getApps();
  res.status(200).json(result);
});

router.get("/users", canAccess(1), async (req, res) => {
  const result = await allFunctions.getUsers();
  res.status(200).json(result);
});

router.post("/session", async (req, res) => {
  const { id, email, name } = req.body;
  // authenticate user
  const existed = await allFunctions.upsertUser(id, email, name);

  // get apps for user
  const apps = await allFunctions.getUserAccess(id);
  res.status(200).json({ user: { id, email, name, apps }, existed });
});

router.get("/app/access/:userId", async (req, res) => {
  const userId = req.params.userId;
  const result = await allFunctions.getUserAccess(userId);
  res.status(200).json(result);
});

router.post("/app/access", canAccess(1), async (req, res) => {
  const { userId, app, checked } = req.body;
  const result = await allFunctions.updateAppAccess(userId, app.id, checked);
  res.status(200).json({ success: result });
});

module.exports = router;
