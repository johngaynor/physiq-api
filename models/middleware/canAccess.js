const checkAccess = require("./checkAccess");

/**
 * @param {number | number[]} appIds
 */
module.exports = function canAccess(appIds) {
  return async function handler(req, res, next) {
    try {
      if (!req.auth || !req.auth.userId) {
        throw new Error("No authentication found");
      }

      const appsToCheck = typeof appIds === "number" ? [appIds] : appIds;
      const results = await Promise.all(
        appsToCheck.map((appId) => checkAccess(req.auth.userId, appId))
      );

      if (results.some((result) => result)) {
        next();
      } else {
        res
          .status(403)
          .json({ message: "You are not allowed to access this route." });
      }
    } catch (error) {
      res.status(400).json({
        message: `Error checking user privileges - ${error.message}`,
      });
    }
  };
};
