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
};

module.exports = checkInFunctions;
