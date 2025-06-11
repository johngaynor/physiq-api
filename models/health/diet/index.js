const mysqlPromise = require("../../../config/database");

const dietFunctions = {
  async getLatestDiet(userId) {
    return new Promise(async function (resolve, reject) {
      try {
        const [result] = await mysqlPromise.query(
          `
          select
            id,
            protein,
            carbs
            fat,
            CAST(calories AS DOUBLE) AS calories,
            effectiveDate,
            cardio, 
            cardioMinutes,
            notes, 
            water, 
            steps
        from dietLogs
        where userId = (select id from apiUsers where clerkId = ?)
        order by effectiveDate desc
        limit 1;
          `,
          [userId]
        );
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  },
  async getLatestDietSupplements(logId) {
    return new Promise(async function (resolve, reject) {
      try {
        const [result] = await mysqlPromise.query(
          `
          select
            id,
            supplementId,
            dosage,
            frequency
        from dietLogsSupplements
        where logId = ?
        order by frequency desc
          `,
          [logId]
        );
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  },
};

module.exports = dietFunctions;
