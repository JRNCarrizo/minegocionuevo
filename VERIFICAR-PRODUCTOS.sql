-- Script para verificar productos en la base de datos
-- Ejecutar en tu base de datos MySQL

-- 1. Verificar que la empresa existe
SELECT id, nombre, subdominio FROM empresas WHERE id = 1;

-- 2. Contar productos de la empresa
SELECT COUNT(*) as total_productos FROM productos WHERE empresa_id = 1;

-- 3. Ver productos activos
SELECT 
    id,
    nombre,
    precio,
    stock,
    codigo_personalizado,
    codigo_barras,
    activo
FROM productos 
WHERE empresa_id = 1 AND activo = true
ORDER BY nombre
LIMIT 10;

-- 4. Ver productos con códigos personalizados
SELECT 
    id,
    nombre,
    codigo_personalizado,
    codigo_barras
FROM productos 
WHERE empresa_id = 1 
    AND (codigo_personalizado IS NOT NULL OR codigo_barras IS NOT NULL)
ORDER BY nombre;

-- 5. Verificar si hay productos con códigos específicos
SELECT 
    id,
    nombre,
    codigo_personalizado,
    codigo_barras
FROM productos 
WHERE empresa_id = 1 
    AND (
        codigo_personalizado IN ('330', '420', 'CC001', 'PP001') 
        OR codigo_barras IN ('7891234567890', '7891234567891')
    ); 