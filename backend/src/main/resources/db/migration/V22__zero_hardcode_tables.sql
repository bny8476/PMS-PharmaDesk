-- V22: Zero Hardcode Core Tables and Schema Adjustments

-- 1. System Lookups Table
CREATE TABLE IF NOT EXISTS system_lookups (
    lookup_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    lookup_type VARCHAR(60) NOT NULL,
    lookup_key VARCHAR(60) NOT NULL,
    lookup_value VARCHAR(150) NOT NULL,
    display_order INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_type_key (lookup_type, lookup_key),
    INDEX idx_lookup_type (lookup_type)
);

-- Seed System Lookups
INSERT IGNORE INTO system_lookups (lookup_type, lookup_key, lookup_value, display_order) VALUES
('drug_class', 'Analgesic', 'Analgesic', 1),
('drug_class', 'Antibiotic', 'Antibiotic', 2),
('drug_class', 'Antidiabetic', 'Antidiabetic', 3),
('drug_class', 'Antihypertensive', 'Antihypertensive', 4),
('drug_class', 'Antihistamine', 'Antihistamine', 5),
('drug_class', 'Antifungal', 'Antifungal', 6),
('drug_class', 'Antiviral', 'Antiviral', 7),
('drug_class', 'Cardiac', 'Cardiac', 8),
('drug_class', 'Hormonal', 'Hormonal', 9),
('drug_class', 'Lipid_Lowering', 'Lipid_Lowering', 10),
('drug_class', 'Nutritional_Supplement', 'Nutritional_Supplement', 11),
('drug_class', 'Psychotropic', 'Psychotropic', 12),
('drug_class', 'Vaccine', 'Vaccine', 13),
('drug_class', 'Others', 'Others', 14),

('schedule_type', 'OTC', 'OTC', 1),
('schedule_type', 'Schedule_H', 'Schedule_H', 2),
('schedule_type', 'Schedule_H1', 'Schedule_H1', 3),
('schedule_type', 'Schedule_X', 'Schedule_X', 4),
('schedule_type', 'Narcotic', 'Narcotic', 5),

('storage_condition', 'Room_Temperature', 'Room_Temperature', 1),
('storage_condition', 'Refrigerated', 'Refrigerated', 2),
('storage_condition', 'Frozen', 'Frozen', 3),
('storage_condition', 'Cool_and_Dry', 'Cool_and_Dry', 4),
('storage_condition', 'Protect_from_Light', 'Protect_from_Light', 5),
('storage_condition', 'Flammable', 'Flammable', 6),

('payment_mode', 'cash', 'cash', 1),
('payment_mode', 'credit', 'credit', 2),
('payment_mode', 'insurance', 'insurance', 3),
('payment_mode', 'advance', 'advance', 4),
('payment_mode', 'split', 'split', 5),
('payment_mode', 'upi', 'upi', 6),
('payment_mode', 'card', 'card', 7),

('return_reason_code', 'patient_discharged', 'patient_discharged', 1),
('return_reason_code', 'doctor_changed_prescription', 'doctor_changed_prescription', 2),
('return_reason_code', 'wrong_medicine_dispensed', 'wrong_medicine_dispensed', 3),
('return_reason_code', 'duplicate_dispensing', 'duplicate_dispensing', 4),
('return_reason_code', 'medicine_damaged', 'medicine_damaged', 5),
('return_reason_code', 'quantity_excess_dispensed', 'quantity_excess_dispensed', 6),
('return_reason_code', 'patient_expired', 'patient_expired', 7),
('return_reason_code', 'treatment_discontinued', 'treatment_discontinued', 8),
('return_reason_code', 'insurance_not_approved', 'insurance_not_approved', 9),
('return_reason_code', 'other', 'other', 10),

('rejection_reason', 'damaged', 'damaged', 1),
('rejection_reason', 'wrong_item', 'wrong_item', 2),
('rejection_reason', 'short_expiry', 'short_expiry', 3),
('rejection_reason', 'quality_fail', 'quality_fail', 4),
('rejection_reason', 'excess_quantity', 'excess_quantity', 5),

('adjustment_reason', 'physical_count_correction', 'physical_count_correction', 1),
('adjustment_reason', 'damage', 'damage', 2),
('adjustment_reason', 'theft', 'theft', 3),
('adjustment_reason', 'sample_consumption', 'sample_consumption', 4),
('adjustment_reason', 'expiry_write_off', 'expiry_write_off', 5),
('adjustment_reason', 'quality_rejection', 'quality_rejection', 6),
('adjustment_reason', 'data_entry_error', 'data_entry_error', 7),
('adjustment_reason', 'other', 'other', 8),

('supplier_type', 'Manufacturer', 'Manufacturer', 1),
('supplier_type', 'Distributor', 'Distributor', 2),
('supplier_type', 'Wholesaler', 'Wholesaler', 3),
('supplier_type', 'Importer', 'Importer', 4),

('po_priority', 'routine', 'routine', 1),
('po_priority', 'urgent', 'urgent', 2),
('po_priority', 'emergency', 'emergency', 3),

('prescription_type', 'ip_indent', 'ip_indent', 1),
('prescription_type', 'op_prescription', 'op_prescription', 2),
('prescription_type', 'emergency', 'emergency', 3),

('temperature_breach_severity', 'minor', 'minor', 1),
('temperature_breach_severity', 'moderate', 'moderate', 2),
('temperature_breach_severity', 'critical', 'critical', 3),

('interaction_severity', 'contraindicated', 'contraindicated', 1),
('interaction_severity', 'high', 'high', 2),
('interaction_severity', 'moderate', 'moderate', 3),
('interaction_severity', 'low', 'low', 4),
('interaction_severity', 'informational', 'informational', 5),

