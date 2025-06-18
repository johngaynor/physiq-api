const mysqlPool = require("../../../config/database");

const supplementFunctions = {
  async getSupplements() {
    return new Promise(async function (resolve, reject) {
      try {
        const pool = await mysqlPool;
        const [result] = await pool.query(
          `
          SELECT
            id,
            name,
            description,
            dosage,
            priority
          FROM supplementItems
          WHERE active = 1
          order by priority DESC
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
        const pool = await mysqlPool;
        const [result] = await pool.query(
          `
          SELECT
            supplementId,
            date,
            completed,
            reason
          FROM supplementLogs
          WHERE userId = (select id from apiUsers where clerkId = ?)
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
        const pool = await mysqlPool;
        if (checked) {
          // insert
          await pool.query(
            `
            INSERT INTO supplementLogs (userId, date, supplementId, completed)
            VALUES ((select id from apiUsers where clerkId = ?), ?, ?, ?)
            `,
            [userId, date, supplementId, 1]
          );
        } else {
          // delete
          await pool.query(
            `
            DELETE FROM supplementLogs
            WHERE userId = (select id from apiUsers where clerkId = ?)
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
