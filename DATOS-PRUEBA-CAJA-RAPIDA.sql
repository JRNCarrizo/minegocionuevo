-- Datos de prueba para la Caja Rápida
-- Ejecutar después de crear la empresa y el usuario administrador

-- Insertar productos de prueba para la empresa con ID 1
INSERT INTO productos (nombre, descripcion, precio, stock, stock_minimo, categoria, marca, unidad, sector_almacenamiento, codigo_personalizado, codigo_barras, activo, destacado, empresa_id, fecha_creacion, fecha_actualizacion) VALUES
('Coca Cola 500ml', 'Refresco Coca Cola botella 500ml', 2.50, 50, 10, 'Bebidas', 'Coca Cola', 'Botella', 'Refrigerador 1', 'CC001', '7891234567890', true, true, 1, NOW(), NOW()),
('Pepsi 500ml', 'Refresco Pepsi botella 500ml', 2.30, 45, 10, 'Bebidas', 'Pepsi', 'Botella', 'Refrigerador 1', 'PP001', '7891234567891', true, true, 1, NOW(), NOW()),
('Pan de Molde', 'Pan de molde integral 500g', 3.50, 20, 5, 'Panadería', 'Bimbo', 'Paquete', 'Estante A1', 'PM001', '7891234567892', true, false, 1, NOW(), NOW()),
('Leche Entera 1L', 'Leche entera 1 litro', 4.20, 30, 8, 'Lácteos', 'La Serenísima', 'Litro', 'Refrigerador 2', 'LE001', '7891234567893', true, true, 1, NOW(), NOW()),
('Yogur Natural', 'Yogur natural 200g', 2.80, 25, 5, 'Lácteos', 'La Serenísima', 'Pote', 'Refrigerador 2', 'YN001', '7891234567894', true, false, 1, NOW(), NOW()),
('Manzana Roja', 'Manzana roja por kg', 5.50, 15, 3, 'Frutas', 'Frutas Frescas', 'Kg', 'Estante B1', 'MR001', '7891234567895', true, true, 1, NOW(), NOW()),
('Banana', 'Banana por kg', 4.80, 12, 3, 'Frutas', 'Frutas Frescas', 'Kg', 'Estante B1', 'BN001', '7891234567896', true, false, 1, NOW(), NOW()),
('Arroz Blanco 1kg', 'Arroz blanco 1 kilogramo', 3.20, 40, 10, 'Granos', 'Dos Hermanos', 'Kg', 'Estante C1', 'AB001', '7891234567897', true, true, 1, NOW(), NOW()),
('Aceite de Girasol', 'Aceite de girasol 1L', 6.50, 25, 5, 'Aceites', 'Natura', 'Litro', 'Estante C2', 'AG001', '7891234567898', true, false, 1, NOW(), NOW()),
('Harina 000 1kg', 'Harina 000 1 kilogramo', 2.80, 35, 8, 'Harinas', 'Pureza', 'Kg', 'Estante C3', 'H001', '7891234567899', true, true, 1, NOW(), NOW());

-- Insertar más productos con códigos personalizados
INSERT INTO productos (nombre, descripcion, precio, stock, stock_minimo, categoria, marca, unidad, sector_almacenamiento, codigo_personalizado, codigo_barras, activo, destacado, empresa_id, fecha_creacion, fecha_actualizacion) VALUES
('Vino Tinto Malbec', 'Vino tinto Malbec 750ml', 15.90, 20, 5, 'Vinos', 'Bodega del Valle', 'Botella', 'Estante Vinos', '330', '7891234567900', true, true, 1, NOW(), NOW()),
('Vino Blanco Chardonnay', 'Vino blanco Chardonnay 750ml', 18.50, 15, 5, 'Vinos', 'Bodega del Valle', 'Botella', 'Estante Vinos', '420', '7891234567901', true, true, 1, NOW(), NOW()),
('Cerveza Rubia', 'Cerveza rubia 1L', 8.90, 30, 8, 'Cervezas', 'Quilmes', 'Litro', 'Refrigerador 3', 'CR001', '7891234567902', true, false, 1, NOW(), NOW()),
('Cerveza Negra', 'Cerveza negra 1L', 9.50, 25, 8, 'Cervezas', 'Quilmes', 'Litro', 'Refrigerador 3', 'CN001', '7891234567903', true, false, 1, NOW(), NOW()),
('Agua Mineral 2L', 'Agua mineral sin gas 2L', 3.80, 40, 10, 'Aguas', 'Villavicencio', 'Litro', 'Estante A2', 'AM001', '7891234567904', true, true, 1, NOW(), NOW());

-- Verificar que los productos se insertaron correctamente
SELECT 
    id,
    nombre,
    precio,
    stock,
    codigo_personalizado,
    codigo_barras,
    activo
FROM productos 
WHERE empresa_id = 1 
ORDER BY nombre; 