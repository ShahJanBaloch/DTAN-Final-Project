// const app = require('./app');
const app = require('../app');
const { testConnection } = require('./config/db');

const PORT = process.env.PORT || 5000;

// Start Express Server
const server = app.listen(PORT, async () => {
  console.log('====================================================');
  console.log(`   🎨 BalochHunar — Artisan Platform Backend Server     `);
  console.log('====================================================');
  console.log(`🚀 Server running on: http://localhost:${PORT}`);
  console.log(`🩺 Health check URL:  http://localhost:${PORT}/api/health`);
  console.log(`📁 Static uploads at: http://localhost:${PORT}/uploads`);
  console.log(`🌐 Public Website at: http://localhost:${PORT}/public/index.html`);
  console.log(`🔐 Admin Panel at:    http://localhost:${PORT}/admin/login.html`);
  console.log('----------------------------------------------------');

  // Verify MySQL database connection
  await testConnection();
  console.log('====================================================');
});

// Handle unhandled promise rejections gracefully
process.on('unhandledRejection', (err) => {
  console.error(`[Unhandled Rejection] ${err.message}`);
  // Keep server running in development or close gracefully
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error(`[Uncaught Exception] ${err.message}`);
  process.exit(1);
});
