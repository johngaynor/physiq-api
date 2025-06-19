const mysql = require("mysql2/promise");
const config = require("./index");

const pool = mysql.createPool(config.mySQLConfig);

/**
 * Safe query wrapper:
 * - Validates connection with a ping
 * - Retries failed queries up to 3 times
 */
async function safeQuery(sql, params = [], retries = 2) {
  let attempt = 0;

  while (attempt <= retries) {
    let conn;
    try {
      conn = await pool.getConnection();

      // 🔍 Validate the connection
      await conn.ping();

      // 🧠 Run your actual query
      const [rows] = await conn.query(sql, params);
      return rows;
    } catch (err) {
      const retriable =
        err.code === "ECONNRESET" ||
        err.code === "PROTOCOL_CONNECTION_LOST" ||
        err.code === "ETIMEDOUT";

      console.warn(
        `Query attempt ${attempt + 1} failed${
          retriable ? ", retrying..." : ""
        }`,
        err.code || err.message
      );

      if (!retriable || attempt === retries) {
        throw err;
      }
    } finally {
      if (conn) conn.release();
    }

    attempt++;
    await new Promise((res) => setTimeout(res, 500)); // small backoff
  }
}

module.exports = {
  pool,
  query: safeQuery,
};
