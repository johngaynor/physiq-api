const db = require("../../../config/database");

const sleepFunctions = {
  async getSleepLogs(userId) {
    return new Promise(async function (resolve, reject) {
      try {
        // Get sleep logs
        const [sleepLogs] = await db.pool.query(
          `
          SELECT
            id,
            userId,
            date,
            CAST(totalSleep AS DOUBLE) AS totalSleep,
            recoveryIndex,
            readinessScore,
            CAST(awakeQty AS DOUBLE) AS awakeQty,
            CAST(remQty AS DOUBLE) AS remQty,
            CAST(lightQty AS DOUBLE) AS lightQty,
            CAST(deepQty AS DOUBLE) AS deepQty,
            CAST(totalBed AS DOUBLE) AS totalBed,
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

        // Get all tags for these logs
        const logIds = sleepLogs.map((log) => log.id);

        if (logIds.length === 0) {
          resolve([]);
          return;
        }

        const [tags] = await db.pool.query(
          `
          SELECT
            id,
            logId,
            tagId,
            tagTypeCode,
            startTime,
            endTime,
            comment,
            qty,
            customName
          FROM sleepLogsTags
          WHERE logId IN (${logIds.map(() => "?").join(",")})
          `,
          logIds
        );

        // Group tags by logId
        const tagsByLogId = {};
        tags.forEach((tag) => {
          if (!tagsByLogId[tag.logId]) {
            tagsByLogId[tag.logId] = [];
          }
          tagsByLogId[tag.logId].push({
            ...tag,
          });
        });

        // Add tags to each sleep log
        const sleepLogsWithTags = sleepLogs.map((log) => ({
          ...log,
          tags: tagsByLogId[log.id] || [],
        }));

        resolve(sleepLogsWithTags);
      } catch (error) {
        reject(error);
      }
    });
  },
};

module.exports = sleepFunctions;
