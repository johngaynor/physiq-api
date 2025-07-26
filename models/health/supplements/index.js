const db = require("../../../config/database");

const supplementFunctions = {
  async getSupplements() {
    return new Promise(async function (resolve, reject) {
      try {
        const [result] = await db.pool.query(
          `
          SELECT
            id,
            name,
            description
          FROM supplements
          WHERE active = 1
          order by id DESC
          `
        );
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  },
  async getSupplementLogs(userId) {
    return new Promise(async function (resolve, reject) {
      try {
        const [result] = await db.pool.query(
          `
          SELECT
            supplementId,
            date,
            completed,
            reason
          FROM supplementsLogs
          WHERE userId = ?
          `,
          [userId]
        );
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  },
  async toggleSupplementLog({ userId, date, supplementId, checked }) {
    return new Promise(async function (resolve, reject) {
      try {
        if (checked) {
          // insert
          await db.pool.query(
            `
            INSERT INTO supplementsLogs (userId, date, supplementId, completed)
            VALUES (?, ?, ?, ?)
            `,
            [userId, date, supplementId, 1]
          );
        } else {
          // delete
          await db.pool.query(
            `
            DELETE FROM supplementsLogs
            WHERE userId = ?
            AND date = ?
            AND supplementId = ?
            `,
            [userId, date, supplementId]
          );
        }

        resolve("success");
      } catch (error) {
        reject(error);
      }
    });
  },
};

module.exports = supplementFunctions;
