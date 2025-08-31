-- V16: Add transporte field to roturas_perdidas table
-- Agregar campo transporte a la tabla de roturas y pérdidas

-- Agregar columna transporte a la tabla roturas_perdidas
ALTER TABLE roturas_perdidas ADD COLUMN IF NOT EXISTS transporte VARCHAR(500);

-- Comentario sobre la migración
COMMENT ON COLUMN roturas_perdidas.transporte IS 'Campo opcional para registrar el transportista asociado a la rotura/pérdida';
