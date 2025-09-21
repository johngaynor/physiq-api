const router = require("express").Router();
const canAccess = require("../../models/middleware/canAccess");
const allFunctions = require("../../models/all");

router.get("/apps", canAccess(1), async (req, res) => {
  try {
    const result = await allFunctions.getApps();
    res.status(200).json(result);
  } catch (error) {
    res.routeError("/api/all/apps", error);
  }
});

router.get("/users", canAccess(1), async (req, res) => {
  try {
    const result = await allFunctions.getUsers();
    res.status(200).json(result);
  } catch (error) {
    res.routeError("/api/all/users", error);
  }
});

router.post("/session", async (req, res) => {
  try {
    const { id, email, name } = req.body;
    // authenticate user
    const existed = await allFunctions.upsertUser(id, email, name);

    // get apps for user
    const apps = await allFunctions.getUserAccess(id);
    const settings = await allFunctions.getUserSettings(id);
    res
      .status(200)
      .json({ user: { id, email, name, apps, settings }, existed });
  } catch (error) {
    res.routeError("/api/all/session", error);
  }
});

router.get("/app/access/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;
    const result = await allFunctions.getUserAccess(userId);
    res.status(200).json(result);
  } catch (error) {
    res.routeError("/api/all/app/access/::", error);
  }
});

router.post("/app/access", canAccess(1), async (req, res) => {
  try {
    const { userId, app, checked } = req.body;
    const result = await allFunctions.updateAppAccess(userId, app.id, checked);
    res.status(200).json({ success: result });
  } catch (error) {
    res.routeError("/api/all/app/access", error);
  }
});

router.post("/app/favorite", async (req, res) => {
  try {
    const { appId } = req.body;
    const userId = req.auth?.userId;

    if (!appId) throw new Error("App ID is required");

    const result = await allFunctions.toggleAppFavorite(userId, appId);
    res.status(200).json(result);
  } catch (error) {
    res.routeError("/api/all/app/favorite", error);
  }
});

module.exports = router;
