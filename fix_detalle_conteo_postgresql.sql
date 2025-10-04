-- Script para arreglar la tabla detalle_conteo en PostgreSQL
-- Ejecutar este script directamente en la base de datos de producción

-- Verificar si la tabla existe
SELECT 'Verificando si la tabla detalle_conteo existe...' as status;

-- Si la tabla no existe, crearla
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_name = 'detalle_conteo' 
        AND table_schema = 'public'
    ) THEN
        -- Crear la tabla
        CREATE TABLE detalle_conteo (
            id BIGSERIAL PRIMARY KEY,
            conteo_sector_id BIGINT NOT NULL,
            producto_id BIGINT NOT NULL,
            codigo_producto VARCHAR(255),
            nombre_producto VARCHAR(255),
            stock_sistema INTEGER,
            cantidad_conteo_1 INTEGER DEFAULT 0,
            cantidad_conteo_2 INTEGER DEFAULT 0,
            cantidad_final INTEGER DEFAULT 0,
            diferencia_sistema INTEGER DEFAULT 0,
            diferencia_entre_conteos INTEGER DEFAULT 0,
            formula_calculo_1 VARCHAR(500),
            formula_calculo_2 VARCHAR(500),
            precio_unitario DECIMAL(10,2),
            valor_diferencia DECIMAL(10,2),
            categoria VARCHAR(255),
            marca VARCHAR(255),
            estado VARCHAR(50) DEFAULT 'PENDIENTE',
            observaciones TEXT,
            eliminado BOOLEAN NOT NULL DEFAULT FALSE,
            fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (conteo_sector_id) REFERENCES conteo_sector(id) ON DELETE CASCADE,
            FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE
        );
        
        RAISE NOTICE 'Tabla detalle_conteo creada exitosamente';
    ELSE
        RAISE NOTICE 'Tabla detalle_conteo ya existe';
    END IF;
END $$;

-- Verificar si la columna eliminado existe y agregarla si no existe
DO $$
BEGIN
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
        
        RAISE NOTICE 'Columna eliminado agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna eliminado ya existe';
    END IF;
END $$;

-- Crear índices si no existen
CREATE INDEX IF NOT EXISTS idx_detalle_conteo_sector ON detalle_conteo(conteo_sector_id);
CREATE INDEX IF NOT EXISTS idx_detalle_conteo_producto ON detalle_conteo(producto_id);
CREATE INDEX IF NOT EXISTS idx_detalle_conteo_eliminado ON detalle_conteo(eliminado);
CREATE INDEX IF NOT EXISTS idx_detalle_conteo_sector_eliminado ON detalle_conteo(conteo_sector_id, eliminado);

-- Verificar la estructura final de la tabla
SELECT 'Estructura final de la tabla detalle_conteo:' as status;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'detalle_conteo' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar índices
SELECT 'Índices creados:' as status;
SELECT indexname, indexdef
FROM pg_indexes 
WHERE tablename = 'detalle_conteo';

SELECT 'Script completado exitosamente!' as status;
