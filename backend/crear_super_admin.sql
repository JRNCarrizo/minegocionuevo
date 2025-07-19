-- Script para crear el usuario SUPER_ADMIN
-- Ejecutar este script en la base de datos H2

-- 1. Crear empresa del sistema si no existe
INSERT INTO empresas (nombre, subdominio, email, telefono, descripcion, logo_url, color_primario, color_secundario, estado_suscripcion, fecha_fin_prueba, activa, fecha_creacion, fecha_actualizacion)
SELECT 'Sistema MiNegocio', 'sistema', 'sistema@minegocio.com', '+34 000 000 000', 'Empresa del sistema para super administradores', null, '#1f2937', '#374151', 'ACTIVA', DATEADD('MONTH', 12, CURRENT_TIMESTAMP), true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM empresas WHERE email = 'sistema@minegocio.com');

-- 2. Crear usuario SUPER_ADMIN si no existe
-- Password: 32691240Jor (hash BCrypt generado)
INSERT INTO usuarios (nombre, apellidos, email, password, telefono, rol, activo, email_verificado, empresa_id, fecha_creacion, fecha_actualizacion)
SELECT 'Super', 'Administrador', 'jrncarrizo@gmail.com', '$2a$10$Pu4TqrmVkrsfwD1WBRq0Ruin3w96eJSPuLDScl0igGiSH/8os9jwi', '+34 000 000 000', 'SUPER_ADMIN', true, true, 
       (SELECT id FROM empresas WHERE email = 'sistema@minegocio.com' LIMIT 1), 
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'jrncarrizo@gmail.com');

-- 3. Verificar que se creó correctamente
SELECT 
    u.id,
    u.nombre,
    u.apellidos,
    u.email,
    u.rol,
    u.activo,
    u.email_verificado,
    e.nombre as empresa_nombre
FROM usuarios u
LEFT JOIN empresas e ON u.empresa_id = e.id
WHERE u.email = 'jrncarrizo@gmail.com'; 