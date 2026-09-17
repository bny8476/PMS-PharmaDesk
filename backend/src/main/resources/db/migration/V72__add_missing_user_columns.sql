-- V72: Add missing columns (branch, shift, email, employee_id, profile_photo_url, last_login) to users table

ALTER TABLE users 
ADD COLUMN branch VARCHAR(255) DEFAULT 'Main Branch',
ADD COLUMN shift VARCHAR(100) DEFAULT 'Morning',
ADD COLUMN email VARCHAR(255) DEFAULT NULL,
ADD COLUMN employee_id VARCHAR(100) DEFAULT NULL,
ADD COLUMN profile_photo_url TEXT DEFAULT NULL,
ADD COLUMN last_login DATETIME DEFAULT NULL;
