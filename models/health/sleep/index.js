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
  async editSleepLog(
    userId,
    {
      id,
      date,
      totalSleep,
      recoveryIndex,
      readinessScore,
      awakeQty,
      remQty,
      lightQty,
      deepQty,
      totalBed,
      // bedtimeStart,
      // bedtimeEnd,
      efficiency,
      sleepScore,
      timingScore,
      restfulnessScore,
      latency,
    }
  ) {
    return new Promise(async function (resolve, reject) {
      try {
        let returnId = id;

        // Convert empty strings to null for numeric fields
        const cleanedData = {
          date,
          totalSleep: totalSleep === "" ? null : totalSleep,
          recoveryIndex: recoveryIndex === "" ? null : recoveryIndex,
          readinessScore: readinessScore === "" ? null : readinessScore,
          awakeQty: awakeQty === "" ? null : awakeQty,
          remQty: remQty === "" ? null : remQty,
          lightQty: lightQty === "" ? null : lightQty,
          deepQty: deepQty === "" ? null : deepQty,
          totalBed: totalBed === "" ? null : totalBed,
          efficiency: efficiency === "" ? null : efficiency,
          sleepScore: sleepScore === "" ? null : sleepScore,
          timingScore: timingScore === "" ? null : timingScore,
          restfulnessScore: restfulnessScore === "" ? null : restfulnessScore,
          latency: latency === "" ? null : latency,
        };

        // update existing
        if (id) {
          // update main table
          await db.pool.query(
            `
              UPDATE sleepLogs
              SET
                date = ?,
                totalSleep = ?,
                recoveryIndex = ?,
                readinessScore = ?,
                awakeQty = ?,
                remQty = ?,
                lightQty = ?,
                deepQty = ?,
                totalBed = ?,
                efficiency = ?,
                sleepScore = ?,
                timingScore = ?,
                restfulnessScore = ?,
                latency = ?
              WHERE id = ?
              AND userId = ?
            `,
            [
              cleanedData.date,
              cleanedData.totalSleep,
              cleanedData.recoveryIndex,
              cleanedData.readinessScore,
              cleanedData.awakeQty,
              cleanedData.remQty,
              cleanedData.lightQty,
              cleanedData.deepQty,
              cleanedData.totalBed,
              cleanedData.efficiency,
              cleanedData.sleepScore,
              cleanedData.timingScore,
              cleanedData.restfulnessScore,
              cleanedData.latency,
              id,
              userId,
            ]
          );
        } else {
          // insert
          const [result] = await db.pool.query(
            `
              INSERT INTO sleepLogs (
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
                efficiency,
                sleepScore,
                timingScore,
                restfulnessScore,
                latency
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
                ?,
                ?,
                ?
              )
            `,
            [
              userId,
              cleanedData.date,
              cleanedData.totalSleep,
              cleanedData.recoveryIndex,
              cleanedData.readinessScore,
              cleanedData.awakeQty,
              cleanedData.remQty,
              cleanedData.lightQty,
              cleanedData.deepQty,
              cleanedData.totalBed,
              cleanedData.efficiency,
              cleanedData.sleepScore,
              cleanedData.timingScore,
              cleanedData.restfulnessScore,
              cleanedData.latency,
            ]
          );

          returnId = result.insertId;
        }

        // get created/updated log and corresponding tags
        const [log] = await db.pool.query(
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
            WHERE id = ?
              AND userId = ?
          `,
          [returnId, userId]
        );
        const [existingTags] = await db.pool.query(
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
            WHERE logId = ?
          `,
          [returnId]
        );

        resolve({
          existing: !!id,
          log: { ...log[0], tags: existingTags },
        });
      } catch (error) {
        reject(error);
      }
    });
  },
};

module.exports = sleepFunctions;
