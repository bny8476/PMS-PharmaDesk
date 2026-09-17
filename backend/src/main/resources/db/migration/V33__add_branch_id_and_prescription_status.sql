ALTER TABLE sales_bills ADD COLUMN branch_id BIGINT NOT NULL DEFAULT 1;
ALTER TABLE medicine_stocks ADD COLUMN branch_id BIGINT NOT NULL DEFAULT 1;
ALTER TABLE purchase_orders ADD COLUMN branch_id BIGINT NOT NULL DEFAULT 1;
ALTER TABLE patients ADD COLUMN branch_id BIGINT NOT NULL DEFAULT 1;
ALTER TABLE pharmacy_advances ADD COLUMN branch_id BIGINT NOT NULL DEFAULT 1;

-- For prescription verification workflow
ALTER TABLE prescriptions ADD COLUMN verification_status VARCHAR(50) NOT NULL DEFAULT 'UNVERIFIED';
ALTER TABLE prescriptions ADD COLUMN verified_by VARCHAR(100);
ALTER TABLE prescriptions ADD COLUMN verified_at DATETIME;
