-- Datos de prueba para el sistema miNegocio

-- Insertar empresa de ejemplo (solo si no existe)
INSERT INTO empresas (nombre, subdominio, email, telefono, descripcion, logo_url, color_primario, color_secundario, estado_suscripcion, fecha_fin_prueba, activa, fecha_creacion, fecha_actualizacion)
SELECT 'Tienda Demo', 'demo', 'admin@demo.com', '+34 123 456 789', 'Tienda de demostración del sistema miNegocio', null, '#3B82F6', '#1F2937', 'PRUEBA', CURRENT_TIMESTAMP + interval '1 month', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM empresas WHERE email = 'admin@demo.com');

-- Insertar usuario administrador (password: admin123 - BCrypt) (solo si no existe)
INSERT INTO usuarios (nombre, apellidos, email, password, telefono, rol, activo, email_verificado, empresa_id, fecha_creacion, fecha_actualizacion)
SELECT 'Admin', 'Demo', 'admin@demo.com', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', '+34 123 456 789', 'ADMINISTRADOR', true, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'admin@demo.com');



-- Insertar productos (sin imágenes en la tabla principal) (solo si no existen)
INSERT INTO productos (nombre, descripcion, precio, stock, stock_minimo, categoria, marca, unidad, activo, destacado, empresa_id, fecha_creacion, fecha_actualizacion)
SELECT 'Laptop Dell Inspiron 15', 'Laptop para uso profesional con procesador Intel i5, 8GB RAM y 256GB SSD', 899.99, 15, 5, 'Electrónicos', 'Dell', 'unidad', true, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Laptop Dell Inspiron 15' AND empresa_id = 1);

INSERT INTO productos (nombre, descripcion, precio, stock, stock_minimo, categoria, marca, unidad, activo, destacado, empresa_id, fecha_creacion, fecha_actualizacion)
SELECT 'Mouse Inalámbrico Logitech', 'Mouse inalámbrico con sensor óptico de alta precisión', 29.99, 50, 10, 'Periféricos', 'Logitech', 'unidad', true, false, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Mouse Inalámbrico Logitech' AND empresa_id = 1);

INSERT INTO productos (nombre, descripcion, precio, stock, stock_minimo, categoria, marca, unidad, activo, destacado, empresa_id, fecha_creacion, fecha_actualizacion)
SELECT 'Teclado Mecánico RGB', 'Teclado mecánico con switches Cherry MX y retroiluminación RGB', 89.99, 25, 5, 'Periféricos', 'Corsair', 'unidad', true, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Teclado Mecánico RGB' AND empresa_id = 1);

INSERT INTO productos (nombre, descripcion, precio, stock, stock_minimo, categoria, marca, unidad, activo, destacado, empresa_id, fecha_creacion, fecha_actualizacion)
SELECT 'Monitor 24" Full HD', 'Monitor LED de 24 pulgadas con resolución Full HD 1920x1080', 199.99, 30, 8, 'Monitores', 'Samsung', 'unidad', true, false, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Monitor 24" Full HD' AND empresa_id = 1);

INSERT INTO productos (nombre, descripcion, precio, stock, stock_minimo, categoria, marca, unidad, activo, destacado, empresa_id, fecha_creacion, fecha_actualizacion)
SELECT 'Disco Duro Externo 1TB', 'Disco duro externo portátil de 1TB con conexión USB 3.0', 59.99, 40, 12, 'Almacenamiento', 'Seagate', 'unidad', true, false, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM productos WHERE nombre = 'Disco Duro Externo 1TB' AND empresa_id = 1);

-- Insertar imágenes de productos en tabla separada (solo si no existen)
INSERT INTO producto_imagenes (producto_id, url_imagen)
SELECT 1, '/uploads/laptop-dell.jpg'
WHERE NOT EXISTS (SELECT 1 FROM producto_imagenes WHERE producto_id = 1 AND url_imagen = '/uploads/laptop-dell.jpg');

INSERT INTO producto_imagenes (producto_id, url_imagen)
SELECT 1, '/uploads/laptop-dell-2.jpg'
WHERE NOT EXISTS (SELECT 1 FROM producto_imagenes WHERE producto_id = 1 AND url_imagen = '/uploads/laptop-dell-2.jpg');

INSERT INTO producto_imagenes (producto_id, url_imagen)
SELECT 2, '/uploads/mouse-logitech.jpg'
WHERE NOT EXISTS (SELECT 1 FROM producto_imagenes WHERE producto_id = 2 AND url_imagen = '/uploads/mouse-logitech.jpg');

