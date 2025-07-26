const mysql = require("mysql2/promise");
const config = require("./index");

const pool = mysql.createPool(config.mySQLConfig);

async function query(sql, params = []) {
  const connection = await mysql.createConnection(config.mySQLConfig);
  try {
    return await connection.query(sql, params);
  } catch (err) {
    console.error("Direct connection query failed:", err);
    throw err;
  } finally {
    await connection.end(); // Close the connection after each use
  }
}

module.exports = { query, pool };
