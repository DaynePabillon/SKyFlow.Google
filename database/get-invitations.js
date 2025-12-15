const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'SkyFlow_Db',
    user: 'postgres',
    password: 'lovejesus123day'
});

async function getInvitations() {
    try {
        const result = await pool.query(`
      SELECT oi.email, oi.role, oi.token, o.name as organization_name, oi.expires_at
      FROM organization_invitations oi
      JOIN organizations o ON oi.organization_id = o.id
      WHERE oi.accepted_at IS NULL AND oi.expires_at > NOW()
      ORDER BY oi.created_at DESC
    `);

        console.log('\n📧 Pending Invitations:\n');

        if (result.rows.length === 0) {
            console.log('No pending invitations found.');
        } else {
            result.rows.forEach((inv, i) => {
                console.log(`${i + 1}. ${inv.email}`);
                console.log(`   Organization: ${inv.organization_name}`);
                console.log(`   Role: ${inv.role}`);
                console.log(`   Expires: ${new Date(inv.expires_at).toLocaleString()}`);
                console.log(`   🔗 Invite Link: http://localhost:3000/invite/accept?token=${inv.token}`);
                console.log('');
            });
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

getInvitations();
