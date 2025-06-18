const mysqlPool = require("../../config/database");

const allFunctions = {
  async getApps() {
    return new Promise(async function (resolve, reject) {
      try {
        const pool = await mysqlPool;
        const [result] = await pool.query(
          `
          SELECT
            id,
            name,
            description,
            link
          FROM apps
          WHERE physiq = 1;
          `
        );
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  },
};

module.exports = allFunctions;
