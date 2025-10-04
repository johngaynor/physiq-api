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
            a.id,
            a.name,
            a.description,
            a.link,
            a.allUsers,
            a.restricted,
            CASE WHEN uaf.id IS NOT NULL THEN 1 ELSE 0 END AS favorite
          FROM apps a
          LEFT JOIN usersAppsFavorites uaf ON a.id = uaf.appId AND uaf.userId = ?
          WHERE a.allUsers = 1 OR a.id IN (
            SELECT appId FROM usersApps WHERE userId = ?
          )
          `,
          [userId, userId]
        );
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  },
  async getUserSettings(userId) {
    return new Promise(async function (resolve, reject) {
      try {
        const [result] = await db.pool.query(
          `
          select
            d.stepsToday as dashboardStepsToday,
            d.caloriesToday as dashboardCaloriesToday,
            d.caloriesAdd as dashboardCaloriesAdd,
            d.waterToday as dashboardWaterToday,
            d.waterAdd as dashboardWaterAdd,
            e.type as eventType,
            e.name as eventName,
            e.date as eventDate
          from settingsDashboard d
          left join settingsEvent e on d.userId = e.userId
          where d.userId = ?
          `,
          [userId]
        );
        const settings = result[0] || {};
        resolve(settings);
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
          await db.pool.query(
            "INSERT INTO settingsDashboard (userId) VALUES (?)",
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

  async toggleAppFavorite(userId, appId) {
    return new Promise(async function (resolve, reject) {
      try {
        // Check if the app is currently favorited
        const [existing] = await db.pool.query(
          `
          SELECT id FROM usersAppsFavorites
          WHERE userId = ? AND appId = ?
          `,
          [userId, appId]
        );

        if (existing.length > 0) {
          // Remove from favorites
          await db.pool.query(
            `
            DELETE FROM usersAppsFavorites
            WHERE userId = ? AND appId = ?
            `,
            [userId, appId]
          );
          resolve({ isFavorite: false, message: "Removed from favorites" });
        } else {
          // Add to favorites
          await db.pool.query(
            `
            INSERT INTO usersAppsFavorites (userId, appId)
            VALUES (?, ?)
            `,
            [userId, appId]
          );
          resolve({ isFavorite: true, message: "Added to favorites" });
        }
      } catch (error) {
        reject(error);
      }
    });
  },
};

module.exports = allFunctions;
