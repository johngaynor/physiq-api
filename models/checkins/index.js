const db = require("../../config/database");

const checkInFunctions = {
  async getCheckIns(userId) {
    return new Promise(async function (resolve, reject) {
      try {
        const [result] = await db.query(
          `
           select * from checkIns where userId = (select id from apiUsers where clerkId = ?)
        `,
          [userId]
        );
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  },
};

module.exports = checkInFunctions;
