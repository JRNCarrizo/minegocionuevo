-- Migración para agregar columna sector_almacenamiento a la tabla productos
-- Ejecutar este script en la base de datos para agregar la nueva funcionalidad

-- Verificar si la columna existe antes de agregarla
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'productos' 
        AND column_name = 'sector_almacenamiento'
    ) THEN
        ALTER TABLE productos ADD COLUMN sector_almacenamiento VARCHAR(100);
        RAISE NOTICE 'Columna sector_almacenamiento agregada exitosamente';
    ELSE
        RAISE NOTICE 'La columna sector_almacenamiento ya existe';
    END IF;
END $$; 