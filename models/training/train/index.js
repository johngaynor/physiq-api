const db = require("../../../config/database");

const trainFunctions = {
  async getSessions(userId) {
    return new Promise(async function (resolve, reject) {
      try {
        const [sessions] = await db.query(
          "SELECT * FROM sessions WHERE userId = ?",
          [userId]
        );

        // 2. get exercises for all sessions
        const sessionIds = sessions.map((s) => s.id);
        const [exercises] = await db.query(
          "SELECT * FROM sessionsExercises WHERE sessionId IN (?)",
          [sessionIds]
        );

        // 3. get sets for all exercises
        const exerciseIds = exercises.map((se) => se.id);
        const [sets] = await db.query(
          "SELECT * FROM sessionsExercisesSets WHERE sessionExerciseId IN (?)",
          [exerciseIds]
        );

        console.log({ sessions, exercises, sets });

        const mappedSessions = sessions.map((session) => {
          return {
            ...session,
            exercises: exercises
              .filter((ex) => ex.sessionId === session.id)
              .map((ex) => {
                return {
                  ...ex,
                  sets: sets.filter((s) => s.sessionExerciseId === ex.id),
                };
              }),
          };
        });

        resolve(mappedSessions);
      } catch (error) {
        reject(error);
      }
    });
  },
};

module.exports = trainFunctions;
