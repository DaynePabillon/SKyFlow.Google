const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'SkyFlow_Db',
  user: 'postgres',
  password: 'lowensaga' // Update this to match your PostgreSQL password
});

async function enableUuidExtension() {
  try {
    console.log('Enabling UUID extension...');
    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✅ UUID extension enabled successfully!');
    console.log('\nYou can now run the setup scripts:');
    console.log('  node create-missing-tables.js');
    console.log('  node setup-db.js');
  } catch (error) {
    console.error('❌ Error enabling UUID extension:', error.message);
    console.error('\nMake sure:');
    console.error('1. PostgreSQL is running');
    console.error('2. Database "SkyFlow_Db" exists');
    console.error('3. Password in this script matches your PostgreSQL password');
  } finally {
    await pool.end();
  }
}

enableUuidExtension();
