const db = require("../../config/database");

const phaseFunctions = {
  async getPhases(userId) {
    return new Promise(async function (resolve, reject) {
      try {
        const [result] = await db.pool.query(
          `
          SELECT
            id,
            userId,
            name,
            startDate,
            endDate,
            description
          FROM phases
          WHERE userId = ?
          ORDER BY startDate DESC
          `,
          [userId]
        );
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  },

  async editPhase(userId, phaseData) {
    return new Promise(async function (resolve, reject) {
      try {
        const { id, name, startDate, endDate, description } = phaseData;
        let phaseId;

        if (id) {
          // Update existing phase
          await db.pool.query(
            `
            UPDATE phases
            SET name = ?,
                startDate = ?,
                endDate = ?,
                description = ?
            WHERE id = ? AND userId = ?
            `,
            [name, startDate, endDate, description, id, userId]
          );
          phaseId = id;
        } else {
          // Insert new phase
          const [result] = await db.pool.query(
            `
            INSERT INTO phases (userId, name, startDate, endDate, description)
            VALUES (?, ?, ?, ?, ?)
            `,
            [userId, name, startDate, endDate, description]
          );
          phaseId = result.insertId;
        }

        // Select and return the complete phase row
        const [phase] = await db.pool.query(
          `
          SELECT
            id,
            userId,
            name,
            startDate,
            endDate,
            description
          FROM phases
          WHERE id = ? AND userId = ?
          `,
          [phaseId, userId]
        );

        resolve(phase[0]);
      } catch (error) {
        reject(error);
      }
    });
  },

  async deletePhase(id, userId) {
    return new Promise(async function (resolve, reject) {
      try {
        const [result] = await db.pool.query(
          `
          DELETE FROM phases
          WHERE id = ? AND userId = ?
          `,
          [id, userId]
        );

        if (result.affectedRows === 0) {
          reject(new Error("Phase not found or unauthorized"));
        } else {
          resolve({ message: "Phase deleted successfully" });
        }
      } catch (error) {
        reject(error);
      }
    });
  },
};

module.exports = phaseFunctions;
