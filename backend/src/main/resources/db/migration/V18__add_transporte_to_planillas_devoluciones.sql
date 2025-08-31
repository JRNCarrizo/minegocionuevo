-- V18: Add transporte field to planillas_devoluciones table
-- Agregar campo transporte a la tabla de planillas de devoluciones

-- Agregar columna transporte a la tabla planillas_devoluciones
ALTER TABLE planillas_devoluciones ADD COLUMN IF NOT EXISTS transporte VARCHAR(500);

-- Comentario sobre la migración
COMMENT ON COLUMN planillas_devoluciones.transporte IS 'Campo opcional para registrar el transportista asociado a la devolución';
