const db = require("../../config/database");

const settingsFunctions = {
  async editDashboardSettings(userId, settings) {
    return new Promise(async function (resolve, reject) {
      try {
        const {
          dashboardWaterToday,
          dashboardWaterAdd,
          dashboardCaloriesToday,
          dashboardCaloriesAdd,
          dashboardStepsToday,
        } = settings;

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
          [
            dashboardWaterToday,
            dashboardWaterAdd,
            dashboardCaloriesToday,
            dashboardCaloriesAdd,
            dashboardStepsToday,
            userId,
          ]
        );

        resolve("success");
      } catch (error) {
        reject(error);
      }
    });
  },
};

module.exports = settingsFunctions;
