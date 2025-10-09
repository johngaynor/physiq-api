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
            dosage, 
            unit,
            frequency
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
  async editSupplement(userId, supplementData) {
    return new Promise(async function (resolve, reject) {
      try {
        const { id, name, description, dosage, unit, frequency } =
          supplementData;
        let supplementId;

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
                dosage = ?,
                unit = ?,
                frequency = ?
            WHERE id = ? AND (userId = ? OR userId IS NULL)
            `,
            [name, description, dosage, unit, frequency, id, userId]
          );
          supplementId = id;
        } else {
          // Insert new supplement
          const [result] = await db.pool.query(
            `
            INSERT INTO supplements (userId, name, description, dosage, unit, frequency)
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [userId, name, description, dosage, unit, frequency]
          );
          supplementId = result.insertId;
        }

        // Select and return the complete supplement row
        const [supplement] = await db.pool.query(
          `
          SELECT
            id,
            userId,
            name,
            description,
            dosage,
            unit,
            frequency
          FROM supplements
          WHERE id = ?
          `,
          [supplementId]
        );

        resolve(supplement[0]);
      } catch (error) {
        reject(error);
      }
    });
  },
  async getSupplementLinks(supplementId) {
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
          WHERE supplementId = ?
          `,
          [supplementId]
        );
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  },
  async editSupplementLink(userId, linkData) {
    return new Promise(async function (resolve, reject) {
      try {
        const { id, supplementId, link, title } = linkData;
        let linkId;

        // If updating an existing link, verify ownership of the supplement
        if (id) {
          const [existing] = await db.pool.query(
            `
            SELECT sl.id, s.userId
            FROM supplementsLinks sl
            JOIN supplements s ON sl.supplementId = s.id
            WHERE sl.id = ?
            `,
            [id]
          );

          if (existing.length === 0) {
            reject(new Error("Link not found"));
            return;
          }

          // Only allow edit if userId matches the supplement owner
          if (existing[0].userId && existing[0].userId !== userId) {
            reject(new Error("Unauthorized to edit this link"));
            return;
          }

          await db.pool.query(
            `
            UPDATE supplementsLinks
            SET link = ?,
                title = ?
            WHERE id = ?
            `,
            [link, title, id]
          );
          linkId = id;
        } else {
          // For new links, verify ownership of the supplement
          const [supplement] = await db.pool.query(
            `
            SELECT userId FROM supplements WHERE id = ?
            `,
            [supplementId]
          );

          if (supplement.length === 0) {
            reject(new Error("Supplement not found"));
            return;
          }

          if (supplement[0].userId && supplement[0].userId !== userId) {
            reject(new Error("Unauthorized to add link to this supplement"));
            return;
          }

          // Insert new link
          const [result] = await db.pool.query(
            `
            INSERT INTO supplementsLinks (supplementId, link, title)
            VALUES (?, ?, ?)
            `,
            [supplementId, link, title]
          );
          linkId = result.insertId;
        }

        // Select and return the complete link row
        const [linkRow] = await db.pool.query(
          `
          SELECT
            id,
            supplementId,
            link,
            title
          FROM supplementsLinks
          WHERE id = ?
          `,
          [linkId]
        );

        resolve(linkRow[0]);
      } catch (error) {
        reject(error);
      }
    });
  },
  async deleteSupplementLink(userId, linkId) {
    return new Promise(async function (resolve, reject) {
      try {
        // Verify ownership before deleting
        const [existing] = await db.pool.query(
          `
          SELECT sl.id, s.userId
          FROM supplementsLinks sl
          JOIN supplements s ON sl.supplementId = s.id
          WHERE sl.id = ?
          `,
          [linkId]
        );

        if (existing.length === 0) {
          reject(new Error("Link not found"));
          return;
        }

        if (existing[0].userId && existing[0].userId !== userId) {
          reject(new Error("Unauthorized to delete this link"));
          return;
        }

        await db.pool.query(
          `
          DELETE FROM supplementsLinks
          WHERE id = ?
          `,
          [linkId]
        );

        resolve({ message: "Link deleted successfully" });
      } catch (error) {
        reject(error);
      }
    });
  },
};

module.exports = supplementFunctions;
