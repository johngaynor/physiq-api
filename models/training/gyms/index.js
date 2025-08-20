const db = require("../../../config/database");
// Generate signed URLs and blob data for each photo
const {
  getUrl,
  getFileAsBlob,
  deleteFile,
} = require("../../../config/awsConfig");
const bucketName = process.env.GYM_PHOTOS_BUCKET;

const gymFunctions = {
  async getGyms() {
    return new Promise(async function (resolve, reject) {
      try {
        const [gyms] = await db.pool.query(
          `
            SELECT
                id,
                name,
                streetAddress,
                city,
                state,
                postalCode,
                fullAddress,
                latitude,
                longitude,
                createdBy,
                lastUpdated
            FROM gyms
          `
        );

        resolve(gyms);
      } catch (error) {
        reject(error);
      }
    });
  },

  async deleteGym(gymId) {
    return new Promise(async function (resolve, reject) {
      try {
        const [result] = await db.pool.query(
          `
            DELETE FROM gyms
            WHERE id = ?
          `,
          [gymId]
        );

        if (result.affectedRows === 0) {
          reject(new Error("Gym not found"));
          return;
        }

        resolve("Success");
      } catch (error) {
        reject(error);
      }
    });
  },

  async editGym({
    id,
    name,
    streetAddress,
    city,
    state,
    postalCode,
    fullAddress,
    latitude,
    longitude,
    userId,
  }) {
    return new Promise(async function (resolve, reject) {
      try {
        let returnId = id;

        if (id) {
          // Update existing gym (createdBy is not modified)
          const [result] = await db.pool.query(
            `
              UPDATE gyms
              SET name = ?, streetAddress = ?, city = ?, state = ?, postalCode = ?, fullAddress = ?, latitude = ?, longitude = ?
              WHERE id = ?
            `,
            [
              name,
              streetAddress,
              city,
              state,
              postalCode,
              fullAddress,
              latitude,
              longitude,
              id,
            ]
          );

          if (result.affectedRows === 0) {
            reject(new Error("Gym not found"));
            return;
          }
        } else {
          // Insert new gym
          const [result] = await db.pool.query(
            `
              INSERT INTO gyms (name, streetAddress, city, state, postalCode, fullAddress, latitude, longitude, createdBy)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
              name,
              streetAddress,
              city,
              state,
              postalCode,
              fullAddress,
              latitude,
              longitude,
              userId,
            ]
          );

          returnId = result.insertId;
        }

        resolve({ id: returnId });
      } catch (error) {
        reject(error);
      }
    });
  },

  async getGymPhotos(gymId) {
    return new Promise(async function (resolve, reject) {
      try {
        // First verify the gym exists
        const [gymExists] = await db.pool.query(
          `
            SELECT id FROM gyms 
            WHERE id = ?
          `,
          [gymId]
        );

        if (!gymExists.length) {
          reject(new Error("Gym not found"));
          return;
        }

        // Get photos for the gym
        const [photos] = await db.pool.query(
          `
            SELECT
                id,
                s3Filename,
                createdBy,
                lastUpdated
            FROM gymsPhotos
            WHERE gymId = ?
            ORDER BY lastUpdated DESC
          `,
          [gymId]
        );

        const photosWithUrls = await Promise.all(
          photos.map(async (photo) => {
            try {
              const signedUrl = await getUrl(bucketName, photo.s3Filename);

              // Get the file as blob
              const blobData = await getFileAsBlob(
                bucketName,
                photo.s3Filename
              );

              return {
                id: photo.id,
                url: signedUrl,
                s3Filename: photo.s3Filename,
                createdBy: photo.createdBy,
                lastUpdated: photo.lastUpdated,
                blob: {
                  data: blobData.buffer.toString("base64"),
                  contentType: blobData.contentType,
                  size: blobData.contentLength,
                  lastModified: blobData.lastModified,
                },
              };
            } catch (error) {
              console.error(
                `Error generating URL/blob for ${photo.s3Filename}:`,
                error
              );
              return {
                id: photo.id,
                url: null,
                s3Filename: photo.s3Filename,
                createdBy: photo.createdBy,
                lastUpdated: photo.lastUpdated,
                blob: null,
                error: "Unable to generate URL or download blob",
              };
            }
          })
        );

        resolve(photosWithUrls);
      } catch (error) {
        reject(error);
      }
    });
  },

  async uploadGymPhotos(gymId, userId, photoFilenames) {
    return new Promise(async function (resolve, reject) {
      try {
        // First verify the gym exists
        const [gymExists] = await db.pool.query(
          `
            SELECT id FROM gyms 
            WHERE id = ?
          `,
          [gymId]
        );

        if (!gymExists.length) {
          reject(new Error("Gym not found"));
          return;
        }

        // Insert each photo into the database
        const insertPromises = photoFilenames.map(async (filename) => {
          const [result] = await db.pool.query(
            `
              INSERT INTO gymsPhotos (gymId, s3Filename, createdBy)
              VALUES (?, ?, ?)
            `,
            [gymId, filename, userId]
          );
          return result.insertId;
        });

        const insertedIds = await Promise.all(insertPromises);

        resolve({
          message: "Photos uploaded successfully",
          uploadedPhotos: insertedIds.length,
          photoIds: insertedIds,
        });
      } catch (error) {
        reject(error);
      }
    });
  },

  async deleteGymPhoto(photoId, userId) {
    return new Promise(async function (resolve, reject) {
      try {
        // First get the photo details to verify ownership and get S3 filename
        const [photoDetails] = await db.pool.query(
          `
            SELECT gp.id, gp.s3Filename, gp.gymId, gp.createdBy
            FROM gymsPhotos gp
            WHERE gp.id = ?
          `,
          [photoId]
        );

        if (!photoDetails.length) {
          reject(new Error("Photo not found"));
          return;
        }

        const photo = photoDetails[0];

        // Optional: Check if user has permission to delete (creator or admin)
        // You can modify this logic based on your permission requirements
        if (photo.createdBy !== userId) {
          // You might want to add additional admin check here
          reject(new Error("Unauthorized to delete this photo"));
          return;
        }

        // Delete from S3 first
        try {
          await deleteFile(bucketName, photo.s3Filename);
        } catch (s3Error) {
          console.error("Error deleting from S3:", s3Error);
          // You can decide whether to continue with database deletion or fail here
          // For now, we'll continue and just log the error
        }

        // Delete from database
        const [result] = await db.pool.query(
          `
            DELETE FROM gymsPhotos
            WHERE id = ?
          `,
          [photoId]
        );

        if (result.affectedRows === 0) {
          reject(new Error("Photo not found in database"));
          return;
        }

        resolve({
          message: "Photo deleted successfully",
          photoId: photoId,
          s3Filename: photo.s3Filename,
        });
      } catch (error) {
        reject(error);
      }
    });
  },
};

module.exports = gymFunctions;
