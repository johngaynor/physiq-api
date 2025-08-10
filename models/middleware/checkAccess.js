const db = require("../../config/database");

module.exports = async function check(userId, appId) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log("checkAccess: checking userId:", userId, "appId:", appId);
      const [result] = await db.pool.query(
        `
                SELECT
                    app.id
                FROM apps app
                LEFT JOIN usersApps ua ON ua.appId = app.id
                WHERE (app.id = ? AND app.allUsers = 1) OR (ua.appId = ? AND ua.userId = ?)
                LIMIT 1
                `,
        [appId, appId, userId]
      );

      console.log("checkAccess: query result:", result);
      if (result.length > 0) {
        resolve(true);
      } else {
        resolve(false);
      }
    } catch (error) {
      console.log("checkAccess: error occurred:", error.message);
      console.log("checkAccess: full error:", error);
      reject(error);
    }
  });
};
