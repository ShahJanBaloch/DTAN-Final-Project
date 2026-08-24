const dotenv = require('dotenv');
const path = require('path');

// Load local environment variables
dotenv.config({
  path: path.join(__dirname, '../.env')
});

// Import root Express app
const app = require('../app');

// Database connection test
const { testConnection } = require('./config/db');

const PORT = process.env.PORT || 5000;

// Start server only for local development
const server = app.listen(PORT, async () => {
  console.log('====================================================');
  console.log('   BalochHunar — Artisan Platform Backend Server');
  console.log('====================================================');
  console.log(`Server running at: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Public website: http://localhost:${PORT}/`);
  console.log(`Admin panel: http://localhost:${PORT}/admin-login`);
  console.log('----------------------------------------------------');

  await testConnection();

  console.log('====================================================');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(
    `[Unhandled Rejection] ${err.message}`
  );

  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(
    `[Uncaught Exception] ${err.message}`
  );

  process.exit(1);
});