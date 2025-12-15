const { Pool } = require('pg');

const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'SkyFlow_Db',
    user: 'postgres',
    password: 'lovejesus123day'
});

async function resetOnboarding() {
    try {
        const email = 'waynepabillon667@gmail.com';

        // Reset onboarding for the user
        const updateResult = await pool.query(
            `UPDATE users 
       SET onboarding_completed = FALSE, onboarding_data = NULL 
       WHERE email = $1
       RETURNING id, email, name, onboarding_completed`,
            [email]
        );

        if (updateResult.rows.length > 0) {
            console.log('✅ Onboarding reset successfully for:');
            console.log(updateResult.rows[0]);
        } else {
            console.log('❌ User not found with email:', email);
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

resetOnboarding();
