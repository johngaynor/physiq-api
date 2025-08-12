const db = require("../../../config/database");

const exerciseFunctions = {
  async getExercises() {
    return new Promise(async function (resolve, reject) {
      try {
        const [exercises] = await db.pool.query(
          `
            SELECT
                id,
                name
            FROM exercises
          `
        );

        resolve(exercises);
      } catch (error) {
        reject(error);
      }
    });
  },

  async deleteExercise(exerciseId) {
    return new Promise(async function (resolve, reject) {
      try {
        const [result] = await db.pool.query(
          `
            DELETE FROM exercises
            WHERE id = ?
          `,
          [exerciseId]
        );

        if (result.affectedRows === 0) {
          reject(new Error("Exercise not found"));
          return;
        }

        resolve("Success");
      } catch (error) {
        reject(error);
      }
    });
  },

  async editExercise({ id, name }) {
    return new Promise(async function (resolve, reject) {
      try {
        let returnId = id;

        if (id) {
          // Update existing exercise
          const [result] = await db.pool.query(
            `
              UPDATE exercises
              SET name = ?
              WHERE id = ?
            `,
            [name, id]
          );

          if (result.affectedRows === 0) {
            reject(new Error("Exercise not found"));
            return;
          }
        } else {
          // Insert new exercise
          const [result] = await db.pool.query(
            `
              INSERT INTO exercises (name)
              VALUES (?)
            `,
            [name]
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

module.exports = exerciseFunctions;
