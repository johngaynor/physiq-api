const router = require("express").Router();
const canAccess = require("../../../models/middleware/canAccess");
const supplementFunctions = require("../../../models/health/supplements");

router.get("/", canAccess(29), async (req, res) => {
  try {
    const result = await supplementFunctions.getSupplements();
    res.status(200).json(result);
  } catch (error) {
    res.routeError("/health/supplements", error);
  }
});

router.get("/logs", canAccess(29), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const result = await supplementFunctions.getSupplementLogs(userId);
    res.status(200).json(result);
  } catch (error) {
    res.routeError("/health/supplements/logs", error);
  }
});

router.post("/logs", canAccess(29), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { date, supplementId, checked } = req.body;

    await supplementFunctions.toggleSupplementLog({
      userId,
      date,
      supplementId,
      checked,
    });
    res.status(200).json("Success");
  } catch (error) {
    res.routeError("/health/supplements/logs", error);
  }
});

router.get("/tags", canAccess(29), async (req, res) => {
  try {
    const result = await supplementFunctions.getSupplementTags();
    res.status(200).json(result);
  } catch (error) {
    res.routeError("/health/supplements/tags", error);
  }
});

router.post("/tag", canAccess(30), async (req, res) => {
  try {
    const { name } = req.body;
    const newTagId = await supplementFunctions.createSupplementTag(name);
    res.status(200).json({ success: true, id: newTagId });
  } catch (error) {
    res.routeError("/health/supplements/tag", error);
  }
});

router.delete("/tag", canAccess(30), async (req, res) => {
  try {
    const { id } = req.body;
    await supplementFunctions.deleteSupplementTag(id);
    res.status(200).json({ success: true });
  } catch (error) {
    res.routeError("/health/supplements/tag", error);
  }
});

router.post("/supplement/tag", canAccess(30), async (req, res) => {
  try {
    const { supplementId, tagId } = req.body;
    await supplementFunctions.assignSupplementTag(supplementId, tagId);
    res.status(200).json({ success: true });
  } catch (error) {
    res.routeError("/health/supplements/supplement/tag", error);
  }
});

router.delete("/supplement/tag", canAccess(30), async (req, res) => {
  try {
    const { supplementId, tagId } = req.body;
    await supplementFunctions.removeSupplementTag(supplementId, tagId);
    res.status(200).json({ success: true });
  } catch (error) {
    res.routeError("/health/supplements/supplement/tag", error);
  }
});

module.exports = router;
