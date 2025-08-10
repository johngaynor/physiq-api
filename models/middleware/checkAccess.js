const db = require("../../config/database");

module.exports = async function check(userId, appId) {
  return new Promise(async (resolve, reject) => {
    try {
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

      if (result.length > 0) {
        resolve(true);
      } else {
        resolve(false);
      }
    } catch (error) {
      reject(error);
    }
  });
};
