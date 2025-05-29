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
  // will need to check on this logic to make sure this kind of structure works in mysql
  async editDailyWeight(userId, values) {
    return new Promise(async function (resolve, reject) {
      try {
        const { date, weight } = values;
        const pool = await mysqlPromise;
        await pool.query(
          `
          if exists (select 1 from weightLogs where date = ? and userId = (select id from apiUsers where clerkId = ?))
            begin
              update weightLogs
              set weight = ?
              where date = ?
                and userId = (
                  select id from apiUsers where clerkId = ?
                )
            end
          else 
            begin
              insert into weightLogs (date, userId, weight) values (?, (select id from apiUsers where clerkId = ?), ?)
          `,
          [date, userId, weight, date, userId, date, userId, weight]
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
          if exists (select 1 from weightLogs where date = ? and userId = (select id from apiUsers where clerkId = ?))
            begin
              update weightLogs
              set steps = ?
              where date = ?
                and userId = (
                  select id from apiUsers where clerkId = ?
                )
            end
          else 
            begin
              insert into weightLogs (date, userId, steps) values (?, (select id from apiUsers where clerkId = ?), ?)
          `,
          [date, userId, steps, date, userId, date, userId, steps]
        );
        resolve();
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
          if exists (select 1 from sleepLogs where date = ? and userId = (select id from apiUsers where clerkId = ?))
            begin
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
            end
          else
            begin
              insert into sleepLogs 
                (date, userId, totalBed, totalSleep, awakeQty, lightQty, remQty, deepQty)
              values
                (?, (select id from apiUsers where clerkId = ?), ?, ?, ?, ?, ?, ?)
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
            date,
            userId,
            totalBed,
            totalSleep,
            awakeQty,
            lightQty,
            remQty,
            deepQty,
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
