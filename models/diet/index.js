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
  async editDietLog(
    userId,
    {
      id,
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
      supplements,
    }
  ) {
    return new Promise(async function (resolve, reject) {
      try {
        let returnId = id;
        const currentTime = new Date();

        // update existing
        if (id) {
          // update main table
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
          // delete existing supplements
          await db.pool.query(
            `
              DELETE FROM dietLogsSupplements
              WHERE logId = ?
            `,
            [id]
          );
          // insert new supplements
          if (supplements && supplements.length > 0) {
            const supplementValues = supplements.map((supp) => [
              id,
              supp.supplementId,
              supp.dosage,
              supp.unit,
              supp.frequency,
            ]);
            await db.pool.query(
              `
                INSERT INTO dietLogsSupplements (logId, supplementId, dosage, unit, frequency)
                VALUES ?
              `,
              [supplementValues]
            );
          }
        } else {
          // insert
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

          const newId = result.insertId;

          // insert supplements
          if (supplements && supplements.length > 0) {
            const supplementValues = supplements.map((supp) => [
              newId,
              supp.supplementId,
              supp.dosage,
              supp.unit,
              supp.frequency,
            ]);
            await db.pool.query(
              `
                INSERT INTO dietLogsSupplements (logId, supplementId, dosage, unit, frequency)
                VALUES ?
              `,
              [supplementValues]
            );
          }

          returnId = newId;
        }

        // get created/updated log and corresponding supplements
        const [log] = await db.pool.query(
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
            WHERE id = ?
              AND userId = ?
          `,
          [returnId, userId]
        );
        const [newSupplements] = await db.pool.query(
          `
            SELECT
                supp.id,
                supp.supplementId,
                supp.dosage,
                supp.unit,
                supp.frequency,
                s.name as name,
                s.description as description
            FROM dietLogsSupplements supp
            LEFT JOIN supplements s ON s.id = supp.supplementId
            WHERE supp.logId = ?
          `,
          [returnId]
        );

        resolve({
          existing: !!id,
          log: { ...log[0], supplements: newSupplements },
        });
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
              unit,
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
