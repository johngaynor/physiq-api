const db = require("../../../config/database");
const config = require("../../../config");
const axios = require("axios");

const logFunctions = {
  async getDailyLogs(userId) {
    return new Promise(async function (resolve, reject) {
      try {
        const [result] = await db.pool.query(
          `
        SELECT 
            log.date,
            CAST(log.weight AS DOUBLE) AS weight,
            log.steps,
            CAST(slp.totalSleep AS DOUBLE) AS totalSleep,
            CAST(slp.totalBed AS DOUBLE) AS totalBed,
            CAST(slp.awakeQty AS DOUBLE) AS awakeQty,
            CAST(slp.lightQty AS DOUBLE) AS lightQty,
            CAST(slp.deepQty AS DOUBLE) AS deepQty,
            CAST(slp.remQty AS DOUBLE) AS remQty,
            CAST(log.bodyfat AS DOUBLE) AS bodyfat,
            log.water,
            log.calories,
            CASE 
              WHEN log.weight IS NOT NULL AND log.bodyfat IS NOT NULL 
              THEN CAST(log.weight AS DOUBLE) * (100 - CAST(log.bodyfat AS DOUBLE)) / 100
              ELSE NULL
            END AS ffm,
            dlog.calories as caloriesTarget,
            dlog.water as waterTarget,
            dlog.steps as stepsTarget
        FROM weightLogs log
        LEFT JOIN sleepLogs slp 
            ON slp.date = log.date AND slp.userId = log.userId
        LEFT JOIN users api 
            ON api.id = log.userId
        LEFT JOIN dietLogs dlog
          ON dlog.userId = log.userId
          AND dlog.effectiveDate = (
              SELECT MAX(effectiveDate)
              FROM dietLogs
              WHERE effectiveDate <= log.date AND userId = log.userId
          )
        WHERE api.id = ?
        UNION
        SELECT 
            slp.date,
            CAST(log.weight AS DOUBLE) AS weight,
            log.steps,
            CAST(slp.totalSleep AS DOUBLE) AS totalSleep,
            CAST(slp.totalBed AS DOUBLE) AS totalBed,
            CAST(slp.awakeQty AS DOUBLE) AS awakeQty,
            CAST(slp.lightQty AS DOUBLE) AS lightQty,
            CAST(slp.deepQty AS DOUBLE) AS deepQty,
            CAST(slp.remQty AS DOUBLE) AS remQty,
            CAST(log.bodyfat AS DOUBLE) AS bodyfat,
            log.water,
            log.calories,
            CASE 
                WHEN log.weight IS NOT NULL AND log.bodyfat IS NOT NULL 
                THEN CAST(log.weight AS DOUBLE) * (100 - CAST(log.bodyfat AS DOUBLE)) / 100
                ELSE NULL
            END AS ffm,
            dlog.calories as caloriesTarget,
            dlog.water as waterTarget,
            dlog.steps as stepsTarget
        FROM sleepLogs slp
        LEFT JOIN weightLogs log 
            ON log.date = slp.date AND log.userId = slp.userId
        LEFT JOIN users api 
            ON api.id = slp.userId
        LEFT JOIN dietLogs dlog
          ON dlog.userId = log.userId
          AND dlog.effectiveDate = (
              SELECT MAX(effectiveDate)
              FROM dietLogs
              WHERE effectiveDate <= log.date AND userId = log.userId
          )
        WHERE api.id = ?
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
        await db.pool.query(
          `
          INSERT INTO weightLogs (date, userId, weight)
          VALUES (?, ?, ?)
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
        await db.pool.query(
          `
          INSERT INTO weightLogs (date, userId, steps)
          VALUES (?, ?, ?)
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
        await db.pool.query(
          `
          INSERT INTO weightLogs (date, userId, bodyfat, bodyfatSource)
          VALUES (?, ?, ?, 1)
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
        await db.pool.query(
          `
          INSERT INTO weightLogs (date, userId, water)
          VALUES (?, ?, ?)
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
        await db.pool.query(
          `
          INSERT INTO weightLogs (date, userId, calories)
          VALUES (?, ?, ?)
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
        const [existing] = await db.pool.query(
          `
          select * from sleepLogs where userId = ? and date = ?
          `,
          [userId, date]
        );

        if (existing.length)
          throw new Error("Sleep data already exists for this date");

        const [keys] = await db.pool.query(
          `
        select * from usersIntegrations where userId = ? and type = 1
          `,
          [userId]
        );

        if (!keys.length) throw new Error("No Oura integration found");

        const result = await axios.post(
          "https://z5332lvhfgtx5w7a2kvfyudyzi0gayoo.lambda-url.us-east-2.on.aws/",
          {
            ouraKey: keys[0].value,
            lambdaKey: config.ouraIntegrationApiKey,
          }
        );

        const { sleep, tags } = result.data;

        // Insert the sleep data into sleepLogs table
        const [sleepResult] = await db.pool.query(
          `
            INSERT INTO sleepLogs (userId, date, totalSleep, recoveryIndex, readinessScore, awakeQty, remQty, lightQty, deepQty, totalBed, bedtimeStart, bedtimeEnd, efficiency, latency, sleepScore, timingScore, restfulnessScore) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
          `,
          [
            userId,
            date,
            sleep.totalSleep,
            sleep.recoveryIndex,
            sleep.readinessScore,
            sleep.awakeQty,
            sleep.remQty,
            sleep.lightQty,
            sleep.deepQty,
            sleep.totalBed,
            sleep.bedtimeStart,
            sleep.bedtimeEnd,
            sleep.efficiency,
            sleep.latency,
            sleep.sleepScore,
            sleep.timingScore,
            sleep.restfulnessScore,
          ]
        );

        const logId = sleepResult.insertId;

        // Insert tags if they exist... removing for now while I debug and get historical backfill
        // if (tags && tags.length > 0) {
        //   const values = tags.map((tag) => [
        //     tag.tagId,
        //     tag.tagTypeCode,
        //     tag.startTime,
        //     tag.endTime,
        //     tag.comment,
        //     tag.qty,
        //     tag.customName,
        //     userId,
        //   ]);
        //   // Bulk insert all tags
        //   await db.pool.query(
        //     `
        //       INSERT INTO sleepLogsTags (tagId, tagTypeCode, startTime, endTime, comment, qty, customName, userId) VALUES ?
        //     `,
        //     [values]
        //   );
        // }

        const newLog = await db.pool.query(
          "select * from sleepLogs where id = ?",
          [logId]
        );

        resolve(newLog);
      } catch (error) {
        reject(error);
      }
    });
  },
};

module.exports = logFunctions;
