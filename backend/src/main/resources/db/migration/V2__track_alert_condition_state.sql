ALTER TABLE alerts
    ADD COLUMN condition_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX idx_alerts_product_type_created
    ON alerts (product_id, type, created_at DESC);
