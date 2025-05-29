const mysqlPromise = require("../../../config/database");

const supplementFunctions = {
  async getSupplementLogs(userId) {
    return new Promise(async function (resolve, reject) {
      try {
        const pool = await mysqlPromise;
        const [result] = await pool.query(
          `
          TEST
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
