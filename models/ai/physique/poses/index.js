const db = require("../../../../config/database");

const poseFunctions = {
  async getTrainingPhotos(userId) {
    return new Promise(async function (resolve, reject) {
      try {
        const [trainingPhotos] = await db.pool.query(
          `
          select
            id,
            case
                when userId = ? then s3Filename
                else null
                end 
            as s3Filename,
            poseId,
            'training' as location
        from physiquePoseClassification
          `,
          [userId]
        );

        const [checkInPhotos] = await db.pool.query(
          `
            select
            chk.id,
            chk.s3Filename,
            chk.poseId,
            'checkin' as location
            from checkInsAttachments chk
            left join checkIns c
                on c.id = chk.checkInId
            where c.userId = ?
            `,
          [userId]
        );

        resolve([...trainingPhotos, ...checkInPhotos]);
      } catch (error) {
        reject(error);
      }
    });
  },
  async getModelData() {
    return new Promise(async function (resolve, reject) {
      try {
        const [[{ totalCalls }]] = await db.pool.query(
          `
          select count(*) as totalCalls from poseClassificationModelsCalls;
          `
        );

        const [modelData] = await db.pool.query(
          `
          SELECT id, versionNum, githubRepo, stack
        FROM poseClassificationModels
        ORDER BY id DESC
        LIMIT 1;
          `
        );

        const model = modelData.length > 0 ? modelData[0] : null;

        resolve({ totalCalls, model });
      } catch (error) {
        reject(error);
      }
    });
  },
};

module.exports = poseFunctions;
