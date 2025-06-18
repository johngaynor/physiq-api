const config = {
  mySQLConfig: {
    connectionLimit: 5,
    host: process.env.MYSQL_CONNECTION_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: process.env.MYSQL_PORT,
    waitForConnections: true,
    queueLimit: 0,
    connectTimeout: 10000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  },
  ouraIntegrationApiKey: process.env.OURA_INTEGRATION_API_KEY,
};

module.exports = config;
