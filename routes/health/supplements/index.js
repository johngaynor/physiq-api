const router = require("express").Router();
const supplementFunctions = require("../../../models/health/supplements");

router.get("/", async (req, res) => {
  const result = await supplementFunctions.getSupplements();
  res.status(200).json(result);
});

router.get("/logs", async (req, res) => {
  const userId = req.auth.userId;
  const result = await supplementFunctions.getSupplementLogs(userId);
  res.status(200).json(result);
});

router.post("/logs", async (req, res) => {
  const userId = req.auth.userId;
  const { date, supplementId, checked } = req.body;

  await supplementFunctions.toggleSupplementLog({
    userId,
    date,
    supplementId,
    checked,
  });
  res.status(200).json("Success");
});

router.get("/tags", async (req, res) => {
  const result = await supplementFunctions.getSupplementTags();
  res.status(200).json(result);
});

router.post("/tag", async (req, res) => {
  const { name } = req.body;
  try {
    const newTagId = await supplementFunctions.createSupplementTag(name);
    res.status(200).json({ success: true, id: newTagId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/tag", async (req, res) => {
  const { id } = req.body;
  try {
    await supplementFunctions.deleteSupplementTag(id);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/supplement/tag", async (req, res) => {
  const { supplementId, tagId } = req.body;
  try {
    await supplementFunctions.assignSupplementTag(supplementId, tagId);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/supplement/tag", async (req, res) => {
  const { supplementId, tagId } = req.body;
  try {
    await supplementFunctions.removeSupplementTag(supplementId, tagId);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
