-- Registro del stock por producto al marcar sector "completado sin conteo" o "vacío" (JSON)
ALTER TABLE conteo_sector
    ADD COLUMN snapshot_stock_sin_conteo TEXT NULL;
