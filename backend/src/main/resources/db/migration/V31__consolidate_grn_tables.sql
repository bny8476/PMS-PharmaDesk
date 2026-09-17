CREATE TABLE IF NOT EXISTS goods_receipt_notes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    grn_number VARCHAR(100) NOT NULL UNIQUE,
    purchase_order_id VARCHAR(36) NOT NULL,
    supplier_id BIGINT NOT NULL,
    supplier_invoice_number VARCHAR(100),
    invoice_date DATE,
    delivery_challan_number VARCHAR(100),
    vehicle_number VARCHAR(100),
    received_by VARCHAR(100),
    received_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'DRAFT',
    created_by VARCHAR(100),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(po_id),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

CREATE TABLE IF NOT EXISTS goods_receipt_note_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    grn_id BIGINT NOT NULL,
    medicine_id BIGINT NOT NULL,
    po_item_id BIGINT,
    ordered_quantity INT,
    received_quantity INT,
    rejected_quantity INT DEFAULT 0,
    rejection_reason VARCHAR(255),
    batch_number VARCHAR(100),
    manufacturing_date DATE,
    expiry_date DATE,
    mrp DECIMAL(10,2),
    purchase_rate DECIMAL(10,2),
    created_by VARCHAR(100),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (grn_id) REFERENCES goods_receipt_notes(id) ON DELETE CASCADE,
    FOREIGN KEY (medicine_id) REFERENCES medicines(id)
);

-- Copy existing data from grn_entries to goods_receipt_notes if grn_entries exists
INSERT INTO goods_receipt_notes (
    created_at, updated_at, is_deleted,
    grn_number, purchase_order_id, supplier_id,
    supplier_invoice_number, invoice_date, delivery_challan_number,
    vehicle_number, received_by, received_date, status
)
SELECT 
    created_at, updated_at, 0,
    grn_number, po_id, supplier_id,
    invoice_number, invoice_date, delivery_challan_number,
    vehicle_number, CAST(received_by AS CHAR), grn_date, 'CONFIRMED'
FROM grn_entries
WHERE grn_number NOT IN (SELECT grn_number FROM goods_receipt_notes);

-- Drop redundant legacy tables safely
DROP TABLE IF EXISTS grn_line_items;
DROP TABLE IF EXISTS grn_entries;

