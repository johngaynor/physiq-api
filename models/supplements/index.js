const db = require("../../config/database");

const supplementFunctions = {
  async getSupplements(userId) {
    return new Promise(async function (resolve, reject) {
      try {
        const [supplements] = await db.pool.query(
          `
          SELECT
            id,
            userId,
            name,
            description,
            defaultDosage, 
            unit
          FROM supplements
          WHERE userId is null or userId = ?
          ORDER BY id DESC
          `,
          [userId]
        );

        resolve(supplements);
      } catch (error) {
        reject(error);
      }
    });
  },
  async getSupplementTags() {
    return new Promise(async function (resolve, reject) {
      try {
        const [tags] = await db.pool.query(
          `
          SELECT
            id,
            name
          FROM supplementsTagsOptions
          ORDER BY name ASC
          `
        );

        resolve(tags);
      } catch (error) {
        reject(error);
      }
    });
  },
  async getSupplementsTags() {
    return new Promise(async function (resolve, reject) {
      try {
        const [supplementsTags] = await db.pool.query(
          `
          SELECT
            id,
            supplementId,
            tagId
          FROM supplementsTags
          `
        );

        resolve(supplementsTags);
      } catch (error) {
        reject(error);
      }
    });
  },
  async getSupplementsIngredients() {
    return new Promise(async function (resolve, reject) {
      try {
        const [supplementsIngredients] = await db.pool.query(
          `
          SELECT
            si.id,
            si.parentId,
            si.childId,
            si.dosage,
            s.name,
            s.unit
          FROM supplementsIngredients si
          JOIN supplements s ON si.childId = s.id
          `
        );

        resolve(supplementsIngredients);
      } catch (error) {
        reject(error);
      }
    });
  },
  async editSupplementTags(supplementId, tags) {
    return new Promise(async function (resolve, reject) {
      try {
        // Delete existing tags for this supplement
        await db.pool.query(
          `
          DELETE FROM supplementsTags
          WHERE supplementId = ?
          `,
          [supplementId]
        );

        // Insert new tags if any exist
        if (tags && tags.length > 0) {
          const tagValues = tags.map((tag) => [supplementId, tag.id]);
          await db.pool.query(
            `
            INSERT INTO supplementsTags (supplementId, tagId)
            VALUES ?
            `,
            [tagValues]
          );
        }

        resolve("Success");
      } catch (error) {
        reject(error);
      }
    });
  },
  async editSupplementLinks(supplementId, links) {
    return new Promise(async function (resolve, reject) {
      try {
        // Delete existing links for this supplement
        await db.pool.query(
          `
          DELETE FROM supplementsLinks
          WHERE supplementId = ?
          `,
          [supplementId]
        );

        // Insert new links if any exist
        if (links && links.length > 0) {
          const linkValues = links.map((link) => [
            supplementId,
            link.link,
            link.title,
          ]);
          await db.pool.query(
            `
            INSERT INTO supplementsLinks (supplementId, link, title)
            VALUES ?
            `,
            [linkValues]
          );
        }

        resolve("Success");
      } catch (error) {
        reject(error);
      }
    });
  },
  async editSupplementIngredients(supplementId, ingredients) {
    return new Promise(async function (resolve, reject) {
      try {
        // Delete existing ingredients for this supplement
        await db.pool.query(
          `
          DELETE FROM supplementsIngredients
          WHERE parentId = ?
          `,
          [supplementId]
        );

        // Insert new ingredients if any exist
        if (ingredients && ingredients.length > 0) {
          const ingredientValues = ingredients.map((ingredient) => [
            supplementId,
            ingredient.supplementId,
            ingredient.dosage,
          ]);
          await db.pool.query(
            `
            INSERT INTO supplementsIngredients (parentId, childId, dosage)
            VALUES ?
            `,
            [ingredientValues]
          );
        }

        resolve("Success");
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
  async editSupplement({ userId, id, supplement }) {
    return new Promise(async function (resolve, reject) {
      try {
        const {
          name,
          description,
          defaultDosage,
          unit,
          userId: supplementUserId,
        } = supplement;
        let resultId;

        if (id) {
          // Update existing supplement - verify ownership first
          const [existing] = await db.pool.query(
            `
            SELECT userId FROM supplements WHERE id = ?
            `,
            [id]
          );

          if (existing.length === 0) {
            reject(new Error("Supplement not found"));
            return;
          }

          // Only allow edit if userId matches or supplement has no userId (global)
          if (existing[0].userId && existing[0].userId !== userId) {
            reject(new Error("Unauthorized to edit this supplement"));
            return;
          }

          await db.pool.query(
            `
            UPDATE supplements
            SET name = ?,
                description = ?,
                defaultDosage = ?,
                unit = ?,
                userId = ?
            WHERE id = ? AND (userId = ? OR userId IS NULL)
            `,
            [
              name,
              description,
              defaultDosage,
              unit,
              supplementUserId,
              id,
              userId,
            ]
          );
          resultId = id;
        } else {
          // Insert new supplement
          const [result] = await db.pool.query(
            `
            INSERT INTO supplements (userId, name, description, defaultDosage, unit)
            VALUES (?, ?, ?, ?, ?)
            `,
            [userId, name, description, defaultDosage, unit]
          );
          resultId = result.insertId;
        }

        resolve(resultId);
      } catch (error) {
        reject(error);
      }
    });
  },
  async deleteSupplement(userId, supplementId) {
    return new Promise(async function (resolve, reject) {
      try {
        // Verify ownership before deleting
        const [existing] = await db.pool.query(
          `
          SELECT userId FROM supplements WHERE id = ?
          `,
          [supplementId]
        );

        if (existing.length === 0) {
          reject(new Error("Supplement not found"));
          return;
        }

        // Only allow delete if userId matches (don't allow deleting global supplements)
        if (!existing[0].userId || existing[0].userId !== userId) {
          reject(new Error("Unauthorized to delete this supplement"));
          return;
        }

        await db.pool.query(
          `
          DELETE FROM supplements
          WHERE id = ? AND userId = ?
          `,
          [supplementId, userId]
        );

        resolve({ message: "Supplement deleted successfully" });
      } catch (error) {
        reject(error);
      }
    });
  },
  async getSupplementsLinks() {
    return new Promise(async function (resolve, reject) {
      try {
        const [result] = await db.pool.query(
          `
          SELECT
            id,
            supplementId,
            link,
            title
          FROM supplementsLinks
          `
        );
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  },
};

module.exports = supplementFunctions;
