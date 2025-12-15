const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'SkyFlow_DB',
  user: 'postgres',
  password: '019435'
});

async function resetUserOnboarding() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Resetting onboarding status for waynepabillon667@gmail.com...');
    
    // Reset onboarding_completed to false and clear onboarding_data
    const result = await client.query(`
      UPDATE users 
      SET onboarding_completed = false,
          onboarding_data = NULL
      WHERE email = 'waynepabillon667@gmail.com'
      RETURNING id, name, email, onboarding_completed, onboarding_data;
    `);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('✅ User onboarding status reset successfully!');
      console.log('\n📊 User Details:');
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Name: ${user.name}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Onboarding Completed: ${user.onboarding_completed}`);
      console.log(`   - Onboarding Data: ${user.onboarding_data || 'NULL'}`);
      console.log('\n✅ User will now see the onboarding flow on next login!');
    } else {
      console.log('❌ User not found with email: waynepabillon667@gmail.com');
    }
    
  } catch (error) {
    console.error('❌ Reset failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

resetUserOnboarding()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