INSERT INTO producto_imagenes (producto_id, url_imagen)
SELECT 3, '/uploads/teclado-rgb.jpg'
WHERE NOT EXISTS (SELECT 1 FROM producto_imagenes WHERE producto_id = 3 AND url_imagen = '/uploads/teclado-rgb.jpg');

INSERT INTO producto_imagenes (producto_id, url_imagen)
SELECT 3, '/uploads/teclado-rgb-2.jpg'
WHERE NOT EXISTS (SELECT 1 FROM producto_imagenes WHERE producto_id = 3 AND url_imagen = '/uploads/teclado-rgb-2.jpg');

INSERT INTO producto_imagenes (producto_id, url_imagen)
SELECT 4, '/uploads/monitor-samsung.jpg'
WHERE NOT EXISTS (SELECT 1 FROM producto_imagenes WHERE producto_id = 4 AND url_imagen = '/uploads/monitor-samsung.jpg');

INSERT INTO producto_imagenes (producto_id, url_imagen)
SELECT 5, '/uploads/silla-ergonomica.jpg'
WHERE NOT EXISTS (SELECT 1 FROM producto_imagenes WHERE producto_id = 5 AND url_imagen = '/uploads/silla-ergonomica.jpg');

-- Insertar clientes de ejemplo (password: cliente123 - BCrypt) (solo si no existen)
INSERT INTO clientes (nombre, apellidos, email, password, telefono, direccion, ciudad, codigo_postal, pais, tipo, activo, acepta_marketing, email_verificado, empresa_id, fecha_creacion, fecha_actualizacion)
SELECT 'Juan', 'Pérez García', 'juan.perez@email.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iYqiSfFGhO4tEHy0LYIFGXcP.Wce', '+34 987 654 321', 'Calle Mayor 123', 'Madrid', '28001', 'España', 'REGULAR', true, true, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE email = 'juan.perez@email.com' AND empresa_id = 1);

INSERT INTO clientes (nombre, apellidos, email, password, telefono, direccion, ciudad, codigo_postal, pais, tipo, activo, acepta_marketing, email_verificado, empresa_id, fecha_creacion, fecha_actualizacion)
SELECT 'María', 'López Rodríguez', 'maria.lopez@email.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iYqiSfFGhO4tEHy0LYIFGXcP.Wce', '+34 654 321 987', 'Avenida de la Constitución 45', 'Barcelona', '08001', 'España', 'PREMIUM', true, false, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE email = 'maria.lopez@email.com' AND empresa_id = 1);

INSERT INTO clientes (nombre, apellidos, email, password, telefono, direccion, ciudad, codigo_postal, pais, tipo, activo, acepta_marketing, email_verificado, empresa_id, fecha_creacion, fecha_actualizacion)
SELECT 'Carlos', 'González Martín', 'carlos.gonzalez@email.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iYqiSfFGhO4tEHy0LYIFGXcP.Wce', '+34 321 987 654', 'Plaza España 7', 'Valencia', '46001', 'España', 'REGULAR', true, true, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM clientes WHERE email = 'carlos.gonzalez@email.com' AND empresa_id = 1);

-- Insertar pedidos de ejemplo (solo si no existen)
INSERT INTO pedidos (numero_pedido, estado, total, subtotal, impuestos, descuento, observaciones, direccion_entrega, cliente_id, empresa_id, fecha_creacion, fecha_actualizacion)
SELECT 'PED-001', 'ENTREGADO', 929.98, 929.98, 0, 0, 'Entrega urgente', 'Calle Mayor 123, Madrid', 1, 1, CURRENT_TIMESTAMP + interval '-5 day', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM pedidos WHERE numero_pedido = 'PED-001');

INSERT INTO pedidos (numero_pedido, estado, total, subtotal, impuestos, descuento, observaciones, direccion_entrega, cliente_id, empresa_id, fecha_creacion, fecha_actualizacion)
SELECT 'PED-002', 'PREPARANDO', 379.98, 379.98, 0, 0, null, 'Avenida de la Constitución 45, Barcelona', 2, 1, CURRENT_TIMESTAMP + interval '-2 day', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM pedidos WHERE numero_pedido = 'PED-002');

