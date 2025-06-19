const mysql = require("mysql2/promise");
const config = require("./index");

const pool = mysql.createPool(config.mySQLConfig);

// pinging every 30 seconds
setInterval(async () => {
  try {
    await pool.query("SELECT 1");
    console.log("Keep-alive ping successful");
  } catch (err) {
    console.error("Keep-alive ping failed:", err);
  }
}, 30000);

pool.on?.("error", (err) => {
  console.error("MySQL pool error:", err);
});

module.exports = pool;
