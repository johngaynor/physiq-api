const config = {
  mySQLConfig: {
    host: process.env.MYSQL_CONNECTION_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: process.env.MYSQL_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000,
    idleTimeout: 60000,
  },
  ouraIntegrationApiKey: process.env.OURA_INTEGRATION_API_KEY,
};

module.exports = config;
