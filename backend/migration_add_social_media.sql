-- Script para agregar columnas de redes sociales a la tabla empresas
-- Ejecutar este script en la base de datos PostgreSQL

-- Agregar columnas de redes sociales
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(255);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(255);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS mercadolibre_url VARCHAR(255);

-- Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'empresas' 
AND column_name IN ('instagram_url', 'facebook_url', 'mercadolibre_url'); 