const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'SkyFlow_DB',
  user: 'postgres',
  password: '019435'
});

async function addMemberToOrganization() {
  try {
    const adminEmail = 'waynepabillon667@gmail.com';
    const memberEmail = 'saluspupuli@gmail.com';

    // Get admin's organization
    console.log('Finding admin user and organization...');
    const adminRes = await pool.query(
      `SELECT u.id as user_id, om.organization_id, o.name as org_name
       FROM users u
       JOIN organization_members om ON u.id = om.user_id
       JOIN organizations o ON om.organization_id = o.id
       WHERE u.email = $1 AND om.role = 'admin'
       LIMIT 1`,
      [adminEmail]
    );

    if (adminRes.rows.length === 0) {
      console.log('❌ Admin user or organization not found');
      await pool.end();
      return;
    }

    const { organization_id, org_name } = adminRes.rows[0];
    console.log('✅ Found organization:', org_name, '(' + organization_id + ')');

    // Check if member user exists
    console.log('\nChecking if member user exists...');
    let memberRes = await pool.query(
      'SELECT id, email, name FROM users WHERE email = $1',
      [memberEmail]
    );

    let memberId;
    if (memberRes.rows.length === 0) {
      console.log('⚠️  User does not exist yet. They will need to sign in with Google first.');
      console.log('Creating a placeholder invitation...');
      
      // Create an invitation token
      const crypto = require('crypto');
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await pool.query(
        `INSERT INTO organization_invitations (organization_id, email, role, token, invited_by, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (organization_id, email) 
         DO UPDATE SET token = EXCLUDED.token, expires_at = EXCLUDED.expires_at`,
        [organization_id, memberEmail, 'member', token, adminRes.rows[0].user_id, expiresAt]
      );

      console.log('✅ Invitation created for', memberEmail);
      console.log('📧 When they sign in with Google, they will automatically be added to the organization');
      console.log('\nInvitation token:', token);
      console.log('Expires:', expiresAt.toISOString());
      
    } else {
      memberId = memberRes.rows[0].id;
      console.log('✅ Found user:', memberRes.rows[0].name, '(' + memberEmail + ')');

      // Check if already a member
      const existingMember = await pool.query(
        'SELECT * FROM organization_members WHERE organization_id = $1 AND user_id = $2',
        [organization_id, memberId]
      );

      if (existingMember.rows.length > 0) {
        console.log('⚠️  User is already a member of this organization');
        console.log('Current role:', existingMember.rows[0].role);
        console.log('Status:', existingMember.rows[0].status);
      } else {
        // Add as member
        await pool.query(
          `INSERT INTO organization_members (organization_id, user_id, role, status, joined_at)
           VALUES ($1, $2, $3, $4, NOW())`,
          [organization_id, memberId, 'member', 'active']
        );

        console.log('✅ Added', memberEmail, 'as member to', org_name);
      }
    }

    console.log('\n🎉 Done!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

addMemberToOrganization();
