-- Agregar columna eliminado a la tabla detalle_conteo si no existe
-- Esta migración es compatible con PostgreSQL

-- Verificar si la columna ya existe y agregarla si no existe
DO $$
BEGIN
    -- Verificar si la columna eliminado existe
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'detalle_conteo' 
        AND column_name = 'eliminado'
        AND table_schema = 'public'
    ) THEN
        -- Agregar la columna eliminado
        ALTER TABLE detalle_conteo 
        ADD COLUMN eliminado BOOLEAN NOT NULL DEFAULT FALSE;
        
        -- Crear índices para mejorar el rendimiento
        CREATE INDEX IF NOT EXISTS idx_detalle_conteo_eliminado ON detalle_conteo(eliminado);
        CREATE INDEX IF NOT EXISTS idx_detalle_conteo_sector_eliminado ON detalle_conteo(conteo_sector_id, eliminado);
        
        RAISE NOTICE 'Columna eliminado agregada exitosamente a detalle_conteo';
    ELSE
        RAISE NOTICE 'Columna eliminado ya existe en detalle_conteo';
    END IF;
END $$;
