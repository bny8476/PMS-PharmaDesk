ALTER TABLE sales_bills
ADD COLUMN doctor_id BIGINT;

ALTER TABLE sales_bills
ADD CONSTRAINT fk_sales_bills_doctor
FOREIGN KEY (doctor_id) REFERENCES doctors(id);

ALTER TABLE prescriptions
ADD COLUMN doctor_id BIGINT;

ALTER TABLE prescriptions
ADD CONSTRAINT fk_prescriptions_doctor
FOREIGN KEY (doctor_id) REFERENCES doctors(id);
