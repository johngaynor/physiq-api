const mysql = require("mysql2/promise");
const config = require("./index");

const pool = mysql.createPool(config.mySQLConfig);

pool
  .getConnection()
  .then((conn) => {
    console.log(`Connected to ${config.mySQLConfig.database} Database`);
    conn.release();
  })
  .catch((err) => {
    console.error("Initial MySQL connection failed:", err);
  });

async function query(query, params = []) {
  const connection = await pool.getConnection();
  try {
    await connection.ping(); // optional but helps detect stale sockets
    console.log("Successfully pinged the database");
    return await connection.query(query, params);
  } catch (err) {
    console.error("Query failed:", err);
    throw err;
  } finally {
    connection.release();
  }
}

module.exports = { pool, query };
