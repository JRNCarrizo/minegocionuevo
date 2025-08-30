-- Migración para PostgreSQL: Número de Planilla Opcional
-- Ejecutar este script en la base de datos PostgreSQL de Railway

-- 1. Verificar el estado actual de la columna
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'planillas_devoluciones'
AND column_name = 'numero_planilla';

-- 2. Eliminar la restricción NOT NULL de la columna numero_planilla
ALTER TABLE planillas_devoluciones 
ALTER COLUMN numero_planilla DROP NOT NULL;

-- 3. Verificar que la migración se aplicó correctamente
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'planillas_devoluciones'
AND column_name = 'numero_planilla';

-- 4. Verificar registros existentes
SELECT 
    id,
    numero_planilla,
    fecha_planilla,
    observaciones,
    fecha_creacion
FROM planillas_devoluciones 
ORDER BY fecha_creacion DESC 
LIMIT 5;

-- 5. Verificar que se pueden insertar registros con NULL
-- (Este es solo un test, no inserta realmente)
SELECT 
    'Prueba de inserción con NULL' as test,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'planillas_devoluciones' 
            AND column_name = 'numero_planilla' 
            AND is_nullable = 'YES'
        ) 
        THEN '✅ Columna permite NULL' 
        ELSE '❌ Columna NO permite NULL' 
    END as resultado;

-- 6. Mensaje de confirmación
SELECT '✅ Migración completada exitosamente. El número de planilla ahora es opcional en PostgreSQL.' as resultado;
