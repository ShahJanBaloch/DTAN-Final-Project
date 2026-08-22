const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function initializeDatabase() {
  console.log('====================================================');
  console.log('  🗄️  BalochHunar Database Initialization & Migration  ');
  console.log('====================================================');

  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: Number(process.env.DB_PORT) || 3306,
    multipleStatements: true
  };

  let connection;

  try {
    console.log(`🔌 Connecting to MySQL server at ${config.host}:${config.port}...`);
    connection = await mysql.createConnection(config);
    console.log('✅ Connected to MySQL server successfully.');

    const sqlFilePath = path.join(__dirname, 'hunarhub.sql');
    console.log(`📄 Reading SQL file: ${sqlFilePath}`);
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('⏳ Executing schema creation and seed insertion...');
    await connection.query(sqlContent);
    console.log('✅ Database `balochhunar_db` and tables created and seeded successfully!');

    // Verify Relational Counts
    await connection.query('USE balochhunar_db;');
    const [categories] = await connection.query('SELECT COUNT(*) as count FROM categories;');
    const [artisans] = await connection.query('SELECT COUNT(*) as count FROM artisans;');
    const [products] = await connection.query('SELECT COUNT(*) as count FROM products;');
    const [services] = await connection.query('SELECT COUNT(*) as count FROM services;');
    const [gallery] = await connection.query('SELECT COUNT(*) as count FROM gallery;');
    const [messages] = await connection.query('SELECT COUNT(*) as count FROM contact_messages;');
    const [users] = await connection.query('SELECT COUNT(*) as count FROM users;');

    console.log('----------------------------------------------------');
    console.log('📊 Verification Summary:');
    console.log(`   - Users (Admins):   ${users[0].count}`);
    console.log(`   - Categories:       ${categories[0].count}`);
    console.log(`   - Artisans:         ${artisans[0].count}`);
    console.log(`   - Products:         ${products[0].count}`);
    console.log(`   - Services:         ${services[0].count}`);
    console.log(`   - Gallery Items:    ${gallery[0].count}`);
    console.log(`   - Contact Messages: ${messages[0].count}`);
    console.log('----------------------------------------------------');
    console.log('🎉 Database initialization complete and ready!');
    console.log('====================================================');
  } catch (error) {
    console.error('❌ Database initialization error:', error.message);
    console.error('💡 Hint: Ensure MySQL/XAMPP is running and credentials in .env are correct.');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run if called directly from CLI
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
