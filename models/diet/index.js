const mysqlPromise = require("../../config/database");

const dietFunctions = {
  async getDietLogs(userId) {
    return new Promise(async function (resolve, reject) {
      try {
        const [dietLogs] = await mysqlPromise.query(
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
            WHERE userId = (select id from apiUsers where clerkId = ?)
        `,
          [userId]
        );

        const [supplements] = await mysqlPromise.query(
          `
            SELECT
                supp.id,
                supp.logId,
                supp.supplementId,
                supp.dosage,
                supp.frequency
            from dietLogsSupplements supp
            left join dietLogs log
                on log.id = supp.logId
            WHERE log.userId = (select id from apiUsers where clerkId = ?)
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
};

module.exports = dietFunctions;
