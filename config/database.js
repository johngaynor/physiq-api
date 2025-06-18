const mysql = require("mysql2/promise");
const config = require("./index");

const mysqlPool = mysql.createPool(config.mySQLConfig);

const pool = mysqlPool
  .getConnection()
  .then((conn) => {
    conn.release();
    console.log(`Connected to ${config.mySQLConfig.database} Database`);
    return mysqlPool;
  })
  .catch((err) => {
    console.error("MySQL Database Connection Failed! Bad Config: ", err);
    process.exit(1);
  });

module.exports = pool;
