const mysqlPromise = require("../../../config/database");

const supplementFunctions = {
  async getSupplements() {
    return new Promise(async function (resolve, reject) {
      try {
        const [result] = await mysqlPromise.query(
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
        const [result] = await mysqlPromise.query(
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
        const [existing] = await mysqlPromise.query(
          `
          select id from supplementLogs
          where userId = (select id from apiUsers where clerkId = ?)
          and date = ? and supplementId = ?
          `,
          [userId, date, supplementId]
        );

        if (existing.length) {
          // delete
          await mysqlPromise.query(
            `
            DELETE FROM supplementLogs
            WHERE id = ?
            `,
            [existing[0].id]
          );
        } else {
          // insert
          await mysqlPromise.query(
            `
            INSERT INTO supplementLogs (userId, date, supplementId, completed)
            VALUES ((select id from apiUsers where clerkId = ?), ?, ?, ?)
            `,
            [userId, date, supplementId, checked]
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
