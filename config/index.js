const config = {
  mySQLConfig: {
    host: process.env.MYSQL_CONNECTION_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: Number(process.env.MYSQL_PORT),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 10000, // 10 seconds to connect
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000, // 10 seconds before first keep-alive packet
  },
  ouraIntegrationApiKey: process.env.OURA_INTEGRATION_API_KEY,
};

module.exports = config;
