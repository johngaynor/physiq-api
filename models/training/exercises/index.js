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

        // Get default machine configurations for all exercises
        const [machineConfigs] = await db.pool.query(
          `
            SELECT
                id,
                exerciseId,
                description,
                s3Filename,
                createdBy,
                lastUpdated
            FROM exercisesMachines
            WHERE gymId IS NULL AND brandId IS NULL
            ORDER BY exerciseId, id
          `
        );

        // Map targets and machine configurations to exercises
        const exercisesWithTargetsAndConfigs = exercises.map((exercise) => {
          const exerciseTargets = targets
            .filter((target) => target.exerciseId === exercise.id)
            .map((target) => target.targetName);

          // Find the first default configuration for this exercise
          const defaultConfiguration =
            machineConfigs.find(
              (config) => config.exerciseId === exercise.id
            ) || null;

          return {
            ...exercise,
            targets: exerciseTargets,
            defaultConfiguration: defaultConfiguration,
          };
        });

        resolve(exercisesWithTargetsAndConfigs);
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

  async editExercise({
    id,
    name,
    defaultPrimaryUnit,
    defaultSecondaryUnit,
    targets,
  }) {
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

        // Handle targets if provided
        if (targets && Array.isArray(targets)) {
          // Clear existing targets for this exercise
          await db.pool.query(
            `
              DELETE FROM exercisesTargets
              WHERE exerciseId = ?
            `,
            [returnId]
          );

          // Insert new targets if any are provided
          if (targets.length > 0) {
            // Filter out invalid target IDs and remove duplicates
            const validTargets = [
              ...new Set(
                targets.filter(
                  (targetId) => targetId && Number.isInteger(Number(targetId))
                )
              ),
            ];

            if (validTargets.length > 0) {
              const targetValues = validTargets.map((targetId) => [
                returnId,
                Number(targetId),
              ]);

              await db.pool.query(
                `
                  INSERT INTO exercisesTargets (exerciseId, targetId)
                  VALUES ?
                `,
                [targetValues]
              );
            }
          }
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
            LEFT JOIN exercisesUnits pu ON e.defaultPrimaryUnit = pu.id
            LEFT JOIN exercisesUnits su ON e.defaultSecondaryUnit = su.id
            WHERE e.id = ?
          `,
          [returnId]
        );

        if (!exercise.length) {
          reject(new Error("Failed to retrieve exercise"));
          return;
        }

        // Get targets for this exercise
        const [exerciseTargets] = await db.pool.query(
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

        // Get default machine configuration for this exercise
        const [machineConfig] = await db.pool.query(
          `
            SELECT
                id,
                exerciseId,
                description,
                s3Filename,
                createdBy,
                lastUpdated
            FROM exercisesMachines
            WHERE exerciseId = ? AND gymId IS NULL AND brandId IS NULL
            ORDER BY id
            LIMIT 1
          `,
          [returnId]
        );

        const exerciseWithTargetsAndConfig = {
          ...exercise[0],
          targets: exerciseTargets.map((target) => target.targetName),
          defaultConfiguration:
            machineConfig.length > 0 ? machineConfig[0] : null,
        };

        resolve(exerciseWithTargetsAndConfig);
      } catch (error) {
        reject(error);
      }
    });
  },
};

module.exports = exerciseFunctions;
