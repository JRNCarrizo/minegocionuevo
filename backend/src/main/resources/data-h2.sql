-- Datos de prueba para H2 Database (compatible con H2)

-- Insertar empresa de ejemplo (solo si no existe)
INSERT INTO empresas (nombre, subdominio, email, telefono, descripcion, logo_url, color_primario, color_secundario, estado_suscripcion, fecha_fin_prueba, activa, fecha_creacion, fecha_actualizacion)
SELECT 'Tienda Demo', 'demo', 'admin@demo.com', '+34 123 456 789', 'Tienda de demostración del sistema miNegocio', null, '#3B82F6', '#1F2937', 'PRUEBA', DATEADD('MONTH', 1, CURRENT_TIMESTAMP), true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM empresas WHERE email = 'admin@demo.com');

-- Insertar usuario administrador (password: admin123 - BCrypt) (solo si no existe)
INSERT INTO usuarios (nombre, apellidos, email, password, telefono, rol, activo, email_verificado, empresa_id, fecha_creacion, fecha_actualizacion)
SELECT 'Admin', 'Demo', 'admin@demo.com', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', '+34 123 456 789', 'ADMINISTRADOR', true, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'admin@demo.com');

-- Insertar productos (solo si no existen)
INSERT INTO productos (nombre, descripcion, precio, stock, stock_minimo, categoria, marca, unidad, activo, destacado, empresa_id, fecha_creacion, fecha_actualizacion)
SELECT 'Laptop Dell Inspiron 15', 'Laptop para uso profesional con procesador Intel i5, 8GB RAM y 256GB SSD', 899.99, 15, 5, 'Electrónicos', 'Dell', 'unidad', true, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Laptop Dell Inspiron 15' AND empresa_id = 1);

INSERT INTO productos (nombre, descripcion, precio, stock, stock_minimo, categoria, marca, unidad, activo, destacado, empresa_id, fecha_creacion, fecha_actualizacion)
SELECT 'Mouse Inalámbrico Logitech', 'Mouse inalámbrico con sensor óptico de alta precisión', 29.99, 50, 10, 'Periféricos', 'Logitech', 'unidad', true, false, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Mouse Inalámbrico Logitech' AND empresa_id = 1);

INSERT INTO productos (nombre, descripcion, precio, stock, stock_minimo, categoria, marca, unidad, activo, destacado, empresa_id, fecha_creacion, fecha_actualizacion)
SELECT 'Teclado Mecánico RGB', 'Teclado mecánico con switches Cherry MX y retroiluminación RGB', 89.99, 25, 5, 'Periféricos', 'Corsair', 'unidad', true, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Teclado Mecánico RGB' AND empresa_id = 1);

-- Insertar clientes de ejemplo (password: cliente123 - BCrypt) (solo si no existen)
INSERT INTO clientes (nombre, apellidos, email, password, telefono, direccion, ciudad, codigo_postal, pais, tipo, activo, acepta_marketing, email_verificado, empresa_id, fecha_creacion, fecha_actualizacion)
SELECT 'Juan', 'Pérez García', 'juan.perez@email.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iYqiSfFGhO4tEHy0LYIFGXcP.Wce', '+34 987 654 321', 'Calle Mayor 123', 'Madrid', '28001', 'España', 'REGULAR', true, true, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE email = 'juan.perez@email.com' AND empresa_id = 1);

INSERT INTO clientes (nombre, apellidos, email, password, telefono, direccion, ciudad, codigo_postal, pais, tipo, activo, acepta_marketing, email_verificado, empresa_id, fecha_creacion, fecha_actualizacion)
SELECT 'María', 'López Rodríguez', 'maria.lopez@email.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iYqiSfFGhO4tEHy0LYIFGXcP.Wce', '+34 654 321 987', 'Avenida de la Constitución 45', 'Barcelona', '08001', 'España', 'PREMIUM', true, false, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE email = 'maria.lopez@email.com' AND empresa_id = 1);