INSERT INTO pedidos (numero_pedido, estado, total, subtotal, impuestos, descuento, observaciones, direccion_entrega, cliente_id, empresa_id, fecha_creacion, fecha_actualizacion)
SELECT 'PED-003', 'PENDIENTE', 79.99, 79.99, 0, 0, 'Llamar antes de entregar', 'Plaza España 7, Valencia', 3, 1, CURRENT_TIMESTAMP + interval '-1 day', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM pedidos WHERE numero_pedido = 'PED-003');

-- Insertar detalles de pedidos (solo si no existen)
INSERT INTO detalle_pedidos (cantidad, precio_unitario, precio_total, producto_id, pedido_id, nombre_producto, descripcion_producto, categoria_producto, marca_producto, fecha_creacion)
SELECT 1, 899.99, 899.99, 1, 1, 'Laptop Dell Inspiron 15', 'Laptop para uso profesional', 'Electrónicos', 'Dell', CURRENT_TIMESTAMP + interval '-5 day'
WHERE NOT EXISTS (SELECT 1 FROM detalle_pedidos WHERE pedido_id = 1 AND producto_id = 1);

INSERT INTO detalle_pedidos (cantidad, precio_unitario, precio_total, producto_id, pedido_id, nombre_producto, descripcion_producto, categoria_producto, marca_producto, fecha_creacion)
SELECT 1, 29.99, 29.99, 2, 1, 'Mouse Inalámbrico Logitech', 'Mouse inalámbrico ergonómico', 'Electrónicos', 'Logitech', CURRENT_TIMESTAMP + interval '-5 day'
WHERE NOT EXISTS (SELECT 1 FROM detalle_pedidos WHERE pedido_id = 1 AND producto_id = 2);

INSERT INTO detalle_pedidos (cantidad, precio_unitario, precio_total, producto_id, pedido_id, nombre_producto, descripcion_producto, categoria_producto, marca_producto, fecha_creacion)
SELECT 1, 79.99, 79.99, 3, 2, 'Teclado Mecánico RGB', 'Teclado mecánico con retroiluminación RGB', 'Electrónicos', 'Corsair', CURRENT_TIMESTAMP + interval '-2 day'
WHERE NOT EXISTS (SELECT 1 FROM detalle_pedidos WHERE pedido_id = 2 AND producto_id = 3);

INSERT INTO detalle_pedidos (cantidad, precio_unitario, precio_total, producto_id, pedido_id, nombre_producto, descripcion_producto, categoria_producto, marca_producto, fecha_creacion)
SELECT 1, 299.99, 299.99, 5, 2, 'Silla Ergonómica de Oficina', 'Silla ergonómica con soporte lumbar', 'Mobiliario', 'Herman Miller', CURRENT_TIMESTAMP + interval '-2 day'
WHERE NOT EXISTS (SELECT 1 FROM detalle_pedidos WHERE pedido_id = 2 AND producto_id = 5);

INSERT INTO detalle_pedidos (cantidad, precio_unitario, precio_total, producto_id, pedido_id, nombre_producto, descripcion_producto, categoria_producto, marca_producto, fecha_creacion)
SELECT 1, 79.99, 79.99, 3, 3, 'Teclado Mecánico RGB', 'Teclado mecánico con retroiluminación RGB', 'Electrónicos', 'Corsair', CURRENT_TIMESTAMP + interval '-1 day'
WHERE NOT EXISTS (SELECT 1 FROM detalle_pedidos WHERE pedido_id = 3 AND producto_id = 3);

-- Insertar mensajes de ejemplo (solo si no existen)
INSERT INTO mensajes (asunto, contenido, tipo, estado, leido, cliente_id, empresa_id, producto_id, fecha_creacion, fecha_actualizacion)
SELECT 'Consulta sobre Laptop Dell', '¿La laptop incluye Office? ¿Cuál es la garantía?', 'CONSULTA', 'PENDIENTE', false, 1, 1, 1, CURRENT_TIMESTAMP + interval '-2 hour', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mensajes WHERE asunto = 'Consulta sobre Laptop Dell' AND cliente_id = 1);

INSERT INTO mensajes (asunto, contenido, tipo, estado, leido, cliente_id, empresa_id, producto_id, fecha_creacion, fecha_actualizacion)
SELECT 'Problema con el pedido', 'Mi pedido está marcado como preparando pero han pasado 3 días', 'RECLAMO', 'PENDIENTE', false, 2, 1, null, CURRENT_TIMESTAMP + interval '-1 hour', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mensajes WHERE asunto = 'Problema con el pedido' AND cliente_id = 2);

