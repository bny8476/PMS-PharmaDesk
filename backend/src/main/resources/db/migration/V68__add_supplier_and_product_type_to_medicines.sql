ALTER TABLE medicines 
ADD COLUMN supplier_id BIGINT,
ADD COLUMN product_type VARCHAR(50) DEFAULT 'MEDICINE';

ALTER TABLE medicines
ADD CONSTRAINT fk_medicine_supplier 
FOREIGN KEY (supplier_id) REFERENCES suppliers(id);
