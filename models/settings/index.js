const db = require("../../config/database");

const settingsFunctions = {
  async editDashboardSetting(userId, column, value) {
    return new Promise(async function (resolve, reject) {
      try {
        await db.pool.query(
          `
            update settingsDashboard set ?? = ? where userId = ?
          `,
          [column, value, userId]
        );

        resolve("success");
      } catch (error) {
        reject(error);
      }
    });
  },
};

module.exports = settingsFunctions;
