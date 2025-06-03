const mysql = require("mysql2/promise");
const config = require("./index");

const mysqlPool = mysql.createPool(config.mySQLConfig);

mysqlPool
  .getConnection()
  .then(() => console.log("Connected to MySQL Database"))
  .catch((err) => {
    console.error("MySQL Database Connection Failed! Bad Config: ", err);
    process.exit(1);
  });

module.exports = mysqlPool;
