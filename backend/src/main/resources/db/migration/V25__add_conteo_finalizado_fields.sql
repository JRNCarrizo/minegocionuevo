-- Agregar campos para controlar el estado de finalización de cada conteo
ALTER TABLE conteo_sector ADD COLUMN conteo_1_finalizado BOOLEAN DEFAULT FALSE;
ALTER TABLE conteo_sector ADD COLUMN conteo_2_finalizado BOOLEAN DEFAULT FALSE;
ALTER TABLE conteo_sector ADD COLUMN fecha_conteo_1_finalizacion TIMESTAMP;
ALTER TABLE conteo_sector ADD COLUMN fecha_conteo_2_finalizacion TIMESTAMP;

-- Actualizar registros existentes
UPDATE conteo_sector 
SET conteo_1_finalizado = FALSE, 
    conteo_2_finalizado = FALSE 
WHERE conteo_1_finalizado IS NULL OR conteo_2_finalizado IS NULL;
