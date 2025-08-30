const db = require("../../../config/database");

const exerciseFunctions = {
  async getExercises() {
    return new Promise(async function (resolve, reject) {
      try {
        const [exercises] = await db.pool.query(
          `
            SELECT
                e.id,
                e.name,
                pu.name AS primaryUnitType,
                su.name AS secondaryUnitType
            FROM exercises e
            LEFT JOIN exerciseUnits pu ON e.defaultPrimaryUnit = pu.id
            LEFT JOIN exerciseUnits su ON e.defaultSecondaryUnit = su.id
          `
        );

        // Get targets for all exercises
        const [targets] = await db.pool.query(
          `
            SELECT
                et.exerciseId,
                eto.name AS targetName
            FROM exercisesTargets et
            JOIN exercisesTargetsOptions eto ON et.targetId = eto.id
            ORDER BY et.exerciseId, eto.name
          `
        );

        // Map targets to exercises
        const exercisesWithTargets = exercises.map((exercise) => {
          const exerciseTargets = targets
            .filter((target) => target.exerciseId === exercise.id)
            .map((target) => target.targetName);

          return {
            ...exercise,
            targets: exerciseTargets,
          };
        });

        resolve(exercisesWithTargets);
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

  async getExerciseUnits() {
    return new Promise(async function (resolve, reject) {
      try {
        const [exerciseUnits] = await db.pool.query(
          `
            SELECT
                id,
                name,
                measurement
            FROM exerciseUnits
          `
        );

        resolve(exerciseUnits);
      } catch (error) {
        reject(error);
      }
    });
  },
};

module.exports = exerciseFunctions;
