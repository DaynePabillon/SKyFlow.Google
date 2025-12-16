require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'skyflow_db',
    user: process.env.DB_USER || 'skyflow_user',
    password: process.env.DB_PASSWORD || 'skyflow_password'
});

async function listUsers() {
    try {
        const result = await pool.query(`
      SELECT u.email, om.role, o.name as org_name 
      FROM users u 
      LEFT JOIN organization_members om ON u.id = om.user_id
      LEFT JOIN organizations o ON om.organization_id = o.id
      ORDER BY u.email
    `);

        console.log('All users and their roles:');
        result.rows.forEach(row => {
            console.log('  -', row.email, ':', row.role || 'no org', '-', row.org_name || '');
        });

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

listUsers();
