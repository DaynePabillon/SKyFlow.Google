-- Migration: Add onboarding fields to users table
-- Date: 2025-12-13

-- Add onboarding_completed column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Add onboarding_data column for storing user preferences
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS onboarding_data JSONB;

-- Update existing users to have onboarding_completed = true (they've already used the system)
-- Comment this out if you want existing users to go through onboarding
-- UPDATE users SET onboarding_completed = true WHERE created_at < NOW();
