const router = require("express").Router();
const canAccess = require("../../models/middleware/canAccess");
const supplementFunctions = require("../../models/supplements");

router.get("/", canAccess(29), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const supplements = await supplementFunctions.getSupplements(userId);
    const tags = await supplementFunctions.getSupplementTags();
    const supplementsTags = await supplementFunctions.getSupplementsTags();
    const supplementsLinks = await supplementFunctions.getSupplementsLinks();
    const supplementsIngredients =
      await supplementFunctions.getSupplementsIngredients();

    // Map supplements with their tags, links, and ingredients
    const supplementsWithTagsAndLinks = supplements.map((supplement) => {
      return {
        ...supplement,
        tags: supplementsTags
          .filter((st) => st.supplementId === supplement.id)
          .map((st) => {
            const tag = tags.find((t) => t.id === st.tagId);
            return { ...tag };
          }),
        links: supplementsLinks.filter(
          (link) => link.supplementId === supplement.id
        ),
        ingredients: supplementsIngredients.filter(
          (ingredient) => ingredient.parentId === supplement.id
        ),
      };
    });

    res.status(200).json(supplementsWithTagsAndLinks);
  } catch (error) {
    res.routeError("/supplements", error);
  }
});

router.post("/", canAccess(29), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id, supplement, tags, links, ingredients } = req.body;
    const supplementId = await supplementFunctions.editSupplement({
      userId,
      id,
      supplement,
    });

    // Handle other attributes
    await supplementFunctions.editSupplementTags(supplementId, tags);
    await supplementFunctions.editSupplementLinks(supplementId, links);
    await supplementFunctions.editSupplementIngredients(
      supplementId,
      ingredients
    );

    res.status(200).json(supplementId);
  } catch (error) {
    res.routeError("/supplements", error);
  }
});

router.delete("/", canAccess(29), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Supplement ID is required" });
    }

    const result = await supplementFunctions.deleteSupplement(userId, id);
    res.status(200).json(result);
  } catch (error) {
    res.routeError("/supplements", error);
  }
});

router.get("/tags", canAccess(29), async (req, res) => {
  try {
    const result = await supplementFunctions.getSupplementTags();
    res.status(200).json(result);
  } catch (error) {
    res.routeError("/supplements/tags", error);
  }
});

router.get("/logs", canAccess(29), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const result = await supplementFunctions.getSupplementLogs(userId);
    res.status(200).json(result);
  } catch (error) {
    res.routeError("/supplements/logs", error);
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
    res.routeError("/supplements/logs", error);
  }
});

module.exports = router;
