-- Script para insertar datos de prueba de inventario
-- Ejecutar manualmente cuando se necesiten datos de prueba

-- Insertar operaciones de inventario de prueba (solo si no existen)
INSERT INTO historial_inventario (
    producto_id, 
    usuario_id, 
    empresa_id, 
    tipo_operacion, 
    cantidad, 
    stock_anterior, 
    stock_nuevo, 
    precio_unitario, 
    valor_total, 
    observacion, 
    codigo_barras, 
    metodo_entrada, 
    fecha_operacion
)
SELECT 1, 1, 1, 'INCREMENTO', 10, 15, 25, 29.99, 299.90, 'Compra de stock inicial', '123456789', 'manual', DATEADD('HOUR', -5, CURRENT_TIMESTAMP)
WHERE NOT EXISTS (SELECT 1 FROM historial_inventario WHERE producto_id = 1 AND observacion = 'Compra de stock inicial' AND empresa_id = 1);

INSERT INTO historial_inventario (
    producto_id, 
    usuario_id, 
    empresa_id, 
    tipo_operacion, 
    cantidad, 
    stock_anterior, 
    stock_nuevo, 
    precio_unitario, 
    valor_total, 
    observacion, 
    codigo_barras, 
    metodo_entrada, 
    fecha_operacion
)
SELECT 2, 1, 1, 'DECREMENTO', 5, 50, 45, 79.99, 399.95, 'Venta a cliente', '987654321', 'manual', DATEADD('HOUR', -4, CURRENT_TIMESTAMP)
WHERE NOT EXISTS (SELECT 1 FROM historial_inventario WHERE producto_id = 2 AND observacion = 'Venta a cliente' AND empresa_id = 1);

INSERT INTO historial_inventario (
    producto_id, 
    usuario_id, 
    empresa_id, 
    tipo_operacion, 
    cantidad, 
    stock_anterior, 
    stock_nuevo, 
    precio_unitario, 
    valor_total, 
    observacion, 
    codigo_barras, 
    metodo_entrada, 
    fecha_operacion
)
SELECT 3, 1, 1, 'AJUSTE', 15, 25, 15, 199.99, 2999.85, 'Ajuste de inventario físico', '456789123', 'manual', DATEADD('HOUR', -3, CURRENT_TIMESTAMP)
WHERE NOT EXISTS (SELECT 1 FROM historial_inventario WHERE producto_id = 3 AND observacion = 'Ajuste de inventario físico' AND empresa_id = 1);

INSERT INTO historial_inventario (
    producto_id, 
    usuario_id, 
    empresa_id, 
    tipo_operacion, 
    cantidad, 
    stock_anterior, 
    stock_nuevo, 
    precio_unitario, 
    valor_total, 
    observacion, 
    codigo_barras, 
    metodo_entrada, 
    fecha_operacion
)
SELECT 1, 1, 1, 'INCREMENTO', 20, 25, 45, 29.99, 599.80, 'Reposición de stock', '123456789', 'manual', DATEADD('HOUR', -2, CURRENT_TIMESTAMP)
WHERE NOT EXISTS (SELECT 1 FROM historial_inventario WHERE producto_id = 1 AND observacion = 'Reposición de stock' AND empresa_id = 1);

INSERT INTO historial_inventario (
    producto_id, 
    usuario_id, 
    empresa_id, 
    tipo_operacion, 
    cantidad, 
    stock_anterior, 
    stock_nuevo, 
    precio_unitario, 
    valor_total, 
    observacion, 
    codigo_barras, 
    metodo_entrada, 
    fecha_operacion
)
SELECT 4, 1, 1, 'DECREMENTO', 3, 12, 9, 199.99, 599.97, 'Venta de monitor', '789123456', 'manual', DATEADD('HOUR', -1, CURRENT_TIMESTAMP)
WHERE NOT EXISTS (SELECT 1 FROM historial_inventario WHERE producto_id = 4 AND observacion = 'Venta de monitor' AND empresa_id = 1);

INSERT INTO historial_inventario (
    producto_id, 
    usuario_id, 
    empresa_id, 
    tipo_operacion, 
    cantidad, 
    stock_anterior, 
    stock_nuevo, 
    precio_unitario, 
    valor_total, 
    observacion, 
    codigo_barras, 
    metodo_entrada, 
    fecha_operacion
)
SELECT 5, 1, 1, 'INVENTARIO_FISICO', 8, 8, 8, 299.99, 2399.92, 'Conteo físico', '321654987', 'manual', DATEADD('MINUTE', -30, CURRENT_TIMESTAMP)
WHERE NOT EXISTS (SELECT 1 FROM historial_inventario WHERE producto_id = 5 AND observacion = 'Conteo físico' AND empresa_id = 1);

-- Verificar que se insertaron los datos
SELECT 
    'Total operaciones insertadas: ' || COUNT(*) as resultado
FROM historial_inventario 
WHERE empresa_id = 1; 