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
               ci.training,
               ci.timeline
           FROM checkIns ci
           WHERE ci.userId = (SELECT id FROM apiUsers WHERE clerkId = ?)
           ORDER BY ci.date DESC
        `,
          [userId]
        );

        resolve(checkIns);
      } catch (error) {
        reject(error);
      }
    });
  },

  async getCheckInAttachments(userId, checkInId) {
    return new Promise(async function (resolve, reject) {
      try {
        // First verify the check-in belongs to the user
        const [checkInExists] = await db.query(
          `
            SELECT id FROM checkIns 
            WHERE id = ? AND userId = (SELECT id FROM apiUsers WHERE clerkId = ?)
          `,
          [checkInId, userId]
        );

        if (!checkInExists.length) {
          reject(new Error("Check-in not found or unauthorized"));
          return;
        }

        // Get attachments for the check-in
        const [attachments] = await db.query(
          `
            SELECT
                att.id,
                att.s3Filename,
                att.poseId
            FROM checkInsAttachments att
            WHERE att.checkInId = ?
          `,
          [checkInId]
        );

        // Generate signed URLs for each attachment
        const { getUrl } = require("../../config/awsConfig");
        const bucketName = process.env.CHECKIN_BUCKET;

        const attachmentsWithUrls = await Promise.all(
          attachments.map(async (attachment) => {
            try {
              const signedUrl = await getUrl(bucketName, attachment.s3Filename);
              return {
                id: attachment.id,
                url: signedUrl,
                poseId: attachment.poseId,
                filename: attachment.s3Filename,
              };
            } catch (error) {
              console.error(
                `Error generating URL for ${attachment.s3Filename}:`,
                error
              );
              return {
                id: attachment.id,
                url: null,
                poseId: attachment.poseId,
                filename: attachment.s3Filename,
                error: "Unable to generate URL",
              };
            }
          })
        );

        resolve(attachmentsWithUrls);
      } catch (error) {
        reject(error);
      }
    });
  },

  async editCheckIn(
    userId,
    { id, date, cheats, comments, training, attachments }
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
          // Get the user's internal ID first
          const [userResult] = await db.query(
            `SELECT id FROM apiUsers WHERE clerkId = ?`,
            [userId]
          );

          if (!userResult.length) {
            reject(new Error("User not found"));
            return;
          }

          const internalUserId = userResult[0].id;

          // Get the next timeline number
          const [timelineResult] = await db.query(
            `SELECT COALESCE(MAX(timeline), 0) + 1 as nextTimeline FROM checkIns WHERE userId = ?`,
            [internalUserId]
          );

          const nextTimeline = timelineResult[0].nextTimeline;

          // Insert new check-in
          const [result] = await db.query(
            `
              INSERT INTO checkIns (
                userId,
                date,
                cheats,
                comments,
                training,
                timeline
              )
              VALUES (?, ?, ?, ?, ?, ?)
            `,
            [internalUserId, date, cheats, comments, training, nextTimeline]
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

  async addPhotos(userId, checkInId, fileNames) {
    return new Promise(async function (resolve, reject) {
      try {
        // First verify that the check-in belongs to the user
        const [checkInExists] = await db.query(
          `
            SELECT id FROM checkIns 
            WHERE id = ? AND userId = (SELECT id FROM apiUsers WHERE clerkId = ?)
          `,
          [checkInId, userId]
        );

        if (!checkInExists.length) {
          reject(new Error("Check-in not found or unauthorized"));
          return;
        }

        // Insert the photo attachments
        if (fileNames && fileNames.length > 0) {
          const attachmentValues = fileNames.map((fileName) => [
            checkInId,
            fileName,
            null, // poseId can be null for now
          ]);

          await db.query(
            `
              INSERT INTO checkInsAttachments (checkInId, s3Filename, poseId)
              VALUES ?
            `,
            [attachmentValues]
          );
        }

        resolve({
          message: "Photos added successfully",
          photosAdded: fileNames.length,
        });
      } catch (error) {
        reject(error);
      }
    });
  },

  async removePhoto(userId, checkInId, photoId) {
    return new Promise(async function (resolve, reject) {
      try {
        // Verify the photo belongs to a check-in owned by the user
        const [result] = await db.query(
          `
            DELETE att FROM checkInsAttachments att
            INNER JOIN checkIns ci ON ci.id = att.checkInId
            WHERE att.id = ? 
              AND att.checkInId = ? 
              AND ci.userId = (SELECT id FROM apiUsers WHERE clerkId = ?)
          `,
          [photoId, checkInId, userId]
        );

        if (result.affectedRows === 0) {
          reject(new Error("Photo not found or unauthorized"));
        } else {
          resolve({ message: "Photo removed successfully" });
        }
      } catch (error) {
        reject(error);
      }
    });
  },

  async getPhotoUrls(userId, checkInId) {
    return new Promise(async function (resolve, reject) {
      try {
        // Verify the check-in belongs to the user and get photos
        const [photos] = await db.query(
          `
            SELECT att.id, att.s3Filename, att.poseId
            FROM checkInsAttachments att
            INNER JOIN checkIns ci ON ci.id = att.checkInId
            WHERE att.checkInId = ? 
              AND ci.userId = (SELECT id FROM apiUsers WHERE clerkId = ?)
          `,
          [checkInId, userId]
        );

        if (!photos.length) {
          // Check if check-in exists but has no photos
          const [checkInExists] = await db.query(
            `
              SELECT id FROM checkIns 
              WHERE id = ? AND userId = (SELECT id FROM apiUsers WHERE clerkId = ?)
            `,
            [checkInId, userId]
          );

          if (!checkInExists.length) {
            reject(new Error("Check-in not found or unauthorized"));
            return;
          }
        }

        // Generate signed URLs for each photo
        const { getUrl } = require("../../config/awsConfig");
        const bucketName =
          process.env.S3_BUCKET_NAME || "physiq-checkin-photos";

        const photosWithUrls = await Promise.all(
          photos.map(async (photo) => {
            try {
              const signedUrl = await getUrl(bucketName, photo.s3Filename);
              return {
                id: photo.id,
                url: signedUrl,
                poseId: photo.poseId,
                filename: photo.s3Filename,
              };
            } catch (error) {
              console.error(
                `Error generating URL for ${photo.s3Filename}:`,
                error
              );
              return {
                id: photo.id,
                url: null,
                poseId: photo.poseId,
                filename: photo.s3Filename,
                error: "Unable to generate URL",
              };
            }
          })
        );

        resolve({
          checkInId: parseInt(checkInId),
          photos: photosWithUrls,
        });
      } catch (error) {
        reject(error);
      }
    });
  },
};

module.exports = checkInFunctions;
