-- Migración simple para agregar el super admin
-- Hibernate manejará automáticamente el enum actualizado

-- Insertar empresa del sistema para super admin (solo si no existe)
INSERT INTO empresas (nombre, subdominio, email, telefono, descripcion, logo_url, color_primario, color_secundario, estado_suscripcion, fecha_fin_prueba, activa, fecha_creacion, fecha_actualizacion)
SELECT 'Sistema MiNegocio', 'sistema', 'admin@minegocio.com', '+54 9 11 1234-5678', 'Empresa del sistema para super administrador', null, '#1F2937', '#3B82F6', 'ACTIVA', DATEADD('YEAR', 10, CURRENT_TIMESTAMP), true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM empresas WHERE subdominio = 'sistema');

-- Insertar usuario super admin (password: 32691240Jor - BCrypt) (solo si no existe)
-- Nota: El rol se insertará como string y Hibernate lo convertirá automáticamente
INSERT INTO usuarios (nombre, apellidos, email, password, telefono, rol, activo, email_verificado, empresa_id, fecha_creacion, fecha_actualizacion)
SELECT 'Jorge', 'Carrizo', 'jrncarrizo@gmail.com', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', '+54 9 11 1234-5678', 'SUPER_ADMIN', true, true, 
       (SELECT id FROM empresas WHERE subdominio = 'sistema'), 
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'jrncarrizo@gmail.com'); 