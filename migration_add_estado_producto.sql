-- Migración para agregar la columna estado_producto a detalle_planillas_devoluciones
-- Ejecutar este script en la base de datos de producción

-- Agregar la columna estado_producto con valor por defecto 'BUEN_ESTADO'
ALTER TABLE detalle_planillas_devoluciones 
ADD COLUMN estado_producto VARCHAR(20) NOT NULL DEFAULT 'BUEN_ESTADO';

-- Crear un índice para mejorar el rendimiento de consultas por estado
CREATE INDEX idx_detalle_planillas_devoluciones_estado 
ON detalle_planillas_devoluciones(estado_producto);

-- Verificar que la columna se agregó correctamente
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'detalle_planillas_devoluciones' 
AND column_name = 'estado_producto';
