-- Script para insertar datos de prueba de inventario
-- Ejecutar manualmente cuando se necesiten datos de prueba

-- Insertar operaciones de inventario de prueba
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
) VALUES 
-- Operaciones para empresa ID 1 (Tienda Demo)
(1, 1, 1, 'INCREMENTO', 10, 15, 25, 29.99, 299.90, 'Compra de stock inicial', '123456789', 'manual', DATEADD('HOUR', -5, CURRENT_TIMESTAMP)),
(2, 1, 1, 'DECREMENTO', 5, 50, 45, 79.99, 399.95, 'Venta a cliente', '987654321', 'manual', DATEADD('HOUR', -4, CURRENT_TIMESTAMP)),
(3, 1, 1, 'AJUSTE', 15, 25, 15, 199.99, 2999.85, 'Ajuste de inventario físico', '456789123', 'manual', DATEADD('HOUR', -3, CURRENT_TIMESTAMP)),
(1, 1, 1, 'INCREMENTO', 20, 25, 45, 29.99, 599.80, 'Reposición de stock', '123456789', 'manual', DATEADD('HOUR', -2, CURRENT_TIMESTAMP)),
(4, 1, 1, 'DECREMENTO', 3, 12, 9, 199.99, 599.97, 'Venta de monitor', '789123456', 'manual', DATEADD('HOUR', -1, CURRENT_TIMESTAMP)),
(5, 1, 1, 'INVENTARIO_FISICO', 8, 8, 8, 299.99, 2399.92, 'Conteo físico', '321654987', 'manual', DATEADD('MINUTE', -30, CURRENT_TIMESTAMP));

-- Verificar que se insertaron los datos
SELECT 
    'Total operaciones insertadas: ' || COUNT(*) as resultado
FROM historial_inventario 
WHERE empresa_id = 1; 