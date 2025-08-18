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
};

module.exports = gymFunctions;
