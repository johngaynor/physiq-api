const mysqlPromise = require("../../../config/database");

const logFunctions = {
  async getDailyLogs(userId) {
    return new Promise(async function (resolve, reject) {
      try {
        const pool = await mysqlPromise;
        const [result] = await pool.query(
          `
        select 
            log.date, 
            log.weight,
            log.steps,
            slp.totalSleep,
            slp.totalBed,
            slp.awakeQty,
            slp.lightQty,
            slp.deepQty,
            slp.remQty
        from weightLogs log 
        left join apiUsers api 
            on api.id = log.userId 
        left join sleepLogs slp
          on slp.date = log.date and slp.userId = log.userId
        where api.clerkId = ?
        `,
          [userId]
        );
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  },
  async editDailyWeight(userId, values) {
    return new Promise(async function (resolve, reject) {
      try {
        const { date, weight } = values;
        const pool = await mysqlPromise;
        await pool.query(
          `
          update weightLogs
          set weight = ?
          where date = ?
            and userId = (
              select id from apiUsers where clerkId = ?
            )
          `,
          [weight, date, userId]
        );
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },
  async editDailySteps(userId, values) {
    return new Promise(async function (resolve, reject) {
      try {
        const { date, steps } = values;
        const pool = await mysqlPromise;
        await pool.query(
          `
          update weightLogs
          set steps = ?
          where date = ?
            and userId = (
              select id from apiUsers where clerkId = ?
            )
          `,
          [steps, date, userId]
        );
      } catch (error) {
        reject(error);
      }
    });
  },
  async editDailySleep(userId, values) {
    return new Promise(async function (resolve, reject) {
      try {
        const {
          date,
          totalBed,
          totalSleep,
          awakeQty,
          lightQty,
          deepQty,
          remQty,
        } = values;
        const pool = await mysqlPromise;
        await pool.query(
          `
          update sleepLogs
          set totalBed = ?,
            totalSleep = ?,
            awakeQty = ?,
            lightQty = ?,
            remQty = ?,
            deepQty = ?
          where date = ?
            and userId = (
              select id from apiUsers where clerkId = ?
            )
          `,
          [
            totalBed,
            totalSleep,
            awakeQty,
            lightQty,
            remQty,
            deepQty,
            date,
            userId,
          ]
        );
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },
};

module.exports = logFunctions;
