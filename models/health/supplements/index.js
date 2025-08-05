const db = require("../../../config/database");

const supplementFunctions = {
  async getSupplements() {
    return new Promise(async function (resolve, reject) {
      try {
        // Get supplements
        const [supplements] = await db.pool.query(
          `
          SELECT
            id,
            name,
            description
          FROM supplements
          WHERE active = 1
          ORDER BY id DESC
          `
        );

        // Get tags for each supplement
        const [tags] = await db.pool.query(
          `
          SELECT
            st.supplementId,
            sto.id as tagId,
            sto.name as tagName
          FROM supplementsTags st
          JOIN supplementsTagsOptions sto ON st.tagId = sto.id
          `
        );

        // Group tags by supplementId
        const tagsBySupplementId = {};
        tags.forEach((tag) => {
          if (!tagsBySupplementId[tag.supplementId]) {
            tagsBySupplementId[tag.supplementId] = [];
          }
          tagsBySupplementId[tag.supplementId].push({
            id: tag.tagId,
            name: tag.tagName,
          });
        });

        // Add tags to each supplement
        const supplementsWithTags = supplements.map((supplement) => ({
          ...supplement,
          tags: tagsBySupplementId[supplement.id] || [],
        }));

        resolve(supplementsWithTags);
      } catch (error) {
        reject(error);
      }
    });
  },
  async getSupplementLogs(userId) {
    return new Promise(async function (resolve, reject) {
      try {
        const [result] = await db.pool.query(
          `
          SELECT
            supplementId,
            date,
            completed,
            reason
          FROM supplementsLogs
          WHERE userId = ?
          `,
          [userId]
        );
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  },
  async toggleSupplementLog({ userId, date, supplementId, checked }) {
    return new Promise(async function (resolve, reject) {
      try {
        if (checked) {
          // insert
          await db.pool.query(
            `
            INSERT INTO supplementsLogs (userId, date, supplementId, completed)
            VALUES (?, ?, ?, ?)
            `,
            [userId, date, supplementId, 1]
          );
        } else {
          // delete
          await db.pool.query(
            `
            DELETE FROM supplementsLogs
            WHERE userId = ?
            AND date = ?
            AND supplementId = ?
            `,
            [userId, date, supplementId]
          );
        }

        resolve("success");
      } catch (error) {
        reject(error);
      }
    });
  },
  async getSupplementTags() {
    return new Promise(async function (resolve, reject) {
      try {
        const [result] = await db.pool.query(
          `
          SELECT
            id,
            name
          FROM supplementsTagsOptions
          ORDER BY name ASC
          `
        );
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  },
  async assignSupplementTag(supplementId, tagId) {
    return new Promise(async function (resolve, reject) {
      try {
        if (!supplementId || !tagId) {
          throw new Error("Missing supplementId or tagId");
        }

        await db.pool.query(
          `
          INSERT INTO supplementsTags (supplementId, tagId)
          VALUES (?, ?)
          `,
          [supplementId, tagId]
        );

        resolve("success");
      } catch (error) {
        reject(error);
      }
    });
  },
};

module.exports = supplementFunctions;
