-- Script para agregar columna de imagen de fondo a la tabla empresas
-- Ejecutar este script en la base de datos

-- Agregar columna de imagen de fondo
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS imagen_fondo_url VARCHAR(500);

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'empresas' 
AND column_name = 'imagen_fondo_url'; 