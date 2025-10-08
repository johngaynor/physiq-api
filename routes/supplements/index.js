const router = require("express").Router();
const canAccess = require("../../models/middleware/canAccess");
const supplementFunctions = require("../../models/supplements");

router.get("/", canAccess(29), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const result = await supplementFunctions.getSupplements(userId);
    res.status(200).json(result);
  } catch (error) {
    res.routeError("/supplements", error);
  }
});

router.post("/", canAccess(29), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const supplementData = req.body;

    if (!supplementData.name) {
      return res.status(400).json({ error: "Supplement name is required" });
    }

    const result = await supplementFunctions.editSupplement(
      userId,
      supplementData
    );
    res.status(200).json(result);
  } catch (error) {
    res.routeError("/supplements", error, {
      notFound: error.message === "Supplement not found",
      unauthorized: error.message === "Unauthorized to edit this supplement",
    });
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

router.get("/links/:supplementId", canAccess(29), async (req, res) => {
  try {
    const { supplementId } = req.params;
    const result = await supplementFunctions.getSupplementLinks(supplementId);
    res.status(200).json(result);
  } catch (error) {
    res.routeError("/supplements/links/::supplementId", error);
  }
});

router.post("/link", canAccess(29), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const linkData = req.body;

    if (!linkData.link) {
      return res.status(400).json({ error: "Link is required" });
    }

    if (!linkData.id && !linkData.supplementId) {
      return res
        .status(400)
        .json({ error: "Supplement ID is required for new links" });
    }

    const result = await supplementFunctions.editSupplementLink(
      userId,
      linkData
    );
    res.status(200).json(result);
  } catch (error) {
    res.routeError("/supplements/link", error, {
      notFound:
        error.message === "Link not found" ||
        error.message === "Supplement not found",
      unauthorized:
        error.message === "Unauthorized to edit this link" ||
        error.message === "Unauthorized to add link to this supplement",
    });
  }
});

router.delete("/link/:id", canAccess(29), async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Link ID is required" });
    }

    const result = await supplementFunctions.deleteSupplementLink(userId, id);
    res.status(200).json(result);
  } catch (error) {
    res.routeError("/supplements/link/::id", error, {
      notFound: error.message === "Link not found",
      unauthorized: error.message === "Unauthorized to delete this link",
    });
  }
});

module.exports = router;
