-- Agregar columna ultimo_acceso a la tabla empresas
ALTER TABLE empresas ADD COLUMN ultimo_acceso TIMESTAMP;

-- Comentario sobre la columna
COMMENT ON COLUMN empresas.ultimo_acceso IS 'Fecha y hora del último acceso de cualquier usuario de la empresa';




