const mysqlPromise = require("../../../config/database");

const dietFunctions = {
  async getDietLogs(userId) {
    return new Promise(async function (resolve, reject) {
      try {
        const [result] = await mysqlPromise.query(
          `
          select
            id,
            protein,
            carbs
            fat,
            calories,
            effectiveDate,
            cardio, 
            cardioMinutes,
            notes, 
            water, 
            steps
        from dietLogs
        where userId = (select id from apiUsers where clerkId = ?)
        order by effectiveDate desc
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

module.exports = dietFunctions;
