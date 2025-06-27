const db = require("../../config/database");

const checkInFunctions = {
  async getCheckIns(userId) {
    return new Promise(async function (resolve, reject) {
      try {
        const [checkIns] = await db.query(
          `
           SELECT
               id,
               date,
               hormones,
               phase,
               timeline,
               cheats,
               comments,
               training,
               cast(avgTotalSleep as double) as avgTotalSleep,
               cast(avgTotalBed as double) as avgTotalBed,
               cast(avgRecoveryIndex as double) as avgRecoveryIndex,
               cast(avgRemQty as double) as avgRemQty,
               cast(avgDeepQty as double) as avgDeepQty
           FROM checkIns 
           WHERE userId = (SELECT id FROM apiUsers WHERE clerkId = ?)
        `,
          [userId]
        );

        const [attachments] = await db.query(
          `
            SELECT
                att.id,
                att.checkInId,
                att.s3Filename,
                att.poseId
            FROM checkInsAttachments att
            LEFT JOIN checkIns ci
                ON ci.id = att.checkInId
            WHERE ci.userId = (SELECT id FROM apiUsers WHERE clerkId = ?)
          `,
          [userId]
        );

        const checkInsWithAttachments = checkIns.map((checkIn) => {
          return {
            ...checkIn,
            attachments: attachments
              .filter((att) => att.checkInId === checkIn.id)
              .map((att) => ({
                id: att.id,
                s3Filename: att.s3Filename,
                poseId: att.poseId,
              })),
          };
        });

        resolve(checkInsWithAttachments);
      } catch (error) {
        reject(error);
      }
    });
  },

  async editCheckIn(
    userId,
    {
      id,
      date,
      hormones,
      phase,
      timeline,
      cheats,
      comments,
      training,
      avgTotalSleep,
      avgTotalBed,
      avgRecoveryIndex,
      avgRemQty,
      avgDeepQty,
      attachments,
    }
  ) {
    return new Promise(async function (resolve, reject) {
      try {
        let returnId = id;
        // update existing
        if (id) {
          // update main table
          await db.query(
            `
              UPDATE checkIns
              SET
                date = ?,
                hormones = ?,
                phase = ?,
                timeline = ?,
                cheats = ?,
                comments = ?,
                training = ?,
                avgTotalSleep = ?,
                avgTotalBed = ?,
                avgRecoveryIndex = ?,
                avgRemQty = ?,
                avgDeepQty = ?
              WHERE id = ?
              AND userId = (SELECT id FROM apiUsers WHERE clerkId = ?)
            `,
            [
              date,
              hormones,
              phase,
              timeline,
              cheats,
              comments,
              training,
              avgTotalSleep,
              avgTotalBed,
              avgRecoveryIndex,
              avgRemQty,
              avgDeepQty,
              id,
              userId,
            ]
          );
          // delete existing attachments
          await db.query(
            `
              DELETE FROM checkInsAttachments
              WHERE checkInId = ?
            `,
            [id]
          );
          // insert new attachments
          if (attachments && attachments.length > 0) {
            const attachmentValues = attachments.map((att) => [
              id,
              att.s3Filename,
              att.poseId,
            ]);
            await db.query(
              `
                INSERT INTO checkInsAttachments (checkInId, s3Filename, poseId)
                VALUES ?
              `,
              [attachmentValues]
            );
          }
        } else {
          // insert new check-in
          const [result] = await db.query(
            `
              INSERT INTO checkIns (
                userId,
                date,
                hormones,
                phase,
                timeline,
                cheats,
                comments,
                training,
                avgTotalSleep,
                avgTotalBed,
                avgRecoveryIndex,
                avgRemQty,
                avgDeepQty
              )
              VALUES (
                (SELECT id FROM apiUsers WHERE clerkId = ?),
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
              date,
              hormones,
              phase,
              timeline,
              cheats,
              comments,
              training,
              avgTotalSleep,
              avgTotalBed,
              avgRecoveryIndex,
              avgRemQty,
              avgDeepQty,
            ]
          );

          const newId = result.insertId;
          returnId = newId;

          // insert attachments
          if (attachments && attachments.length > 0) {
            const attachmentValues = attachments.map((att) => [
              newId,
              att.s3Filename,
              att.poseId,
            ]);
            await db.query(
              `
                INSERT INTO checkInsAttachments (checkInId, s3Filename, poseId)
                VALUES ?
              `,
              [attachmentValues]
            );
          }
        }

        resolve({ id: returnId });
      } catch (error) {
        reject(error);
      }
    });
  },
};

module.exports = checkInFunctions;
