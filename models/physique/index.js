const axios = require("axios");
const FormData = require("form-data");

const physiqueAnalysis = {
  async analyzePose(fileBuffer, originalFilename, mimetype) {
    return new Promise(async function (resolve, reject) {
      try {
        console.log("=== PHYSIQUE MODEL DEBUG ===");
        console.log("Preparing file for FastAPI...");
        console.log("Original filename:", originalFilename);
        console.log("MIME type:", mimetype);
        console.log("Buffer size:", fileBuffer.length, "bytes");

        // Create form data for FastAPI endpoint
        const form = new FormData();
        form.append("file", fileBuffer, {
          filename: originalFilename,
          contentType: mimetype,
        });

        console.log("Form data created, sending to FastAPI...");
        console.log(
          "FastAPI endpoint: https://physiq-inference-api.onrender.com/predict"
        );

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

        console.log("FastAPI response status:", externalApiResponse.status);
        console.log(
          "FastAPI response data:",
          JSON.stringify(externalApiResponse.data, null, 2)
        );
        console.log("============================");

        resolve(externalApiResponse.data);
      } catch (error) {
        console.error("=== PHYSIQUE MODEL ERROR ===");
        console.error("Error in analyzePose:", error.message);
        if (error.response) {
          console.error("FastAPI error status:", error.response.status);
          console.error("FastAPI error data:", error.response.data);
        }
        if (error.request) {
          console.error("Request was made but no response received");
          console.error("Request details:", error.request);
        }
        console.error("=============================");
        reject(error);
      }
    });
  },
};

module.exports = physiqueAnalysis;
