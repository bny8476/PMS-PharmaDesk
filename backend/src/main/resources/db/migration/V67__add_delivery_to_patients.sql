ALTER TABLE patients
ADD COLUMN preferred_delivery BOOLEAN DEFAULT FALSE,
ADD COLUMN delivery_address TEXT;
