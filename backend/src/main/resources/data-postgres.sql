-- Script para PostgreSQL - Agregar columna texto_bienvenida si no existe
-- Se ejecuta automáticamente al iniciar la aplicación en producción

-- Verificar si la columna existe y agregarla si no
-- Para PostgreSQL
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'empresas' 
        AND column_name = 'texto_bienvenida'
    ) THEN
        ALTER TABLE empresas ADD COLUMN texto_bienvenida VARCHAR(200);
        RAISE NOTICE 'Columna texto_bienvenida agregada a la tabla empresas';
    ELSE
        RAISE NOTICE 'La columna texto_bienvenida ya existe en la tabla empresas';
    END IF;
END $$; 