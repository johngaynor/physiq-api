const axios = require("axios");
const FormData = require("form-data");
const db = require("../../../config/database");

const poseAnalysis = {
  async getPoses() {
    return new Promise(async function (resolve, reject) {
      try {
        const [poses] = await db.query(
          `
            SELECT
                id,
                name
            FROM checkInsPoses
          `
        );

        resolve(poses);
      } catch (error) {
        reject(error);
      }
    });
  },

  async assignPose(userId, poseId, s3Filename) {
    return new Promise(async function (resolve, reject) {
      try {
        const [result] = await db.query(
          `
            INSERT INTO physiquePoseClassification 
            (userId, poseId, s3Filename)
            VALUES ((select id from apiUsers where clerkId = ?), ?, ?)
          `,
          [userId, poseId, s3Filename]
        );

        resolve({
          id: result.insertId,
          userId,
          poseId,
          s3Filename,
        });
      } catch (error) {
        reject(error);
      }
    });
  },

  async analyzePose({
    fileBuffer,
    filename,
    mimetype,
    isTraining = 0,
    userId,
  }) {
    return new Promise(async function (resolve, reject) {
      try {
        // Create form data for FastAPI endpoint
        const form = new FormData();
        form.append("file", fileBuffer, {
          filename: filename,
          contentType: mimetype,
        });

        // Send to FastAPI prediction endpoint
        const externalApiResponse = await axios.post(
          "https://physiq-inference-api.onrender.com/inference/predict/single",
          form,
          {
            headers: {
              ...form.getHeaders(),
            },
          }
        );

        // insert logs
        await db.query(
          `INSERT INTO poseClassificationModelsCalls (modelId, userId, isTraining)
        VALUES (
          (SELECT MAX(id) FROM poseClassificationModels),
          (SELECT id FROM apiUsers WHERE clerkId = ?),
          ?
        )`,
          [userId, isTraining]
        );

        resolve(externalApiResponse.data);
      } catch (error) {
        reject(error);
      }
    });
  },
};

module.exports = poseAnalysis;
