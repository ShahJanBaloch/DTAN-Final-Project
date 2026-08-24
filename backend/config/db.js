const mysql = require('mysql2/promise');

// Create a connection pool for Aiven MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  enableKeepAlive: true,
  keepAliveInitialDelay: 0,

  // Aiven MySQL uses TLS/SSL
  ssl: {
    rejectUnauthorized: false
  }
});

/**
 * Test database connectivity
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();

    console.log(
      `[Database] Connected successfully to "${process.env.DB_NAME}" on ${process.env.DB_HOST}`
    );

    connection.release();

    return {
      connected: true,
      message: 'MySQL connection successful'
    };
  } catch (error) {
    console.error(`[Database Error] ${error.message}`);

    return {
      connected: false,
      message: error.message
    };
  }
}

module.exports = {
  pool,
  testConnection
};