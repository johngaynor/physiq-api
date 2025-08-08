const db = require("../../../config/database");

const sleepFunctions = {
  async getSleepLogs(userId) {
    return new Promise(async function (resolve, reject) {
      try {
        const [result] = await db.pool.query(
          `
          SELECT
            id,
            userId,
            date,
            totalSleep,
            recoveryIndex,
            readinessScore,
            awakeQty,
            remQty,
            lightQty,
            deepQty,
            totalBed,
            bedtimeStart,
            bedtimeEnd,
            efficiency,
            sleepScore,
            timingScore,
            restfulnessScore,
            latency
          FROM sleepLogs
          WHERE userId = ?
          ORDER BY date DESC
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

module.exports = sleepFunctions;