-- Insertar pedidos de ejemplo (solo si no existen)
INSERT INTO pedidos (numero_pedido, estado, total, subtotal, impuestos, descuento, observaciones, direccion_entrega, cliente_id, empresa_id, fecha_creacion, fecha_actualizacion)
SELECT 'PED-001', 'ENTREGADO', 929.98, 929.98, 0, 0, 'Entrega urgente', 'Calle Mayor 123, Madrid', 1, 1, DATEADD('DAY', -5, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM pedidos WHERE numero_pedido = 'PED-001');

INSERT INTO pedidos (numero_pedido, estado, total, subtotal, impuestos, descuento, observaciones, direccion_entrega, cliente_id, empresa_id, fecha_creacion, fecha_actualizacion)
SELECT 'PED-002', 'PREPARANDO', 379.98, 379.98, 0, 0, null, 'Avenida de la Constitución 45, Barcelona', 2, 1, DATEADD('DAY', -2, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM pedidos WHERE numero_pedido = 'PED-002');

-- Insertar detalles de pedidos (solo si no existen)
INSERT INTO detalle_pedidos (cantidad, precio_unitario, precio_total, producto_id, pedido_id, nombre_producto, descripcion_producto, categoria_producto, marca_producto, fecha_creacion)
SELECT 1, 899.99, 899.99, 1, 1, 'Laptop Dell Inspiron 15', 'Laptop para uso profesional', 'Electrónicos', 'Dell', DATEADD('DAY', -5, CURRENT_TIMESTAMP)
WHERE NOT EXISTS (SELECT 1 FROM detalle_pedidos WHERE pedido_id = 1 AND producto_id = 1);

INSERT INTO detalle_pedidos (cantidad, precio_unitario, precio_total, producto_id, pedido_id, nombre_producto, descripcion_producto, categoria_producto, marca_producto, fecha_creacion)
SELECT 1, 29.99, 29.99, 2, 1, 'Mouse Inalámbrico Logitech', 'Mouse inalámbrico ergonómico', 'Electrónicos', 'Logitech', DATEADD('DAY', -5, CURRENT_TIMESTAMP)
WHERE NOT EXISTS (SELECT 1 FROM detalle_pedidos WHERE pedido_id = 1 AND producto_id = 2);

-- Insertar mensajes de ejemplo (solo si no existen)
INSERT INTO mensajes (asunto, contenido, tipo, estado, leido, cliente_id, empresa_id, producto_id, fecha_creacion, fecha_actualizacion)
SELECT 'Consulta sobre Laptop Dell', '¿La laptop incluye Office? ¿Cuál es la garantía?', 'CONSULTA', 'PENDIENTE', false, 1, 1, 1, DATEADD('HOUR', -2, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mensajes WHERE asunto = 'Consulta sobre Laptop Dell' AND cliente_id = 1);

-- Insertar empresa del sistema para SUPER_ADMIN (solo si no existe)
INSERT INTO empresas (nombre, subdominio, email, telefono, descripcion, logo_url, color_primario, color_secundario, estado_suscripcion, fecha_fin_prueba, activa, fecha_creacion, fecha_actualizacion)
SELECT 'Sistema MiNegocio', 'sistema', 'sistema@minegocio.com', '+34 000 000 000', 'Empresa del sistema para super administradores', null, '#1f2937', '#374151', 'ACTIVA', DATEADD('MONTH', 12, CURRENT_TIMESTAMP), true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM empresas WHERE email = 'sistema@minegocio.com');

-- Insertar usuario SUPER_ADMIN (solo si no existe)
INSERT INTO usuarios (nombre, apellidos, email, password, telefono, rol, activo, email_verificado, empresa_id, fecha_creacion, fecha_actualizacion)
SELECT 'Super', 'Administrador', 'jrncarrizo@gmail.com', '$2a$10$Pu4TqrmVkrsfwD1WBRq0Ruin3w96eJSPuLDScl0igGiSH/8os9jwi', '+34 000 000 000', 'SUPER_ADMIN', true, true, 
       (SELECT id FROM empresas WHERE email = 'sistema@minegocio.com' LIMIT 1), 
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'jrncarrizo@gmail.com'); 