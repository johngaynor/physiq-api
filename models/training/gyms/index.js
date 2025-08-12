const db = require("../../../config/database");

const gymFunctions = {
  async getGyms() {
    return new Promise(async function (resolve, reject) {
      try {
        const [gyms] = await db.pool.query(
          `
            SELECT
                id,
                name,
                address,
                submittedBy
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

  async editGym({ id, name, address, userId }) {
    return new Promise(async function (resolve, reject) {
      try {
        let returnId = id;

        if (id) {
          // Update existing gym
          const [result] = await db.pool.query(
            `
              UPDATE gyms
              SET name = ?, address = ?
              WHERE id = ?
            `,
            [name, address, id]
          );

          if (result.affectedRows === 0) {
            reject(new Error("Gym not found"));
            return;
          }
        } else {
          // Insert new gym
          const [result] = await db.pool.query(
            `
              INSERT INTO gyms (name, address, submittedBy)
              VALUES (?, ?, ?)
            `,
            [name, address, userId]
          );

          returnId = result.insertId;
        }

        resolve({ id: returnId });
      } catch (error) {
        reject(error);
      }
    });
  },
};

module.exports = gymFunctions;
