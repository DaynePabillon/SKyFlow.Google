require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'skyflow_db',
    user: process.env.DB_USER || 'skyflow_user',
    password: process.env.DB_PASSWORD || 'skyflow_password'
});

async function resetOnboarding() {
    const email = process.argv[2] || 'waynepabillon667@gmail.com';

    try {
        const result = await pool.query(
            `UPDATE users 
             SET onboarding_completed = false, 
                 onboarding_data = NULL, 
                 updated_at = NOW() 
             WHERE email = $1 
             RETURNING email, onboarding_completed`,
            [email]
        );

        if (result.rows.length === 0) {
            console.log('❌ No user found with email:', email);
        } else {
            console.log('✅ Reset onboarding for:', result.rows[0].email);
            console.log('   onboarding_completed:', result.rows[0].onboarding_completed);
        }
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

resetOnboarding();
