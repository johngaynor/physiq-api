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
};

module.exports = journalFunctions;
