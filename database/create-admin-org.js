const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'SkyFlow_DB',
  user: 'postgres',
  password: '019435'
});

async function createAdminOrganization() {
  try {
    // Find the user
    const userRes = await pool.query(
      'SELECT id, email, name FROM users WHERE email = $1',
      ['waynepabillon667@gmail.com']
    );

    if (userRes.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }

    const user = userRes.rows[0];
    console.log('✅ Found user:', user.name, '(' + user.email + ')');

    // Create organization
    const orgRes = await pool.query(
      `INSERT INTO organizations (name, description) 
       VALUES ($1, $2) 
       RETURNING id, name`,
      ['SkyFlow Organization', 'Default organization for ' + user.name]
    );

    const org = orgRes.rows[0];
    console.log('✅ Created organization:', org.name, '(' + org.id + ')');

    // Add user as admin
    await pool.query(
      `INSERT INTO organization_members (organization_id, user_id, role, status, joined_at) 
       VALUES ($1, $2, $3, $4, NOW())`,
      [org.id, user.id, 'admin', 'active']
    );

    console.log('✅ Added', user.name, 'as admin to', org.name);
    console.log('\n🎉 Setup complete! You can now sign in and access your organization.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

createAdminOrganization();
