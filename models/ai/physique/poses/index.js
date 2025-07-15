const db = require("../../../../config/database");

const poseFunctions = {
  async getTrainingPhotos(userId) {
    return new Promise(async function (resolve, reject) {
      try {
        const [trainingPhotos] = await db.query(
          `
          select
            id,
            case
                when userId = (select id from apiUsers where clerkId = ?) then s3Filename
                else null
                end 
            as s3Filename,
            poseId,
            'training' as location
        from physiquePoseClassification
          `,
          [userId]
        );

        const [checkInPhotos] = await db.query(
          `
            select
            chk.id,
            chk.s3Filename,
            chk.poseId,
            'checkin' as location
            from checkInsAttachments chk
            left join checkIns c
                on c.id = chk.checkInId
            where c.userId = (select id from apiUsers where clerkId = ?)
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
        const [[{ totalCalls }]] = await db.query(
          `
          select count(*) as totalCalls from poseClassificationModelsCalls;
          `
        );

        const [modelData] = await db.query(
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
