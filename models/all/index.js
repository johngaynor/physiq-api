const mysqlPromise = require("../../config/database");

const allFunctions = {
  async getApps() {
    return new Promise(async function (resolve, reject) {
      try {
        const [result] = await mysqlPromise.query(
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
