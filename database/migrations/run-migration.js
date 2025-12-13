const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'SkyFlow_Db',
  user: 'postgres',
  password: 'lovejesus123day'
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Running migration: Add onboarding fields to users table...');
    
    // Add onboarding_completed column
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
    `);
    console.log('✅ Added onboarding_completed column');
    
    // Add onboarding_data column
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS onboarding_data JSONB;
    `);
    console.log('✅ Added onboarding_data column');
    
    // Verify columns were added
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN ('onboarding_completed', 'onboarding_data');
    `);
    
    console.log('\n📊 Verification:');
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    console.log('\n✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
