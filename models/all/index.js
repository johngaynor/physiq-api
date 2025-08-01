const db = require("../../config/database");

const allFunctions = {
  async getApps() {
    return new Promise(async function (resolve, reject) {
      try {
        const [result] = await db.pool.query(
          `
          SELECT
            id,
            name,
            description,
            link,
            allUsers,
            restricted
          FROM apps
          `
        );
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  },
  async getUserAccess(userId) {
    return new Promise(async function (resolve, reject) {
      try {
        const [result] = await db.pool.query(
          `
          SELECT
            id,
            name,
            description,
            link,
            allUsers,
            restricted
          FROM apps
          WHERE allUsers = 1 or id in (
            SELECT appId FROM usersApps WHERE userId = ?)
          `,
          [userId]
        );
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  },
  async getUsers() {
    return new Promise(async function (resolve, reject) {
      try {
        const [result] = await db.pool.query(
          `
          SELECT
            id,
            email,
            name
          FROM users
          `
        );
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  },
  async upsertUser(id, email, name) {
    return new Promise(async function (resolve, reject) {
      try {
        const [rows] = await db.pool.query(
          "SELECT id FROM users WHERE id = ?",
          [id]
        );
        if (rows.length > 0) {
          resolve(true); // User existed
        } else {
          await db.pool.query(
            "INSERT INTO users (id, email, name) VALUES (?, ?, ?)",
            [id, email, name]
          );
          resolve(false); // User inserted
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  async updateAppAccess(userId, appId, checked) {
    return new Promise(async function (resolve, reject) {
      try {
        if (!userId || !appId) throw new Error("Missing userId or appId");
        if (checked === false) {
          // Remove access
          await db.pool.query(
            "DELETE FROM usersApps WHERE userId = ? AND appId = ?",
            [userId, appId]
          );
          resolve(true);
        } else {
          // Add access
          await db.pool.query(
            "INSERT INTO usersApps (userId, appId) VALUES (?, ?)",
            [userId, appId]
          );
          resolve(true);
        }
      } catch (error) {
        reject(error);
      }
    });
  },
};

module.exports = allFunctions;
