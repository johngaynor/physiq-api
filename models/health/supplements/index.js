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
};

module.exports = supplementFunctions;
