const db = require("../../config/database");

const dietFunctions = {
  async getDietLogs(userId) {
    return new Promise(async function (resolve, reject) {
      try {
        const [dietLogs] = await db.pool.query(
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
                steps,
                phase
            FROM dietLogs
            WHERE userId = ?
        `,
          [userId]
        );

        const [supplements] = await db.pool.query(
          `
            SELECT
                supp.id,
                supp.logId,
                supp.supplementId,
                supp.dosage,
                supp.frequency,
                s.name as name,
                s.description as description
            from dietLogsSupplements supp
            left join dietLogs log
                on log.id = supp.logId
            left join supplements s
                on s.id = supp.supplementId
            WHERE log.userId = ?
          `,
          [userId]
        );

        const logsWithSupplements = dietLogs.map((log) => {
          return {
            ...log,
            supplements: supplements
              .filter((supp) => supp.logId === log.id)
              .map((supp) => ({
                id: supp.id,
                supplementId: supp.supplementId,
                name: supp.name,
                description: supp.description,
                dosage: supp.dosage,
                frequency: supp.frequency,
              })),
          };
        });

        resolve(logsWithSupplements);
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
      phase,
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
                phase = ?,
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
              phase,
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
                phase,
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
              phase,
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
                steps,
                phase
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
};

module.exports = dietFunctions;
