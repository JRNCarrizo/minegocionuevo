-- Datos de prueba para el sistema miNegocio

-- Insertar empresa de ejemplo
INSERT INTO empresas (nombre, subdominio, email, telefono, descripcion, logo_url, color_primario, color_secundario, estado_suscripcion, fecha_fin_prueba, activa, fecha_creacion, fecha_actualizacion)
VALUES ('Tienda Demo', 'demo', 'admin@demo.com', '+34 123 456 789', 'Tienda de demostración del sistema miNegocio', null, '#3B82F6', '#1F2937', 'PRUEBA', DATEADD('MONTH', 1, CURRENT_TIMESTAMP), true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertar usuario administrador (password: admin123 - BCrypt)
INSERT INTO usuarios (nombre, apellidos, email, password, telefono, rol, activo, email_verificado, empresa_id, fecha_creacion, fecha_actualizacion)
VALUES ('Admin', 'Demo', 'admin@demo.com', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', '+34 123 456 789', 'ADMINISTRADOR', true, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

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
INSERT INTO detalle_pedidos (cantidad, precio_unitario, precio_total, producto_id, pedido_id, nombre_producto, descripcion_producto, categoria_producto, fecha_creacion)
VALUES 
-- Pedido 1
(1, 899.99, 899.99, 1, 1, 'Laptop Dell Inspiron 15', 'Laptop para uso profesional', 'Electrónicos', DATEADD('DAY', -5, CURRENT_TIMESTAMP)),
(1, 29.99, 29.99, 2, 1, 'Mouse Inalámbrico Logitech', 'Mouse inalámbrico ergonómico', 'Electrónicos', DATEADD('DAY', -5, CURRENT_TIMESTAMP)),
-- Pedido 2  
(1, 79.99, 79.99, 3, 2, 'Teclado Mecánico RGB', 'Teclado mecánico con retroiluminación RGB', 'Electrónicos', DATEADD('DAY', -2, CURRENT_TIMESTAMP)),
(1, 299.99, 299.99, 5, 2, 'Silla Ergonómica de Oficina', 'Silla ergonómica con soporte lumbar', 'Mobiliario', DATEADD('DAY', -2, CURRENT_TIMESTAMP)),
-- Pedido 3
(1, 79.99, 79.99, 3, 3, 'Teclado Mecánico RGB', 'Teclado mecánico con retroiluminación RGB', 'Electrónicos', DATEADD('DAY', -1, CURRENT_TIMESTAMP));

-- Insertar mensajes de ejemplo
INSERT INTO mensajes (asunto, contenido, tipo, estado, leido, cliente_id, empresa_id, producto_id, fecha_creacion, fecha_actualizacion)
VALUES 
('Consulta sobre Laptop Dell', '¿La laptop incluye Office? ¿Cuál es la garantía?', 'CONSULTA', 'PENDIENTE', false, 1, 1, 1, DATEADD('HOUR', -2, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP),
('Problema con el pedido', 'Mi pedido está marcado como preparando pero han pasado 3 días', 'RECLAMO', 'PENDIENTE', false, 2, 1, null, DATEADD('HOUR', -1, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP),
('Sugerencia de producto', 'Estaría bien que añadieran tablets a su catálogo', 'SUGERENCIA', 'PENDIENTE', false, 3, 1, null, DATEADD('MINUTE', -30, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP);
