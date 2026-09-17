-- V72: Add missing columns (branch, shift, email, employee_id, profile_photo_url, last_login) to users table

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS branch VARCHAR(255) DEFAULT 'Main Branch',
ADD COLUMN IF NOT EXISTS shift VARCHAR(100) DEFAULT 'Morning',
ADD COLUMN IF NOT EXISTS email VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS employee_id VARCHAR(100) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS profile_photo_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS last_login DATETIME DEFAULT NULL;
