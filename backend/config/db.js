const mysql = require('mysql2/promise');

const useTls = process.env.DB_SSL !== 'false';

// A pooled connection is reused across Vercel invocations when the instance stays warm.
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'balochhunar_db',
  port: Number(process.env.DB_PORT) || 3306,

  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 5,
  queueLimit: 0,
  connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT) || 10000,

  enableKeepAlive: true,
  keepAliveInitialDelay: 0,

  ssl: useTls
    ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true' }
    : undefined
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