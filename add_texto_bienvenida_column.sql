-- Script para agregar la columna texto_bienvenida a la tabla empresas
-- Ejecutar este script en tu base de datos

-- Para H2 (desarrollo)
ALTER TABLE empresas ADD COLUMN texto_bienvenida VARCHAR(200);

-- Para PostgreSQL (producción)
-- ALTER TABLE empresas ADD COLUMN texto_bienvenida VARCHAR(200);

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'empresas' AND column_name = 'texto_bienvenida'; 