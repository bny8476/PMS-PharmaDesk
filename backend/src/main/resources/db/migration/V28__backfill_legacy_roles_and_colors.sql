-- Ensure SYSTEM_ADMIN role exists
INSERT INTO roles (name, is_system_default, permissions_json, is_deleted, color)
SELECT * FROM (SELECT 'SYSTEM_ADMIN', TRUE, '["ALL_PERMISSIONS", "SYSTEM_ADMIN", "APPROVALS", "VIEW_REPORTS", "VIEW_LOGS", "STOCK_MANAGEMENT", "INVENTORY", "BILLING"]', FALSE, '#4f46e5') AS tmp
WHERE NOT EXISTS (SELECT name FROM roles WHERE name = 'SYSTEM_ADMIN') LIMIT 1;

-- Backfill user_roles junction for legacy users
INSERT IGNORE INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u
JOIN roles r ON (
    (u.role = 'ADMIN'         AND r.name = 'SYSTEM_ADMIN') OR
    (u.role = 'MEDICINE_USER' AND r.name = 'PHARMACY_STAFF') OR
    (u.role = 'BILLING_USER'  AND r.name = 'BILLING_STAFF') OR
    (u.role = 'PURCHASE_USER' AND r.name = 'STOREKEEPER')
)
WHERE u.role IS NOT NULL AND u.is_deleted = false;

-- Fix empty color values seeded by V17
UPDATE roles SET color = '#6366f1' WHERE name = 'SUPERVISOR'          AND (color = '' OR color IS NULL);
UPDATE roles SET color = '#14b8a6' WHERE name = 'SENIOR_MEDICAL_STAFF' AND (color = '' OR color IS NULL);
UPDATE roles SET color = '#10b981' WHERE name = 'MEDICAL_STAFF'        AND (color = '' OR color IS NULL);
UPDATE roles SET color = '#f59e0b' WHERE name = 'BILLING_STAFF'        AND (color = '' OR color IS NULL);
UPDATE roles SET color = '#3b82f6' WHERE name = 'PHARMACY_STAFF'       AND (color = '' OR color IS NULL);
UPDATE roles SET color = '#f43f5e' WHERE name = 'RECEPTIONIST'         AND (color = '' OR color IS NULL);
UPDATE roles SET color = '#f97316' WHERE name = 'AUDIT_COMPLIANCE'     AND (color = '' OR color IS NULL);
UPDATE roles SET color = '#06b6d4' WHERE name = 'LAB_TECHNICIAN'       AND (color = '' OR color IS NULL);
UPDATE roles SET color = '#78716c' WHERE name = 'STOREKEEPER'          AND (color = '' OR color IS NULL);
