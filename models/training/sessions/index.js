const db = require("../../../config/database");

const sessionFunctions = {
  async getSessions(userId) {
    return new Promise(async function (resolve, reject) {
      try {
        const [sessions] = await db.pool.query(
          `
            SELECT
                id,
                userId,
                createdBy,
                name,
                comments
            FROM sessions
            WHERE userId = ?
            ORDER BY id DESC
          `,
          [userId]
        );

        resolve(sessions);
      } catch (error) {
        reject(error);
      }
    });
  },

  async deleteSession(userId, sessionId) {
    return new Promise(async function (resolve, reject) {
      try {
        const [result] = await db.pool.query(
          `
            DELETE FROM sessions
            WHERE id = ? AND userId = ?
          `,
          [sessionId, userId]
        );

        if (result.affectedRows === 0) {
          reject(new Error("Session not found"));
          return;
        }

        resolve("Success");
      } catch (error) {
        reject(error);
      }
    });
  },

  async editSession({ id, userId, createdBy, name, comments }) {
    return new Promise(async function (resolve, reject) {
      try {
        let returnId = id;

        if (id) {
          // Update existing session
          const [result] = await db.pool.query(
            `
              UPDATE sessions
              SET name = ?, comments = ?, createdBy = ?
              WHERE id = ? AND userId = ?
            `,
            [name, comments, createdBy, id, userId]
          );

          if (result.affectedRows === 0) {
            reject(new Error("Session not found"));
            return;
          }
        } else {
          // Insert new session
          const [result] = await db.pool.query(
            `
              INSERT INTO sessions (userId, createdBy, name, comments)
              VALUES (?, ?, ?, ?)
            `,
            [userId, createdBy, name, comments]
          );

          returnId = result.insertId;
        }

        resolve({ id: returnId });
      } catch (error) {
        reject(error);
      }
    });
  },
};

module.exports = sessionFunctions;
