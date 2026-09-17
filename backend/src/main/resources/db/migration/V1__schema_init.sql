-- Unified Pharmacy Management System Schema
-- Replaces conflicting V1 and V2 migrations

CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100)
);

CREATE TABLE patients (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    uhid VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    dob DATE,
    gender VARCHAR(20),
    phone VARCHAR(20),
    address VARCHAR(255),
    insurance_id VARCHAR(100),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100)
);

CREATE TABLE suppliers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    contact VARCHAR(100),
    gstin VARCHAR(50),
    address VARCHAR(255),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100)
);

CREATE TABLE medicines (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    manufacturer VARCHAR(255),
    category VARCHAR(255),
    unit VARCHAR(50),
    hsn_code VARCHAR(50),
    gst_percent DECIMAL(5,2),
    tax_percentage DECIMAL(38,2),
    reorder_level INT DEFAULT 10,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100)
);

CREATE TABLE medicine_stocks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    medicine_id BIGINT NOT NULL,
    batch_number VARCHAR(100) NOT NULL,
    expiry_date DATE NOT NULL,
    quantity_available INT NOT NULL,
    purchase_rate DECIMAL(19, 2) NOT NULL,
    selling_rate DECIMAL(19, 2) NOT NULL,
    supplier_id BIGINT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    FOREIGN KEY (medicine_id) REFERENCES medicines(id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE TABLE pharmacy_bills (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bill_number VARCHAR(100) NOT NULL UNIQUE,
    billing_date TIMESTAMP NOT NULL,
    patient_id BIGINT,
    patient_name VARCHAR(255),
    doctor_name VARCHAR(255),
    bill_type VARCHAR(50) DEFAULT 'CASH',
    sub_total DECIMAL(19, 2) NOT NULL,
    discount_amount DECIMAL(19, 2) DEFAULT 0,
    tax_amount DECIMAL(19, 2) DEFAULT 0,
    net_amount DECIMAL(19, 2) NOT NULL,
    paid_amount DECIMAL(19, 2) DEFAULT 0,
    balance_amount DECIMAL(19, 2) DEFAULT 0,
    status VARCHAR(50) NOT NULL, -- PENDING, PAID, CANCELLED
    payment_status VARCHAR(50),  -- Enum status for pharmacy module
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    FOREIGN KEY (patient_id) REFERENCES patients(id)
);

CREATE TABLE pharmacy_bill_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bill_id BIGINT NOT NULL,
    stock_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(19, 2) NOT NULL,
    tax_amount DECIMAL(19, 2) DEFAULT 0,
    discount_amount DECIMAL(19, 2) DEFAULT 0,
    net_amount DECIMAL(19, 2) NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    FOREIGN KEY (bill_id) REFERENCES pharmacy_bills(id),
    FOREIGN KEY (stock_id) REFERENCES medicine_stocks(id)
);

CREATE TABLE medicine_returns (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    original_bill_id BIGINT NOT NULL,
    return_date TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL,
    total_return_amount DECIMAL(19, 2) NOT NULL,
    reason TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    FOREIGN KEY (original_bill_id) REFERENCES pharmacy_bills(id)
);

CREATE TABLE medicine_return_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    return_id BIGINT NOT NULL,
    stock_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    return_amount DECIMAL(19, 2) NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    FOREIGN KEY (return_id) REFERENCES medicine_returns(id),
    FOREIGN KEY (stock_id) REFERENCES medicine_stocks(id)
);

CREATE TABLE credit_bills (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bill_id BIGINT NOT NULL UNIQUE,
    total_amount DECIMAL(19, 2) NOT NULL,
    paid_amount DECIMAL(19, 2) NOT NULL,
    balance_amount DECIMAL(19, 2) NOT NULL,
    status VARCHAR(50),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    FOREIGN KEY (bill_id) REFERENCES pharmacy_bills(id)
);

CREATE TABLE payment_transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    credit_bill_id BIGINT NOT NULL,
    payment_date TIMESTAMP NOT NULL,
    amount DECIMAL(19, 2) NOT NULL,
    payment_mode VARCHAR(50) NOT NULL,
    transaction_reference VARCHAR(255),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    FOREIGN KEY (credit_bill_id) REFERENCES credit_bills(id)
);

CREATE TABLE pharmacy_advances (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_name VARCHAR(255) NOT NULL,
    patient_id BIGINT,
    amount DECIMAL(19, 2) NOT NULL,
    balance_amount DECIMAL(19, 2) NOT NULL,
    advance_date TIMESTAMP NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    FOREIGN KEY (patient_id) REFERENCES patients(id)
);

CREATE TABLE prescriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_name VARCHAR(255) NOT NULL,
    doctor_name VARCHAR(255),
    prescription_date TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100)
);

CREATE TABLE prescription_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    prescription_id BIGINT NOT NULL,
    medicine_id BIGINT NOT NULL,
    quantity_requested INT NOT NULL,
    quantity_dispensed INT DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id),
    FOREIGN KEY (medicine_id) REFERENCES medicines(id)
);

-- Seed Initial Data
INSERT INTO users (username, password_hash, role, name) 
VALUES ('admin', '$2a$12$R.S/1aWzP/6G.7jGZtMyqef1v5b3S8/HjQ53K4A6P4L8tVbO9k8v6', 'ADMIN', 'System Administrator');

INSERT INTO medicines (name, generic_name, category, unit, hsn_code, gst_percent, tax_percent, reorder_level) VALUES 
('Paracetamol 500mg', 'Paracetamol', 'Tablet', 'Strips', '30049099', 12.00, 12.00, 10),
('Amoxicillin 250mg', 'Amoxicillin', 'Capsule', 'Strips', '30041010', 12.00, 12.00, 5),
('Cofsils Cough Syrup', 'Dextromethorphan', 'Syrup', 'Bottle', '30049011', 5.00, 5.00, 20);

INSERT INTO medicine_stocks (medicine_id, batch_number, expiry_date, quantity_available, purchase_rate, selling_rate) VALUES 
(1, 'B-PARA-001', '2027-12-31', 1000, 1.50, 2.00),
(2, 'B-AMOX-012', '2026-10-31', 500, 4.00, 5.50),
(3, 'B-COFS-099', '2025-08-15', 200, 45.00, 60.00);
