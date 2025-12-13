# Database Migration Instructions

## To add onboarding fields to your database:

### Option 1: Using psql command line
```bash
psql -U postgres -d SkyFlow_Db -f database/migrations/add_onboarding_fields.sql
```

### Option 2: Using pgAdmin or any PostgreSQL client
1. Connect to your `SkyFlow_Db` database
2. Open and execute the contents of `add_onboarding_fields.sql`

### Option 3: Quick SQL (copy and paste into your SQL client)
```sql
-- Add onboarding fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboarding_data JSONB;
```

## Verify Migration
After running, verify with:
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('onboarding_completed', 'onboarding_data');
```

You should see both columns listed.
