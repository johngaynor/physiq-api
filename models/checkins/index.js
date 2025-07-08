const db = require("../../config/database");

const checkInFunctions = {
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
          reject(
            new Error(
              "Check-in not found or unauthorized (getting attachments)"
            )
          );
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

        // Generate signed URLs and blob data for each attachment
        const { getUrl, getFileAsBlob } = require("../../config/awsConfig");
        const bucketName = process.env.CHECKIN_BUCKET;

        const attachmentsWithUrls = await Promise.all(
          attachments.map(async (attachment) => {
            try {
              const signedUrl = await getUrl(bucketName, attachment.s3Filename);

              // Get the file as blob
              const blobData = await getFileAsBlob(
                bucketName,
                attachment.s3Filename
              );

              return {
                id: attachment.id,
                url: signedUrl,
                poseId: attachment.poseId,
                s3Filename: attachment.s3Filename,
                blob: {
                  data: blobData.buffer.toString("base64"),
                  contentType: blobData.contentType,
                  size: blobData.contentLength,
                  lastModified: blobData.lastModified,
                },
              };
            } catch (error) {
              console.error(
                `Error generating URL/blob for ${attachment.s3Filename}:`,
                error
              );
              return {
                id: attachment.id,
                url: null,
                poseId: attachment.poseId,
                s3Filename: attachment.s3Filename,
                blob: null,
                error: "Unable to generate URL or download blob",
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
        const currentTime = new Date();

        // update existing
        if (id) {
          // update main table with recentSubmitTime
          await db.query(
            `
              UPDATE checkIns
              SET
                date = ?,
                cheats = ?,
                comments = ?,
                training = ?,
                recentSubmitTime = ?
              WHERE id = ?
              AND userId = (SELECT id FROM apiUsers WHERE clerkId = ?)
            `,
            [date, cheats, comments, training, currentTime, id, userId]
          );
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

          // Insert new check-in with recentSubmitTime
          const [result] = await db.query(
            `
              INSERT INTO checkIns (
                userId,
                date,
                cheats,
                comments,
                training,
                timeline,
                recentSubmitTime
              )
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
            [
              internalUserId,
              date,
              cheats,
              comments,
              training,
              nextTimeline,
              currentTime,
            ]
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
        // First get all S3 filenames for this check-in so we can delete them from S3
        const [attachments] = await db.query(
          `
            SELECT att.s3Filename
            FROM checkInsAttachments att
            INNER JOIN checkIns ci ON ci.id = att.checkInId
            WHERE att.checkInId = ? 
              AND ci.userId = (SELECT id FROM apiUsers WHERE clerkId = ?)
          `,
          [checkInId, userId]
        );

        // Delete files from S3 if they exist
        if (attachments.length > 0) {
          const { deleteFile } = require("../../config/awsConfig");
          const bucketName = process.env.CHECKIN_BUCKET;

          // Delete each file from S3
          const deletePromises = attachments.map(async (attachment) => {
            try {
              await deleteFile(bucketName, attachment.s3Filename);
              console.log(
                `Successfully deleted S3 file: ${attachment.s3Filename}`
              );
            } catch (error) {
              console.error(
                `Error deleting S3 file ${attachment.s3Filename}:`,
                error
              );
              // Continue with deletion even if S3 delete fails
            }
          });

          // Wait for all S3 deletions to complete (or fail)
          await Promise.allSettled(deletePromises);
        }

        // Delete attachments from database (due to foreign key constraint)
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
          reject(
            new Error("Check-in not found or unauthorized (none affected)")
          );
        } else {
          resolve({
            message: "Check-in deleted successfully",
            deletedFiles: attachments.length,
          });
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
            reject(
              new Error(
                "Check-in not found or unauthorized (getting photo urls)"
              )
            );
            return;
          }
        }

        // Generate signed URLs and blob data for each photo
        const { getUrl, getFileAsBlob } = require("../../config/awsConfig");
        const bucketName = process.env.CHECKIN_BUCKET;

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
                poseId: photo.poseId,
                s3Filename: photo.s3Filename,
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
                poseId: photo.poseId,
                s3Filename: photo.s3Filename,
                blob: null,
                error: "Unable to generate URL or download blob",
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

  async assignPose(userId, attachmentId, poseId) {
    return new Promise(async function (resolve, reject) {
      try {
        // Update the attachment's poseId (with user authorization check)
        const [result] = await db.query(
          `
            UPDATE checkInsAttachments att
            INNER JOIN checkIns ci ON ci.id = att.checkInId
            SET att.poseId = ?
            WHERE att.id = ? 
              AND ci.userId = (SELECT id FROM apiUsers WHERE clerkId = ?)
          `,
          [poseId, attachmentId, userId]
        );

        if (result.affectedRows === 0) {
          reject(new Error("Attachment not found or unauthorized"));
          return;
        }

        resolve({
          message: "Pose ID assigned successfully",
          attachmentId: parseInt(attachmentId),
          poseId: poseId,
        });
      } catch (error) {
        reject(error);
      }
    });
  },

  async getCheckInComments(checkInId) {
    return new Promise(async function (resolve, reject) {
      try {
        const [comments] = await db.query(
          `
            SELECT
                cc.id,
                cc.checkInId,
                cc.userId,
                cc.date,
                cc.comment,
                au.name
            FROM checkInsCommentary cc
            INNER JOIN checkIns ci ON ci.id = cc.checkInId
            LEFT JOIN apiUsers au ON au.clerkId = cc.userId
            WHERE cc.checkInId = ?
            ORDER BY cc.date DESC
          `,
          [checkInId]
        );

        resolve(comments);
      } catch (error) {
        reject(error);
      }
    });
  },

  async insertCheckInComment(checkInId, userId, comment) {
    return new Promise(async function (resolve, reject) {
      try {
        const currentDate = new Date();
        const [result] = await db.query(
          `
            INSERT INTO checkInsCommentary (checkInId, userId, comment, date)
            VALUES (?, ?, ?, ?)
          `,
          [checkInId, userId, comment, currentDate]
        );

        resolve({
          id: result.insertId,
          checkInId: checkInId,
          userId: userId,
          comment: comment,
          date: currentDate,
        });
      } catch (error) {
        reject(error);
      }
    });
  },
};

module.exports = checkInFunctions;
