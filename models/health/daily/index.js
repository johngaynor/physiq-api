const mysqlPool = require("../../../config/database");
const config = require("../../../config");
const axios = require("axios");

const logFunctions = {
  async getDailyLogs(userId) {
    return new Promise(async function (resolve, reject) {
      try {
        const [result] = await mysqlPool.query(
          `
        SELECT 
            log.date,
            CAST(log.weight AS DOUBLE) AS weight,
            log.steps,
            slp.totalSleep,
            slp.totalBed,
            slp.awakeQty,
            slp.lightQty,
            slp.deepQty,
            slp.remQty,
            log.bodyfat,
            log.water,
            log.calories
        FROM weightLogs log
        LEFT JOIN sleepLogs slp 
            ON slp.date = log.date AND slp.userId = log.userId
        LEFT JOIN apiUsers api 
            ON api.id = log.userId
        WHERE api.clerkId = ?
        UNION
        SELECT 
            slp.date,
            CAST(log.weight AS DOUBLE) AS weight,
            log.steps,
            slp.totalSleep,
            slp.totalBed,
            slp.awakeQty,
            slp.lightQty,
            slp.deepQty,
            slp.remQty,
            log.bodyfat,
            log.water,
            log.calories
        FROM sleepLogs slp
        LEFT JOIN weightLogs log 
            ON log.date = slp.date AND log.userId = slp.userId
        LEFT JOIN apiUsers api 
            ON api.id = slp.userId
        WHERE api.clerkId = ?
          AND log.date IS NULL
        `,
          [userId, userId]
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
        await mysqlPool.query(
          `
          INSERT INTO weightLogs (date, userId, weight)
          VALUES (?, (select id from apiUsers where clerkId = ?), ?)
          ON DUPLICATE KEY UPDATE weight = VALUES(weight)
        `,
          [date, userId, weight]
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
        await mysqlPool.query(
          `
          INSERT INTO weightLogs (date, userId, steps)
          VALUES (?, (select id from apiUsers where clerkId = ?), ?)
          ON DUPLICATE KEY UPDATE steps = VALUES(steps)
        `,
          [date, userId, steps]
        );
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },
  async editDailyBodyfat(userId, values) {
    return new Promise(async function (resolve, reject) {
      try {
        const { date, bodyfat } = values;
        await mysqlPool.query(
          `
          INSERT INTO weightLogs (date, userId, bodyfat, bodyfatSource)
          VALUES (?, (select id from apiUsers where clerkId = ?), ?, 1)
          ON DUPLICATE KEY UPDATE bodyfat = VALUES(bodyfat), bodyfatSource = 1
        `,
          [date, userId, bodyfat]
        );
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },
  async editDailyWater(userId, values) {
    return new Promise(async function (resolve, reject) {
      try {
        const { date, water } = values;
        await mysqlPool.query(
          `
          INSERT INTO weightLogs (date, userId, water)
          VALUES (?, (select id from apiUsers where clerkId = ?), ?)
          ON DUPLICATE KEY UPDATE water = VALUES(water)
        `,
          [date, userId, water]
        );
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },
  async editDailyCalories(userId, values) {
    return new Promise(async function (resolve, reject) {
      try {
        const { date, calories } = values;
        await mysqlPool.query(
          `
          INSERT INTO weightLogs (date, userId, calories)
          VALUES (?, (select id from apiUsers where clerkId = ?), ?)
          ON DUPLICATE KEY UPDATE calories = VALUES(calories)
        `,
          [date, userId, calories]
        );
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },
  async getDailySleepOura(userId, date) {
    return new Promise(async function (resolve, reject) {
      try {
        const [existing] = await mysqlPool.query(
          `
          select * from sleepLogs where userId = (select id from apiUsers where clerkId = ?) and date = ?
          `,
          [userId, date]
        );

        if (!existing.length) {
          // get correct userId
          const [user] = await mysqlPool.query(
            `select id from apiUsers where clerkId = ?`,
            [userId]
          );

          const oldUserId = user[0].id;
          const result = await axios.post(
            "https://4apzgqqogvz2v5cduanzxtoyea0rupfx.lambda-url.us-east-2.on.aws/",
            {
              userId: oldUserId,
              date: date,
              lambdaKey: config.ouraIntegrationApiKey,
            }
          );

          resolve(result.data);
        } else resolve({});

        resolve("success");
      } catch (e) {
        reject({ message: e.response?.data?.error || "Internal Server Error" });
      }
    });
  },
};

module.exports = logFunctions;
