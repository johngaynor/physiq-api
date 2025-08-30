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
            LEFT JOIN exercisesUnits pu ON e.defaultPrimaryUnit = pu.id
            LEFT JOIN exercisesUnits su ON e.defaultSecondaryUnit = su.id
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

  async editExercise({ id, name, defaultPrimaryUnit, defaultSecondaryUnit }) {
    return new Promise(async function (resolve, reject) {
      try {
        let returnId = id;

        if (id) {
          // Update existing exercise
          const [result] = await db.pool.query(
            `
              UPDATE exercises
              SET name = ?, defaultPrimaryUnit = ?, defaultSecondaryUnit = ?
              WHERE id = ?
            `,
            [name, defaultPrimaryUnit, defaultSecondaryUnit, id]
          );

          if (result.affectedRows === 0) {
            reject(new Error("Exercise not found"));
            return;
          }
        } else {
          // Insert new exercise
          const [result] = await db.pool.query(
            `
              INSERT INTO exercises (name, defaultPrimaryUnit, defaultSecondaryUnit)
              VALUES (?, ?, ?)
            `,
            [name, defaultPrimaryUnit, defaultSecondaryUnit]
          );

          returnId = result.insertId;
        }

        // Select and return the complete exercise object with units and targets
        const [exercise] = await db.pool.query(
          `
            SELECT
                e.id,
                e.name,
                pu.name AS primaryUnitType,
                su.name AS secondaryUnitType
            FROM exercises e
            LEFT JOIN exerciseUnits pu ON e.defaultPrimaryUnit = pu.id
            LEFT JOIN exerciseUnits su ON e.defaultSecondaryUnit = su.id
            WHERE e.id = ?
          `,
          [returnId]
        );

        if (!exercise.length) {
          reject(new Error("Failed to retrieve exercise"));
          return;
        }

        // Get targets for this exercise
        const [targets] = await db.pool.query(
          `
            SELECT
                eto.name AS targetName
            FROM exercisesTargets et
            JOIN exercisesTargetsOptions eto ON et.targetId = eto.id
            WHERE et.exerciseId = ?
            ORDER BY eto.name
          `,
          [returnId]
        );

        const exerciseWithTargets = {
          ...exercise[0],
          targets: targets.map((target) => target.targetName),
        };

        resolve(exerciseWithTargets);
      } catch (error) {
        reject(error);
      }
    });
  },
};

module.exports = exerciseFunctions;
