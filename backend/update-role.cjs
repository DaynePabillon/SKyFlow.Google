require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'skyflow_db',
    user: process.env.DB_USER || 'skyflow_user',
    password: process.env.DB_PASSWORD || 'skyflow_password'
});

async function updateRole() {
    try {
        // Update role back to admin for SkyFlow Team organization
        const updateResult = await pool.query(`
      UPDATE organization_members om
      SET role = 'admin'
      FROM organizations o
      WHERE om.organization_id = o.id 
      AND o.name = 'SkyFlow Team'
      RETURNING *
    `);

        console.log('Updated', updateResult.rowCount, 'rows to admin');

        // Verify
        const verifyResult = await pool.query(`
      SELECT u.email, om.role, o.name as org_name 
      FROM organization_members om 
      JOIN users u ON om.user_id = u.id 
      JOIN organizations o ON om.organization_id = o.id 
      ORDER BY o.name
    `);

        console.log('\nCurrent roles:');
        verifyResult.rows.forEach(row => {
            console.log('  -', row.email, ':', row.role, '-', row.org_name);
        });

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

updateRole();
