const db = require("../../config/database");

const settingsFunctions = {
  async editDashboardSettings(userId, settings) {
    return new Promise(async function (resolve, reject) {
      try {
        const { waterToday, waterAdd, caloriesToday, caloriesAdd, stepsToday } =
          settings;

        await db.pool.query(
          `
            UPDATE settingsDashboard 
            SET waterToday = ?, 
                waterAdd = ?, 
                caloriesToday = ?, 
                caloriesAdd = ?, 
                stepsToday = ?
            WHERE userId = ?
          `,
          [waterToday, waterAdd, caloriesToday, caloriesAdd, stepsToday, userId]
        );

        resolve("success");
      } catch (error) {
        reject(error);
      }
    });
  },
  async editEventSettings(userId, settings) {
    return new Promise(async function (resolve, reject) {
      try {
        const { type, name, date } = settings;

        await db.pool.query(
          `
            UPDATE settingsEvent 
            SET type = ?, 
                name = ?, 
                date = ?
            WHERE userId = ?
          `,
          [type, name, date, userId]
        );

        resolve("success");
      } catch (error) {
        reject(error);
      }
    });
  },
};

module.exports = settingsFunctions;
