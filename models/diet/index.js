const db = require("../../config/database");

const dietFunctions = {
  async getDietLogs(userId) {
    return new Promise(async function (resolve, reject) {
      try {
        const [result] = await db.pool.query(
          `
            SELECT
                id,
                cast(protein as double) as protein,
                cast(carbs as double) as carbs,
                cast(fat as double) as fat,
                cast(calories as double) as calories,
                effectiveDate,
                cardio,
                cardioMinutes, 
                notes,
                water, 
                steps
            FROM dietLogs
            WHERE userId = ?
        `,
          [userId]
        );
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  },
  async getDietLogsSupplements(userId) {
    return new Promise(async function (resolve, reject) {
      try {
        const [result] = await db.pool.query(
          `
            SELECT
              id,
              logId,
              supplementId,
              dosage,
              frequency
            FROM dietLogsSupplements
            WHERE logId IN (
              SELECT id FROM dietLogs WHERE userId = ?
            )
        `,
          [userId]
        );
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  },
  async editDietLog({ userId, id, dietLog }) {
    return new Promise(async function (resolve, reject) {
      try {
        const {
          protein,
          carbs,
          fat,
          calories,
          effectiveDate,
          cardio,
          cardioMinutes,
          notes,
          water,
          steps,
        } = dietLog;
        let resultId;
        const currentTime = new Date();

        if (id) {
          // Update existing log
          await db.pool.query(
            `
              UPDATE dietLogs
              SET
                protein = ?,
                carbs = ?,
                fat = ?,
                calories = ?,
                effectiveDate = ?,
                cardio = ?,
                cardioMinutes = ?,
                notes = ?,
                water = ?,
                steps = ?,
                recentSubmitTime = ?
              WHERE id = ?
              AND userId = ?
            `,
            [
              protein,
              carbs,
              fat,
              calories,
              effectiveDate,
              cardio,
              cardioMinutes,
              notes,
              water,
              steps,
              currentTime,
              id,
              userId,
            ]
          );
          resultId = id;
        } else {
          // Insert new log
          const [result] = await db.pool.query(
            `
              INSERT INTO dietLogs (
                userId,
                protein,
                carbs,
                fat,
                calories,
                effectiveDate,
                cardio,
                cardioMinutes,
                notes,
                water,
                steps,
                recentSubmitTime
              )
              VALUES (
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?
              )
            `,
            [
              userId,
              protein,
              carbs,
              fat,
              calories,
              effectiveDate,
              cardio,
              cardioMinutes,
              notes,
              water,
              steps,
              currentTime,
            ]
          );
          resultId = result.insertId;
        }

        resolve(resultId);
      } catch (error) {
        reject(error);
      }
    });
  },
  async editDietLogSupplements(logId, supplements) {
    return new Promise(async function (resolve, reject) {
      try {
        // Delete existing supplements for this log
        await db.pool.query(
          `
          DELETE FROM dietLogsSupplements
          WHERE logId = ?
          `,
          [logId]
        );

        // Insert new supplements if any exist
        if (supplements && supplements.length > 0) {
          const supplementValues = supplements.map((supp) => [
            logId,
            supp.supplementId,
            supp.dosage,
            supp.frequency,
          ]);
          await db.pool.query(
            `
            INSERT INTO dietLogsSupplements (logId, supplementId, dosage, frequency)
            VALUES ?
            `,
            [supplementValues]
          );
        }

        resolve("Success");
      } catch (error) {
        reject(error);
      }
    });
  },
  async deleteDietLog(userId, logId) {
    return new Promise(async function (resolve, reject) {
      try {
        await db.pool.query(
          `
            DELETE FROM dietLogs
            WHERE userId = ?
              and id = ?
        `,
          [userId, logId]
        );
        resolve("Success");
      } catch (error) {
        reject(error);
      }
    });
  },
  async getLatestDiet(userId) {
    return new Promise(async function (resolve, reject) {
      try {
        const [result] = await db.pool.query(
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
          where userId = ?
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
        const [result] = await db.pool.query(
          `
            select
              id,
              supplementId,
              dosage,
              frequency
          from dietLogsSupplements
          where logId = ?
          order by frequency asc
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
