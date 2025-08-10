const checkAccess = require("./checkAccess");

/**
 * @param {number | number[]} appIds
 */
module.exports = function canAccess(appIds) {
  console.log("canAccess middleware created for appIds:", appIds);
  return async function handler(req, res, next) {
    try {
      console.log("canAccess middleware executing...");
      console.log("checking access for", req.auth?.userId, appIds);

      if (!req.auth || !req.auth.userId) {
        console.log("No auth or userId found");
        throw new Error("No authentication found");
      }

      const appsToCheck = typeof appIds === "number" ? [appIds] : appIds;
      const results = await Promise.all(
        appsToCheck.map((appId) => checkAccess(req.auth.userId, appId))
      );

      console.log("Access check results:", results);

      if (results.some((result) => result)) {
        console.log("Access granted, calling next()");
        next();
      } else {
        console.log("Access denied");
        throw new Error(`You are not authorized to access this app`);
      }
    } catch (error) {
      console.log("Error in canAccess middleware:", error.message);
      res.status(403).json({
        message: `Error checking user privileges - ${error.message}`,
      });
    }
  };
};
