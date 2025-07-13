const axios = require("axios");
const FormData = require("form-data");

const physiqueAnalysis = {
  async analyzePose(fileBuffer, originalFilename, mimetype) {
    return new Promise(async function (resolve, reject) {
      try {
        // Create form data for FastAPI endpoint
        const form = new FormData();
        form.append("file", fileBuffer, {
          filename: originalFilename,
          contentType: mimetype,
        });

        // Send to FastAPI prediction endpoint
        const externalApiResponse = await axios.post(
          "https://physiq-inference-api.onrender.com/predict",
          form,
          {
            headers: {
              ...form.getHeaders(),
            },
          }
        );

        resolve(externalApiResponse.data);
      } catch (error) {
        reject(error);
      }
    });
  },
};

module.exports = physiqueAnalysis;
