-- Script simple para verificar productos en la base de datos

-- 1. Verificar que hay empresas
SELECT 'EMPRESAS' as tabla, COUNT(*) as total FROM empresas;

-- 2. Verificar que hay usuarios
SELECT 'USUARIOS' as tabla, COUNT(*) as total FROM usuarios;

-- 3. Verificar productos totales
SELECT 'PRODUCTOS TOTAL' as tabla, COUNT(*) as total FROM productos;

-- 4. Verificar productos activos con stock
SELECT 'PRODUCTOS ACTIVOS CON STOCK' as tabla, COUNT(*) as total 
FROM productos 
WHERE activo = true AND stock > 0;

-- 5. Verificar productos por empresa
SELECT 'PRODUCTOS POR EMPRESA' as tabla, empresa_id, COUNT(*) as total 
FROM productos 
GROUP BY empresa_id;

-- 6. Mostrar algunos productos de ejemplo
SELECT 'EJEMPLOS DE PRODUCTOS' as tabla, id, nombre, activo, stock, codigo_personalizado, codigo_barras
FROM productos 
WHERE empresa_id = 1 
LIMIT 5; 