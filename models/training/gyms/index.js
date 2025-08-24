const db = require("../../../config/database");
// Generate signed URLs and blob data for each photo
const {
  getUrl,
  getFileAsBlob,
  deleteFile,
} = require("../../../config/awsConfig");
const bucketName = process.env.GYM_PHOTOS_BUCKET;

const gymFunctions = {
  async getGyms(userId) {
    return new Promise(async function (resolve, reject) {
      try {
        const [gyms] = await db.pool.query(
          `
            SELECT
                g.id,
                g.name,
                g.streetAddress,
                g.city,
                g.state,
                g.postalCode,
                g.fullAddress,
                g.latitude,
                g.longitude,
                g.createdBy,
                g.lastUpdated,
                g.comments,
                g.dayPasses,
                g.cost,
                (
                  SELECT COUNT(*)
                  FROM sessions s
                  WHERE s.gymId = g.id AND s.userId = ?
                ) AS yourSessions,
                (
                  SELECT COUNT(*)
                  FROM sessions s
                  WHERE s.gymId = g.id
                ) AS totalSessions
            FROM gyms g;
          `,
          [userId]
        );

        // Get tags for all gyms
        const [tags] = await db.pool.query(
          `
            SELECT
                gymId,
                tag
            FROM gymsTags
            ORDER BY gymId, tag
          `
        );

        // Get reviews for all gyms
        const [reviews] = await db.pool.query(
          `
            SELECT
                id,
                gymId,
                userId,
                rating,
                review,
                lastUpdated
            FROM gymsReviews
            ORDER BY gymId, lastUpdated DESC
          `
        );

        // Map tags and reviews to gyms
        const gymsWithTagsAndReviews = gyms.map((gym) => {
          const gymTags = tags
            .filter((tag) => tag.gymId === gym.id)
            .map((tag) => tag.tag);

          const gymReviews = reviews.filter(
            (review) => review.gymId === gym.id
          );

          return {
            ...gym,
            tags: gymTags,
            reviews: gymReviews,
          };
        });

        resolve(gymsWithTagsAndReviews);
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
    comments,
    dayPasses,
    cost,
    tags,
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
              SET name = ?, streetAddress = ?, city = ?, state = ?, postalCode = ?, fullAddress = ?, latitude = ?, longitude = ?, comments = ?, dayPasses = ?, cost = ?
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
              comments,
              dayPasses,
              cost,
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
              INSERT INTO gyms (name, streetAddress, city, state, postalCode, fullAddress, latitude, longitude, comments, dayPasses, cost, createdBy)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
              comments,
              dayPasses,
              cost,
              userId,
            ]
          );

          returnId = result.insertId;
        }

        // Handle tags if provided
        if (tags && Array.isArray(tags)) {
          // Clear existing tags for this gym
          await db.pool.query(
            `
              DELETE FROM gymsTags
              WHERE gymId = ?
            `,
            [returnId]
          );

          // Insert new tags if any are provided
          if (tags.length > 0) {
            // Filter out empty/null tags and remove duplicates
            const validTags = [
              ...new Set(tags.filter((tag) => tag && tag.trim().length > 0)),
            ];

            if (validTags.length > 0) {
              const tagValues = validTags.map((tag) => [returnId, tag.trim()]);

              await db.pool.query(
                `
                  INSERT INTO gymsTags (gymId, tag)
                  VALUES ?
                `,
                [tagValues]
              );
            }
          }
        }

        // Select and return the complete gym object with tags
        const [gymResult] = await db.pool.query(
          `
           SELECT
              g.id,
              g.name,
              g.streetAddress,
              g.city,
              g.state,
              g.postalCode,
              g.fullAddress,
              g.latitude,
              g.longitude,
              g.createdBy,
              g.lastUpdated,
              g.comments,
              g.dayPasses,
              g.cost,
              (
                SELECT COUNT(*)
                FROM sessions s
                WHERE s.gymId = g.id AND s.userId = ?
              ) AS yourSessions,
              (
                SELECT COUNT(*)
                FROM sessions s
                WHERE s.gymId = g.id
              ) AS totalSessions
          FROM gyms g
          WHERE g.id = ?
          `,
          [userId, returnId]
        );

        if (!gymResult.length) {
          reject(new Error("Failed to retrieve gym"));
          return;
        }

        // Get tags for this gym
        const [gymTags] = await db.pool.query(
          `
            SELECT tag
            FROM gymsTags
            WHERE gymId = ?
            ORDER BY tag
          `,
          [returnId]
        );

        // Get reviews for this gym
        const [gymReviews] = await db.pool.query(
          `
            SELECT
                id,
                gymId,
                userId,
                rating,
                review,
                lastUpdated
            FROM gymsReviews
            WHERE gymId = ?
            ORDER BY lastUpdated DESC
          `,
          [returnId]
        );

        const gymWithTagsAndReviews = {
          ...gymResult[0],
          tags: gymTags.map((tagRow) => tagRow.tag),
          reviews: gymReviews,
        };

        resolve(gymWithTagsAndReviews);
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

  async upsertGymReview({ id, gymId, userId, rating, review }) {
    return new Promise(async function (resolve, reject) {
      try {
        let returnId = id;

        if (id) {
          // Update existing review
          const [result] = await db.pool.query(
            `
              UPDATE gymsReviews
              SET rating = ?, review = ?
              WHERE id = ? AND userId = ?
            `,
            [rating, review, id, userId]
          );

          if (result.affectedRows === 0) {
            reject(new Error("Review not found or unauthorized"));
            return;
          }
        } else {
          // Insert new review
          const [result] = await db.pool.query(
            `
              INSERT INTO gymsReviews (gymId, userId, rating, review)
              VALUES (?, ?, ?, ?)
            `,
            [gymId, userId, rating, review]
          );

          returnId = result.insertId;
        }

        // Select and return the review
        const [reviewResult] = await db.pool.query(
          `
            SELECT
                id,
                gymId,
                userId,
                rating,
                review,
                lastUpdated
            FROM gymsReviews
            WHERE id = ?
          `,
          [returnId]
        );

        if (!reviewResult.length) {
          reject(new Error("Failed to retrieve review"));
          return;
        }

        resolve(reviewResult[0]);
      } catch (error) {
        reject(error);
      }
    });
  },
};

module.exports = gymFunctions;
