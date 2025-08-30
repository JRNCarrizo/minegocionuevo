-- Migración para hacer el número de planilla opcional
-- Ejecutar este script en la base de datos de producción

-- 1. Eliminar la restricción NOT NULL de la columna numero_planilla
ALTER TABLE planillas_devoluciones 
ALTER COLUMN numero_planilla DROP NOT NULL;

-- 2. Verificar que la columna ahora permite NULL
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'planillas_devoluciones'
AND column_name = 'numero_planilla';

-- 3. Opcional: Actualizar registros existentes que tengan valores vacíos
-- UPDATE planillas_devoluciones 
-- SET numero_planilla = NULL 
-- WHERE numero_planilla = '' OR numero_planilla IS NULL;

-- 4. Verificar que la migración se aplicó correctamente
SELECT 
    id,
    numero_planilla,
    fecha_planilla,
    observaciones
FROM planillas_devoluciones 
ORDER BY fecha_creacion DESC 
LIMIT 5;
