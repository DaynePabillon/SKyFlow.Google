const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'SkyFlow_Db',
  user: 'postgres',
  password: 'lovejesus123day' // Update this to match your PostgreSQL password
});

async function createUsersTable() {
  try {
    console.log('Creating users table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        google_id VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        profile_picture TEXT,
        access_token TEXT,
        refresh_token TEXT,
        token_expiry TIMESTAMP,
        role VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      )
    `);
    
    console.log('✅ Users table created successfully!');
    
    // Verify table was created
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('\nUsers table columns:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    console.log('\n✅ Setup complete! You can now sign in with Google.');
    
  } catch (error) {
    console.error('❌ Error creating users table:', error.message);
    console.error('\nMake sure:');
    console.error('1. UUID extension is enabled (run: node enable-uuid.js)');
    console.error('2. PostgreSQL is running');
    console.error('3. Password in this script matches your PostgreSQL password');
  } finally {
    await pool.end();
  }
}

createUsersTable();
