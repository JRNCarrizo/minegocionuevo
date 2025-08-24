-- Script para corregir las fechas existentes en roturas_perdidas
-- Este script corrige las fechas que se guardaron con offset incorrecto de zona horaria

-- Primero, verificar las fechas actuales
SELECT 
    id,
    fecha,
    fecha_creacion,
    DATE(fecha_creacion) as fecha_creacion_solo_fecha
FROM roturas_perdidas 
ORDER BY fecha_creacion DESC;

-- Corregir las fechas: usar la fecha de creación como referencia
-- Si la fecha está un día atrás de la fecha de creación, corregirla
UPDATE roturas_perdidas 
SET fecha = DATE(fecha_creacion)
WHERE fecha < DATE(fecha_creacion);

-- Verificar el resultado después de la corrección
SELECT 
    id,
    fecha,
    fecha_creacion,
    DATE(fecha_creacion) as fecha_creacion_solo_fecha,
    CASE 
        WHEN fecha = DATE(fecha_creacion) THEN 'CORREGIDA'
        ELSE 'SIN CAMBIOS'
    END as estado
FROM roturas_perdidas 
ORDER BY fecha_creacion DESC;

-- Alternativa: Si las fechas están más de un día atrás, corregir manualmente
-- UPDATE roturas_perdidas 
-- SET fecha = '2025-08-24'  -- Reemplazar con la fecha correcta
-- WHERE fecha = '2025-08-23';  -- Reemplazar con la fecha incorrecta

-- Para verificar fechas específicas que necesiten corrección manual
SELECT 
    id,
    fecha,
    fecha_creacion,
    DATEDIFF(DATE(fecha_creacion), fecha) as dias_diferencia
FROM roturas_perdidas 
WHERE fecha != DATE(fecha_creacion)
ORDER BY fecha_creacion DESC;
