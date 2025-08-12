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
};

module.exports = exerciseFunctions;
