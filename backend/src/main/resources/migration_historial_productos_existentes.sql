-- Migración para registrar historial de carga inicial para productos existentes
-- Este script registra operaciones de CARGA_INICIAL para productos que fueron creados
-- directamente en la base de datos sin pasar por el servicio de Java

-- Insertar registros de historial para productos existentes que no tienen historial
INSERT INTO historial_carga_productos (
    producto_id,
    producto_nombre,
    producto_descripcion,
    producto_marca,
    producto_categoria,
    producto_unidad,
    codigo_barras,
    codigo_personalizado,
    usuario_id,
    usuario_nombre,
    usuario_apellidos,
    empresa_id,
    empresa_nombre,
    tipo_operacion,
    tipo_operacion_descripcion,
    cantidad,
    stock_anterior,
    stock_nuevo,
    precio_unitario,
    valor_total,
    observacion,
    metodo_entrada,
    fecha_operacion,
    fecha_creacion,
    fecha_actualizacion
)
SELECT 
    p.id as producto_id,
    p.nombre as producto_nombre,
    p.descripcion as producto_descripcion,
    p.marca as producto_marca,
    p.categoria as producto_categoria,
    p.unidad as producto_unidad,
    p.codigo_barras,
    p.codigo_personalizado,
    NULL as usuario_id,
    'Sistema' as usuario_nombre,
    'Inicialización' as usuario_apellidos,
    p.empresa_id,
    e.nombre as empresa_nombre,
    'CARGA_INICIAL' as tipo_operacion,
    'Carga Inicial' as tipo_operacion_descripcion,
    COALESCE(p.stock, 0) as cantidad,
    0 as stock_anterior,
    COALESCE(p.stock, 0) as stock_nuevo,
    COALESCE(p.precio, 0) as precio_unitario,
    COALESCE(p.precio * p.stock, 0) as valor_total,
    'Carga inicial de producto desde script SQL' as observacion,
    'SISTEMA' as metodo_entrada,
    p.fecha_creacion as fecha_operacion,
    NOW() as fecha_creacion,
    NOW() as fecha_actualizacion
FROM productos p
INNER JOIN empresas e ON p.empresa_id = e.id
WHERE p.activo = true
AND NOT EXISTS (
    SELECT 1 
    FROM historial_carga_productos h 
    WHERE h.producto_id = p.id 
    AND h.tipo_operacion = 'CARGA_INICIAL'
);

-- Verificar cuántos registros se insertaron
SELECT 
    COUNT(*) as productos_con_historial_agregado,
    'Historial de carga inicial registrado para productos existentes' as mensaje
FROM historial_carga_productos 
WHERE tipo_operacion = 'CARGA_INICIAL' 
AND observacion = 'Carga inicial de producto desde script SQL'; 