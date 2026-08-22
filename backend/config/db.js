const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Create a connection pool for MySQL
// Using a pool avoids opening and closing connections on every query
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'balochhunar_db',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

/**
 * Test database connectivity
 * Useful during application startup and health check verification
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`[Database] Connected successfully to MySQL database "${process.env.DB_NAME || 'balochhunar_db'}" on ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
    connection.release();
    return { connected: true, message: 'MySQL connection successful' };
  } catch (error) {
    console.warn(`[Database Warning] Could not connect to MySQL database: ${error.message}`);
    console.warn(`[Database Hint] Ensure MySQL/XAMPP is running and "${process.env.DB_NAME || 'balochhunar_db'}" database exists. Run npm run db:init to create it.`);
    return { connected: false, message: error.message };
  }
}

module.exports = {
  pool,
  testConnection
};
