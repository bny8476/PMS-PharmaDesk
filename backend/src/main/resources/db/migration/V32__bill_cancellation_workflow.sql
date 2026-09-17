CREATE TABLE IF NOT EXISTS bill_cancellation_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bill_id BIGINT NOT NULL,
    requested_by VARCHAR(100) NOT NULL,
    requested_at DATETIME NOT NULL,
    reason VARCHAR(500) NOT NULL,
    status VARCHAR(50) NOT NULL,
    reviewed_by VARCHAR(100),
    reviewed_at DATETIME,
    CONSTRAINT fk_bill_cancel_bill FOREIGN KEY (bill_id) REFERENCES sales_bills(id)
);
