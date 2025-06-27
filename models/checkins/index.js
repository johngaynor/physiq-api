const db = require("../../config/database");

const checkInFunctions = {
  async getCheckIns(userId) {
    return new Promise(async function (resolve, reject) {
      try {
        const [checkIns] = await db.query(
          `
           SELECT
               ci.id,
               ci.date,
               ci.hormones,
               COALESCE(
                 (SELECT dl.phase 
                  FROM dietLogs dl 
                  WHERE dl.userId = ci.userId 
                    AND dl.effectiveDate <= ci.date 
                  ORDER BY dl.effectiveDate DESC 
                  LIMIT 1), 
                 ci.phase
               ) as phase,
               ci.timeline,
               ci.cheats,
               ci.comments,
               ci.training
           FROM checkIns ci
           WHERE ci.userId = (SELECT id FROM apiUsers WHERE clerkId = ?)
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
                training = ?
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
                training
              )
              VALUES (
                (SELECT id FROM apiUsers WHERE clerkId = ?),
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

  async deleteCheckIn(userId, checkInId) {
    return new Promise(async function (resolve, reject) {
      try {
        await db.query(
          `
            DELETE FROM checkIns
            WHERE userId = (SELECT id FROM apiUsers WHERE clerkId = ?)
              AND id = ?
        `,
          [userId, checkInId]
        );
        resolve("Success");
      } catch (error) {
        reject(error);
      }
    });
  },
};

module.exports = checkInFunctions;