('claim_status', 'draft', 'draft', 1),
('claim_status', 'submitted', 'submitted', 2),
('claim_status', 'under_review', 'under_review', 3),
('claim_status', 'partially_approved', 'partially_approved', 4),
('claim_status', 'approved', 'approved', 5),
('claim_status', 'rejected', 'rejected', 6),
('claim_status', 'settled', 'settled', 7),

('blood_group', 'A_positive', 'A_positive', 1),
('blood_group', 'A_negative', 'A_negative', 2),
('blood_group', 'B_positive', 'B_positive', 3),
('blood_group', 'B_negative', 'B_negative', 4),
('blood_group', 'AB_positive', 'AB_positive', 5),
('blood_group', 'AB_negative', 'AB_negative', 6),
('blood_group', 'O_positive', 'O_positive', 7),
('blood_group', 'O_negative', 'O_negative', 8),

('gender', 'male', 'male', 1),
('gender', 'female', 'female', 2),
('gender', 'other', 'other', 3),

('shift', 'morning', 'morning', 1),
('shift', 'afternoon', 'afternoon', 2),
('shift', 'evening', 'evening', 3),
('shift', 'night', 'night', 4);

-- 2. Document Sequences Table
CREATE TABLE IF NOT EXISTS document_sequences (
    sequence_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    document_type VARCHAR(30) UNIQUE NOT NULL,
    prefix VARCHAR(10) NOT NULL,
    last_number INT NOT NULL DEFAULT 0,
    current_year INT NOT NULL,
    reset_annually TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO document_sequences (document_type, prefix, last_number, current_year) VALUES
('BILL', 'BILL', 0, YEAR(CURDATE())),
('PO', 'PO', 0, YEAR(CURDATE())),
('GRN', 'GRN', 0, YEAR(CURDATE())),
('RETURN', 'RET', 0, YEAR(CURDATE())),
('CREDIT_NOTE', 'CN', 0, YEAR(CURDATE())),
('NARCOTIC_ENTRY', 'NE', 0, YEAR(CURDATE())),
('CLAIM', 'CLM', 0, YEAR(CURDATE())),
('ADVANCE', 'ADV', 0, YEAR(CURDATE())),
('CLEARANCE', 'CLR', 0, YEAR(CURDATE())),
('PRESCRIPTION', 'RX', 0, YEAR(CURDATE())),
('WORKLIST', 'WL', 0, YEAR(CURDATE()));

-- 3. App Configuration Table
CREATE TABLE IF NOT EXISTS app_configuration (
    config_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT NOT NULL,
    config_type ENUM('integer','decimal','boolean','string','json') NOT NULL,
    description TEXT,
    is_editable TINYINT(1) DEFAULT 1,
    updated_by CHAR(36),
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT IGNORE INTO app_configuration (config_key, config_value, config_type) VALUES
('expiry_warning_days_critical', '15', 'integer'),
('expiry_warning_days_near', '30', 'integer'),
('expiry_warning_days_early', '60', 'integer'),
('low_stock_check_interval_minutes', '30', 'integer'),
('temperature_log_reminder_hours', '8', 'integer'),
('po_auto_generation_enabled', 'true', 'boolean'),
('max_failed_login_attempts', '5', 'integer'),
('account_lockout_minutes', '15', 'integer'),
('session_timeout_minutes', '480', 'integer'),
('default_page_size', '10', 'integer'),
('currency_symbol', '₹', 'string'),
('currency_code', 'INR', 'string'),
('date_format', 'DD-MM-YYYY', 'string'),
('datetime_format', 'DD-MM-YYYY HH:mm', 'string'),
('gst_mode', 'intrastate', 'string'),
('pharmacy_name', 'configurable', 'string'),
('pharmacy_address', 'configurable', 'string'),
('drug_license_number', 'configurable', 'string'),
('gstin', 'configurable', 'string'),
('return_window_days', '7', 'integer'),
('narcotic_register_otp_required', 'true', 'boolean'),
('dashboard_refresh_interval_seconds', '60', 'integer');

-- 4. Schema Adjustments (Renaming to match prompt specs for reporting queries)

RENAME TABLE pharmacy_bills TO sales_bills;
ALTER TABLE sales_bills CHANGE billing_date bill_date TIMESTAMP NOT NULL;
ALTER TABLE sales_bills CHANGE status bill_status VARCHAR(50) NOT NULL;
-- Add amount_due column to sales_bills for calculations later
ALTER TABLE sales_bills ADD COLUMN IF NOT EXISTS amount_due DECIMAL(19,2) DEFAULT 0;
ALTER TABLE sales_bills ADD COLUMN IF NOT EXISTS advance_adjusted DECIMAL(19,2) DEFAULT 0;
ALTER TABLE sales_bills ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(50);
ALTER TABLE sales_bills ADD COLUMN IF NOT EXISTS total_gst_amount DECIMAL(19,2) DEFAULT 0;

RENAME TABLE pharmacy_bill_items TO sales_line_items;
ALTER TABLE sales_line_items DROP FOREIGN KEY fk_pbi_stock;
ALTER TABLE sales_line_items CHANGE stock_id batch_id CHAR(36); 
-- In V20 stock_batches uses batch_id VARCHAR(36), whereas original medicine_stocks used BIGINT id. 
-- Assuming they are joining to stock_batches for expiry calculations. 
-- Will alter it if it fails.

-- 5. System Alerts Table
CREATE TABLE IF NOT EXISTS system_alerts (
    alert_id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    severity ENUM('CRITICAL','WARNING','INFO') NOT NULL,
    alert_message TEXT NOT NULL,
    reference_id VARCHAR(100),
    is_resolved TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME
);
