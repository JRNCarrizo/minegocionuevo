-- Migración para hacer el número de planilla opcional en DESARROLLO
-- Ejecutar este script en la base de datos local de desarrollo

-- 1. Verificar el estado actual de la columna
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'planillas_devoluciones'
AND column_name = 'numero_planilla';

-- 2. Eliminar la restricción NOT NULL de la columna numero_planilla
ALTER TABLE planillas_devoluciones 
ALTER COLUMN numero_planilla DROP NOT NULL;

-- 3. Verificar que la migración se aplicó correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'planillas_devoluciones'
AND column_name = 'numero_planilla';

-- 4. Verificar registros existentes
SELECT 
    id,
    numero_planilla,
    fecha_planilla,
    observaciones
FROM planillas_devoluciones 
ORDER BY fecha_creacion DESC 
LIMIT 5;

-- 5. Mensaje de confirmación
SELECT '✅ Migración completada exitosamente. El número de planilla ahora es opcional.' as resultado;
