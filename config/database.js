const mysql = require("mysql2/promise");
const config = require("./index");

const mysqlPool = mysql.createPool(config.mySQLConfig);

mysqlPool
  .getConnection()
  .then((conn) => {
    console.log(`Connected to ${config.mySQLConfig.database} Database`);
    conn.release();
  })
  .catch((err) => {
    console.error("Initial MySQL connection failed:", err);
  });

module.exports = mysqlPool;
