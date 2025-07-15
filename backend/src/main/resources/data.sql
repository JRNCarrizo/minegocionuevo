-- Datos de prueba para el sistema miNegocio

-- Insertar empresa de ejemplo (solo si no existe)
INSERT INTO empresas (nombre, subdominio, email, telefono, descripcion, logo_url, color_primario, color_secundario, estado_suscripcion, fecha_fin_prueba, activa, fecha_creacion, fecha_actualizacion)
SELECT 'Tienda Demo', 'demo', 'admin@demo.com', '+34 123 456 789', 'Tienda de demostración del sistema miNegocio', null, '#3B82F6', '#1F2937', 'PRUEBA', DATEADD('MONTH', 1, CURRENT_TIMESTAMP), true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM empresas WHERE email = 'admin@demo.com');

-- Insertar usuario administrador (password: admin123 - BCrypt) (solo si no existe)
INSERT INTO usuarios (nombre, apellidos, email, password, telefono, rol, activo, email_verificado, empresa_id, fecha_creacion, fecha_actualizacion)
SELECT 'Admin', 'Demo', 'admin@demo.com', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', '+34 123 456 789', 'ADMINISTRADOR', true, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'admin@demo.com');

-- Insertar productos (sin imágenes en la tabla principal)
INSERT INTO productos (nombre, descripcion, precio, stock, stock_minimo, categoria, marca, unidad, activo, destacado, empresa_id, fecha_creacion, fecha_actualizacion)
VALUES 
('Laptop Dell Inspiron 15', 'Laptop para uso profesional con procesador Intel i5, 8GB RAM y 256GB SSD', 899.99, 15, 5, 'Electrónicos', 'Dell', 'unidad', true, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Mouse Inalámbrico Logitech', 'Mouse inalámbrico ergonómico con conexión USB', 29.99, 50, 10, 'Electrónicos', 'Logitech', 'unidad', true, false, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Teclado Mecánico RGB', 'Teclado mecánico con retroiluminación RGB personalizable', 79.99, 25, 5, 'Electrónicos', 'Corsair', 'unidad', true, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Monitor 24" Full HD', 'Monitor LED de 24 pulgadas con resolución Full HD 1920x1080', 199.99, 12, 3, 'Electrónicos', 'Samsung', 'unidad', true, false, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Silla Ergonómica de Oficina', 'Silla ergonómica con soporte lumbar y reposabrazos ajustables', 299.99, 8, 2, 'Mobiliario', 'Herman Miller', 'unidad', true, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertar imágenes de productos en tabla separada
INSERT INTO producto_imagenes (producto_id, url_imagen)
VALUES 
(1, '/uploads/laptop-dell.jpg'),
(1, '/uploads/laptop-dell-2.jpg'),
(2, '/uploads/mouse-logitech.jpg'),
(3, '/uploads/teclado-rgb.jpg'),
(3, '/uploads/teclado-rgb-2.jpg'),
(4, '/uploads/monitor-samsung.jpg'),
(5, '/uploads/silla-ergonomica.jpg');

-- Insertar clientes de ejemplo (password: cliente123 - BCrypt)
INSERT INTO clientes (nombre, apellidos, email, password, telefono, direccion, ciudad, codigo_postal, pais, tipo, activo, acepta_marketing, email_verificado, empresa_id, fecha_creacion, fecha_actualizacion)
VALUES 
('Juan', 'Pérez García', 'juan.perez@email.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iYqiSfFGhO4tEHy0LYIFGXcP.Wce', '+34 987 654 321', 'Calle Mayor 123', 'Madrid', '28001', 'España', 'REGULAR', true, true, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('María', 'López Rodríguez', 'maria.lopez@email.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iYqiSfFGhO4tEHy0LYIFGXcP.Wce', '+34 654 321 987', 'Avenida de la Constitución 45', 'Barcelona', '08001', 'España', 'PREMIUM', true, false, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Carlos', 'González Martín', 'carlos.gonzalez@email.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iYqiSfFGhO4tEHy0LYIFGXcP.Wce', '+34 321 987 654', 'Plaza España 7', 'Valencia', '46001', 'España', 'REGULAR', true, true, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertar pedidos de ejemplo
INSERT INTO pedidos (numero_pedido, estado, total, subtotal, impuestos, descuento, observaciones, direccion_entrega, cliente_id, empresa_id, fecha_creacion, fecha_actualizacion)
VALUES 
('PED-001', 'ENTREGADO', 929.98, 929.98, 0, 0, 'Entrega urgente', 'Calle Mayor 123, Madrid', 1, 1, DATEADD('DAY', -5, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP),
('PED-002', 'PREPARANDO', 379.98, 379.98, 0, 0, null, 'Avenida de la Constitución 45, Barcelona', 2, 1, DATEADD('DAY', -2, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP),
('PED-003', 'PENDIENTE', 79.99, 79.99, 0, 0, 'Llamar antes de entregar', 'Plaza España 7, Valencia', 3, 1, DATEADD('DAY', -1, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP);

-- Insertar detalles de pedidos
INSERT INTO detalle_pedidos (cantidad, precio_unitario, precio_total, producto_id, pedido_id, nombre_producto, descripcion_producto, categoria_producto, marca_producto, fecha_creacion)
VALUES 
-- Pedido 1
(1, 899.99, 899.99, 1, 1, 'Laptop Dell Inspiron 15', 'Laptop para uso profesional', 'Electrónicos', 'Dell', DATEADD('DAY', -5, CURRENT_TIMESTAMP)),
(1, 29.99, 29.99, 2, 1, 'Mouse Inalámbrico Logitech', 'Mouse inalámbrico ergonómico', 'Electrónicos', 'Logitech', DATEADD('DAY', -5, CURRENT_TIMESTAMP)),
-- Pedido 2  
(1, 79.99, 79.99, 3, 2, 'Teclado Mecánico RGB', 'Teclado mecánico con retroiluminación RGB', 'Electrónicos', 'Corsair', DATEADD('DAY', -2, CURRENT_TIMESTAMP)),
(1, 299.99, 299.99, 5, 2, 'Silla Ergonómica de Oficina', 'Silla ergonómica con soporte lumbar', 'Mobiliario', 'Herman Miller', DATEADD('DAY', -2, CURRENT_TIMESTAMP)),
-- Pedido 3
(1, 79.99, 79.99, 3, 3, 'Teclado Mecánico RGB', 'Teclado mecánico con retroiluminación RGB', 'Electrónicos', 'Corsair', DATEADD('DAY', -1, CURRENT_TIMESTAMP));

-- Insertar mensajes de ejemplo
INSERT INTO mensajes (asunto, contenido, tipo, estado, leido, cliente_id, empresa_id, producto_id, fecha_creacion, fecha_actualizacion)
VALUES 
('Consulta sobre Laptop Dell', '¿La laptop incluye Office? ¿Cuál es la garantía?', 'CONSULTA', 'PENDIENTE', false, 1, 1, 1, DATEADD('HOUR', -2, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP),
('Problema con el pedido', 'Mi pedido está marcado como preparando pero han pasado 3 días', 'RECLAMO', 'PENDIENTE', false, 2, 1, null, DATEADD('HOUR', -1, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP),
('Sugerencia de producto', 'Estaría bien que añadieran tablets a su catálogo', 'SUGERENCIA', 'PENDIENTE', false, 3, 1, null, DATEADD('MINUTE', -30, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP);

-- Agregar columna marca_producto a la tabla detalle_pedidos si no existe
ALTER TABLE detalle_pedidos ADD COLUMN IF NOT EXISTS marca_producto VARCHAR(100);

-- Actualizar las marcas de los productos existentes en los detalles de pedidos
UPDATE detalle_pedidos SET marca_producto = 'Dell' WHERE nombre_producto LIKE '%Dell%';
UPDATE detalle_pedidos SET marca_producto = 'Logitech' WHERE nombre_producto LIKE '%Logitech%';
UPDATE detalle_pedidos SET marca_producto = 'Corsair' WHERE nombre_producto LIKE '%RGB%';
UPDATE detalle_pedidos SET marca_producto = 'Samsung' WHERE nombre_producto LIKE '%Monitor%';
UPDATE detalle_pedidos SET marca_producto = 'Herman Miller' WHERE nombre_producto LIKE '%Silla%';

-- Agregar columna sector_almacenamiento si no existe
ALTER TABLE productos ADD COLUMN IF NOT EXISTS sector_almacenamiento VARCHAR(100);

-- Agregar columna codigo_personalizado a la tabla productos
ALTER TABLE productos ADD COLUMN IF NOT EXISTS codigo_personalizado VARCHAR(50);

-- Comentario sobre la nueva columna
COMMENT ON COLUMN productos.codigo_personalizado IS 'Código personalizado del producto definido por la empresa (ej: 330, 420, EL001, ROP001)';

-- Agregar columna codigo_barras a la tabla productos
ALTER TABLE productos ADD COLUMN IF NOT EXISTS codigo_barras VARCHAR(50);

-- Comentario sobre la nueva columna
COMMENT ON COLUMN productos.codigo_barras IS 'Código de barras del producto (EAN-13, UPC, etc.)';

-- Datos de ejemplo para empresas
INSERT INTO empresas (nombre, subdominio, email, telefono, descripcion, logo_url, color_primario, color_secundario, moneda, estado_suscripcion, fecha_fin_prueba, activa, fecha_creacion, fecha_actualizacion) VALUES
('Mi Tienda Ejemplo', 'mitienda', 'admin@mitienda.com', '+1234567890', 'Tienda de ejemplo para demostración', 'https://via.placeholder.com/150', '#3B82F6', '#1E40AF', 'USD', 'PRUEBA', '2024-12-31', true, NOW(), NOW()),
('Electrónicos Pro', 'electronicospro', 'info@electronicospro.com', '+1987654321', 'Especialistas en electrónica', 'https://via.placeholder.com/150', '#10B981', '#059669', 'USD', 'ACTIVA', '2025-12-31', true, NOW(), NOW()),
('Ropa Fashion', 'ropafashion', 'ventas@ropafashion.com', '+1122334455', 'Moda y tendencias', 'https://via.placeholder.com/150', '#F59E0B', '#D97706', 'USD', 'ACTIVA', '2025-12-31', true, NOW(), NOW());

-- Crear tabla historial_inventario si no existe
CREATE TABLE IF NOT EXISTS historial_inventario (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- Relaciones con otras entidades
    producto_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    empresa_id BIGINT NOT NULL,
    
    -- Información de la operación
    tipo_operacion VARCHAR(50) NOT NULL, -- 'INCREMENTO', 'DECREMENTO', 'AJUSTE', 'INVENTARIO_FISICO'
    cantidad INT NOT NULL,
    stock_anterior INT,
    stock_nuevo INT,
    
    -- Información financiera
    precio_unitario DECIMAL(10,2),
    valor_total DECIMAL(10,2),
    
    -- Información adicional
    observacion VARCHAR(500),
    codigo_barras VARCHAR(50),
    metodo_entrada VARCHAR(100), -- 'cámara', 'manual', 'usb'
    
    -- Timestamps
    fecha_operacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Índices para mejorar el rendimiento
    INDEX idx_empresa_id (empresa_id),
    INDEX idx_producto_id (producto_id),
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_fecha_operacion (fecha_operacion),
    INDEX idx_tipo_operacion (tipo_operacion),
    INDEX idx_codigo_barras (codigo_barras),
    
    -- Claves foráneas
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);
