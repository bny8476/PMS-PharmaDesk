-- Seed Medicines
INSERT INTO medicines (name, generic_name, manufacturer, category, unit, hsn_code, gst_percent, tax_percentage) VALUES
('Dolo 650', 'Paracetamol', 'Micro Labs', 'Antipyretic', 'Tablet', '3004', 12.0, 12.0),
('Pan 40', 'Pantoprazole', 'Alkem', 'Antacid', 'Tablet', '3004', 12.0, 12.0),
('Crocin 500', 'Paracetamol', 'GSK', 'Analgesic', 'Tablet', '3004', 12.0, 12.0),
('Cetrizine', 'Cetirizine', 'Cipla', 'Antiallergic', 'Tablet', '3004', 12.0, 12.0),
('Amoxicillin 500', 'Amoxicillin', 'Abbott', 'Antibiotic', 'Capsule', '3004', 12.0, 12.0),
('Azithromycin 500', 'Azithromycin', 'Pfizer', 'Antibiotic', 'Tablet', '3004', 12.0, 12.0),
('Ibuprofen 400', 'Ibuprofen', 'Dr. Reddys', 'Painkiller', 'Tablet', '3004', 12.0, 12.0),
('Metformin 500', 'Metformin', 'Sun Pharma', 'Antidiabetic', 'Tablet', '3004', 12.0, 12.0),
('Omeprazole 20', 'Omeprazole', 'Zydus', 'Antacid', 'Capsule', '3004', 12.0, 12.0),
('Vicks Vaporub', 'Menthol/Camphor', 'P&G', 'Cold Relief', 'Ointment', '3004', 18.0, 18.0);

-- Seed Stocks for these medicines
INSERT INTO medicine_stocks (medicine_id, batch_number, expiry_date, quantity_available, purchase_rate, selling_rate)
SELECT id, 'BTCH001', '2027-12-31', 100, 10.00, 15.00 FROM medicines WHERE name = 'Dolo 650';

INSERT INTO medicine_stocks (medicine_id, batch_number, expiry_date, quantity_available, purchase_rate, selling_rate)
SELECT id, 'BTCH002', '2027-10-31', 150, 8.00, 12.50 FROM medicines WHERE name = 'Pan 40';

INSERT INTO medicine_stocks (medicine_id, batch_number, expiry_date, quantity_available, purchase_rate, selling_rate)
SELECT id, 'BTCH003', '2028-01-31', 200, 5.00, 8.00 FROM medicines WHERE name = 'Crocin 500';

INSERT INTO medicine_stocks (medicine_id, batch_number, expiry_date, quantity_available, purchase_rate, selling_rate)
SELECT id, 'BTCH004', '2027-05-31', 300, 2.00, 5.00 FROM medicines WHERE name = 'Cetrizine';

INSERT INTO medicine_stocks (medicine_id, batch_number, expiry_date, quantity_available, purchase_rate, selling_rate)
SELECT id, 'BTCH005', '2026-11-30', 100, 20.00, 35.00 FROM medicines WHERE name = 'Amoxicillin 500';

INSERT INTO medicine_stocks (medicine_id, batch_number, expiry_date, quantity_available, purchase_rate, selling_rate)
SELECT id, 'BTCH006', '2027-04-30', 80, 50.00, 75.00 FROM medicines WHERE name = 'Azithromycin 500';

INSERT INTO medicine_stocks (medicine_id, batch_number, expiry_date, quantity_available, purchase_rate, selling_rate)
SELECT id, 'BTCH007', '2028-06-30', 250, 4.00, 7.50 FROM medicines WHERE name = 'Ibuprofen 400';

INSERT INTO medicine_stocks (medicine_id, batch_number, expiry_date, quantity_available, purchase_rate, selling_rate)
SELECT id, 'BTCH008', '2027-09-30', 400, 3.00, 6.00 FROM medicines WHERE name = 'Metformin 500';

INSERT INTO medicine_stocks (medicine_id, batch_number, expiry_date, quantity_available, purchase_rate, selling_rate)
SELECT id, 'BTCH009', '2027-03-31', 120, 6.00, 10.00 FROM medicines WHERE name = 'Omeprazole 20';

INSERT INTO medicine_stocks (medicine_id, batch_number, expiry_date, quantity_available, purchase_rate, selling_rate)
SELECT id, 'BTCH010', '2029-12-31', 50, 40.00, 65.00 FROM medicines WHERE name = 'Vicks Vaporub';
