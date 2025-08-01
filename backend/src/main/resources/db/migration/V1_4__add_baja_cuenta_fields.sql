-- Agregar campos para gestión de bajas de cuenta
ALTER TABLE empresas 
ADD COLUMN fecha_baja TIMESTAMP NULL,
ADD COLUMN motivo_baja VARCHAR(500) NULL,
ADD COLUMN baja_permanente BOOLEAN DEFAULT FALSE;

-- Crear índice para consultas de empresas dadas de baja
CREATE INDEX idx_empresas_baja ON empresas(activa, fecha_baja);

-- Crear índice para consultas de bajas permanentes
CREATE INDEX idx_empresas_baja_permanente ON empresas(baja_permanente); 