INSERT INTO mensajes (asunto, contenido, tipo, estado, leido, cliente_id, empresa_id, producto_id, fecha_creacion, fecha_actualizacion)
SELECT 'Sugerencia de producto', 'Estaría bien que añadieran tablets a su catálogo', 'SUGERENCIA', 'PENDIENTE', false, 3, 1, null, CURRENT_TIMESTAMP + interval '-30 minute', CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mensajes WHERE asunto = 'Sugerencia de producto' AND cliente_id = 3);

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

-- Datos de ejemplo para empresas (solo si no existen)
INSERT INTO empresas (nombre, subdominio, email, telefono, descripcion, logo_url, color_primario, color_secundario, moneda, estado_suscripcion, fecha_fin_prueba, activa, fecha_creacion, fecha_actualizacion)
SELECT 'Mi Tienda Ejemplo', 'mitienda', 'admin@mitienda.com', '+1234567890', 'Tienda de ejemplo para demostración', 'https://via.placeholder.com/150', '#3B82F6', '#1E40AF', 'USD', 'PRUEBA', '2024-12-31', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM empresas WHERE email = 'admin@mitienda.com');

INSERT INTO empresas (nombre, subdominio, email, telefono, descripcion, logo_url, color_primario, color_secundario, moneda, estado_suscripcion, fecha_fin_prueba, activa, fecha_creacion, fecha_actualizacion)
SELECT 'Electrónicos Pro', 'electronicospro', 'info@electronicospro.com', '+1987654321', 'Especialistas en electrónica', 'https://via.placeholder.com/150', '#10B981', '#059669', 'USD', 'ACTIVA', '2025-12-31', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM empresas WHERE email = 'info@electronicospro.com');

INSERT INTO empresas (nombre, subdominio, email, telefono, descripcion, logo_url, color_primario, color_secundario, moneda, estado_suscripcion, fecha_fin_prueba, activa, fecha_creacion, fecha_actualizacion)
SELECT 'Ropa Fashion', 'ropafashion', 'ventas@ropafashion.com', '+1122334455', 'Moda y tendencias', 'https://via.placeholder.com/150', '#F59E0B', '#D97706', 'USD', 'ACTIVA', '2025-12-31', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM empresas WHERE email = 'ventas@ropafashion.com');

-- Crear tabla historial_inventario si no existe
CREATE TABLE IF NOT EXISTS historial_inventario (
    id BIGSERIAL PRIMARY KEY,
    
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
    
    -- Claves foráneas
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_historial_empresa_id ON historial_inventario (empresa_id);
CREATE INDEX IF NOT EXISTS idx_historial_producto_id ON historial_inventario (producto_id);
CREATE INDEX IF NOT EXISTS idx_historial_usuario_id ON historial_inventario (usuario_id);
CREATE INDEX IF NOT EXISTS idx_historial_fecha_operacion ON historial_inventario (fecha_operacion);
CREATE INDEX IF NOT EXISTS idx_historial_tipo_operacion ON historial_inventario (tipo_operacion);
CREATE INDEX IF NOT EXISTS idx_historial_codigo_barras ON historial_inventario (codigo_barras);

-- Insertar empresa del sistema para SUPER_ADMIN (solo si no existe)
INSERT INTO empresas (nombre, subdominio, email, telefono, descripcion, logo_url, color_primario, color_secundario, estado_suscripcion, fecha_fin_prueba, activa, fecha_creacion, fecha_actualizacion)
SELECT 'Sistema MiNegocio', 'sistema', 'sistema@minegocio.com', '+34 000 000 000', 'Empresa del sistema para super administradores', null, '#1f2937', '#374151', 'ACTIVA', CURRENT_TIMESTAMP + interval '12 month', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM empresas WHERE email = 'sistema@minegocio.com');

-- Insertar usuario SUPER_ADMIN (solo si no existe)
-- Insertar usuario SUPER_ADMIN (solo si no existe)
-- Password: 32691240Jor (hash generado con BCrypt)
INSERT INTO usuarios (nombre, apellidos, email, password, telefono, rol, activo, email_verificado, empresa_id, fecha_creacion, fecha_actualizacion)
SELECT 'Super', 'Administrador', 'jrncarrizo@gmail.com', '$2a$10$Pu4TqrmVkrsfwD1WBRq0Ruin3w96eJSPuLDScl0igGiSH/8os9jwi', '+34 000 000 000', 'SUPER_ADMIN', true, true, 
       (SELECT id FROM empresas WHERE email = 'sistema@minegocio.com' LIMIT 1), 
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'jrncarrizo@gmail.com');
