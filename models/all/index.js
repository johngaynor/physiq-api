const db = require("../../config/database");

const allFunctions = {
  async getApps() {
    return new Promise(async function (resolve, reject) {
      try {
        const [result] = await db.query(
          `
          SELECT
            id,
            name,
            description,
            link
          FROM apps
          `
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
        const [result] = await db.query(
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
