-- Agregar campo referencia_actual a la tabla conteo_sector
-- Este campo almacenará los valores de referencia para el reconteo

ALTER TABLE conteo_sector 
ADD COLUMN referencia_actual TEXT;

-- Comentario para documentar el propósito del campo
COMMENT ON COLUMN conteo_sector.referencia_actual IS 'Almacena los valores de referencia actuales para el reconteo en formato JSON';
