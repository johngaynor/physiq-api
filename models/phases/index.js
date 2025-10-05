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
            type,
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
        const { id, name, type, startDate, endDate, description } = phaseData;
        let phaseId;

        // Check for overlapping phases
        // A phase overlaps if:
        // 1. The new phase starts before an existing phase ends AND
        // 2. The new phase ends after an existing phase starts (or has no end date)
        const overlapQuery = id
          ? // For updates, exclude the current phase from the check
            `
            SELECT id, name, startDate, endDate
            FROM phases
            WHERE userId = ?
              AND id != ?
              AND (
                (startDate <= ? AND (endDate IS NULL OR endDate >= ?))
                OR
                (startDate <= ? AND (endDate IS NULL OR endDate >= ?))
                OR
                (startDate >= ? AND (? IS NULL OR endDate <= ?))
              )
            `
          : // For inserts, check all phases
            `
            SELECT id, name, startDate, endDate
            FROM phases
            WHERE userId = ?
              AND (
                (startDate <= ? AND (endDate IS NULL OR endDate >= ?))
                OR
                (startDate <= ? AND (endDate IS NULL OR endDate >= ?))
                OR
                (startDate >= ? AND (? IS NULL OR endDate <= ?))
              )
            `;

        const overlapParams = id
          ? [
              userId,
              id,
              startDate,
              startDate,
              endDate || startDate,
              endDate || startDate,
              startDate,
              endDate,
              endDate,
            ]
          : [
              userId,
              startDate,
              startDate,
              endDate || startDate,
              endDate || startDate,
              startDate,
              endDate,
              endDate,
            ];

        const [overlappingPhases] = await db.pool.query(
          overlapQuery,
          overlapParams
        );

        if (overlappingPhases.length > 0) {
          const overlapDetails = overlappingPhases
            .map((phase) => {
              const formatDate = (date) => {
                if (!date) return "ongoing";
                return new Date(date).toISOString().split("T")[0];
              };
              return `"${phase.name}" (${formatDate(
                phase.startDate
              )} to ${formatDate(phase.endDate)})`;
            })
            .join(", ");

          reject(
            new Error(
              `Phase dates overlap with existing phase(s): ${overlapDetails}`
            )
          );
          return;
        }

        if (id) {
          // Update existing phase
          await db.pool.query(
            `
            UPDATE phases
            SET name = ?,
                type = ?,
                startDate = ?,
                endDate = ?,
                description = ?
            WHERE id = ? AND userId = ?
            `,
            [name, type, startDate, endDate, description, id, userId]
          );
          phaseId = id;
        } else {
          // Insert new phase
          const [result] = await db.pool.query(
            `
            INSERT INTO phases (userId, name, type, startDate, endDate, description)
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [userId, name, type, startDate, endDate, description]
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
            type,
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
