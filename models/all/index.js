const db = require("../../config/database");

const allFunctions = {
  async getApps(userId) {
    return new Promise(async function (resolve, reject) {
      try {
        const [result] = await db.query(
          `
          SELECT
            apps.id,
            apps.name,
            description,
            link
          FROM apps
          left join usersApps 
            on apps.id = usersApps.appId and usersApps.userId = ?
          left join users
            on users.id = usersApps.userId
          where users.admin = 1
            or usersApps.id is not null
            or apps.allUsers = 1
          `,
          [userId]
        );
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  },
  async upsertUser(id, email, name) {
    // Check if user exists
    const [rows] = await db.query("SELECT id FROM users WHERE id = ?", [id]);
    if (rows.length > 0) {
      return true; // User existed
    } else {
      await db.query("INSERT INTO users (id, email, name) VALUES (?, ?, ?)", [
        id,
        email,
        name,
      ]);
      return false; // User inserted
    }
  },
};

module.exports = allFunctions;
