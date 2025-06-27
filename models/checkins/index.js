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
                cheats = ?,
                comments = ?,
                training = ?
              WHERE id = ?
              AND userId = (SELECT id FROM apiUsers WHERE clerkId = ?)
            `,
            [date, cheats, comments, training, id, userId]
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
                cheats,
                comments,
                training
              )
              VALUES (
                (SELECT id FROM apiUsers WHERE clerkId = ?),
                ?,
                ?,
                ?,
                ?
              )
            `,
            [userId, date, cheats, comments, training]
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
        // Delete attachments first (due to foreign key constraint)
        await db.query(
          `
            DELETE FROM checkInsAttachments
            WHERE checkInId = ?
          `,
          [checkInId]
        );

        // Delete the check-in
        const [result] = await db.query(
          `
            DELETE FROM checkIns
            WHERE userId = (SELECT id FROM apiUsers WHERE clerkId = ?)
              AND id = ?
          `,
          [userId, checkInId]
        );

        if (result.affectedRows === 0) {
          reject(new Error("Check-in not found or unauthorized"));
        } else {
          resolve({ message: "Check-in deleted successfully" });
        }
      } catch (error) {
        reject(error);
      }
    });
  },
};

module.exports = checkInFunctions;
