const db = require("../../config/database");

const journalFunctions = {
  async getJournals(userId) {
    return new Promise(async function (resolve, reject) {
      try {
        const [journals] = await db.pool.query(
          `
            SELECT
                id,
                userId,
                title,
                content,
                coachAccess,
                createdAt,
                lastUpdated
            FROM journals
            where userId = ?
          `,
          [userId]
        );

        resolve(journals);
      } catch (error) {
        reject(error);
      }
    });
  },

  async editJournal({ id, title, content, userId }) {
    return new Promise(async function (resolve, reject) {
      try {
        if (!id) {
          reject(new Error("ID is required"));
          return;
        }

        // Check if journal exists
        const [existingJournal] = await db.pool.query(
          `
            SELECT id FROM journals
            WHERE id = ? AND userId = ?
          `,
          [id, userId]
        );

        if (existingJournal.length > 0) {
          // Update existing journal
          await db.pool.query(
            `
              UPDATE journals
              SET title = ?, content = ?
              WHERE id = ? AND userId = ?
            `,
            [title, content, id, userId]
          );
        } else {
          // Insert new journal with provided ID
          await db.pool.query(
            `
              INSERT INTO journals (id, userId, title, content)
              VALUES (?, ?, ?, ?)
            `,
            [id, userId, title, content]
          );
        }

        // Select and return the complete journal object
        const [journal] = await db.pool.query(
          `
            SELECT
                id,
                userId,
                title,
                content,
                coachAccess,
                createdAt,
                lastUpdated
            FROM journals
            WHERE id = ? AND userId = ?
          `,
          [id, userId]
        );

        resolve(journal[0]);
      } catch (error) {
        reject(error);
      }
    });
  },
};

module.exports = journalFunctions;
