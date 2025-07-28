-- Datos de prueba para H2 Database (desarrollo local)
-- Script simplificado para evitar errores de ejecución

-- Insertar empresa de ejemplo (usando MERGE para H2)
MERGE INTO empresas (id, nombre, subdominio, email, telefono, descripcion, logo_url, color_primario, color_secundario, estado_suscripcion, fecha_fin_prueba, activa, fecha_creacion, fecha_actualizacion)
KEY(id) VALUES (1, 'Tienda Demo', 'demo', 'admin@demo.com', '+34 123 456 789', 'Tienda de demostración del sistema miNegocio', null, '#3B82F6', '#1F2937', 'PRUEBA', DATEADD('MONTH', 1, CURRENT_TIMESTAMP), true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertar usuario administrador (password: admin123)
MERGE INTO usuarios (id, nombre, apellidos, email, password, telefono, rol, activo, email_verificado, empresa_id, fecha_creacion, fecha_actualizacion)
KEY(id) VALUES (1, 'Admin', 'Demo', 'admin@demo.com', '$2a$10$dXJ3SW6G7P50lGmMkkmwe.20cQQubK3.HZWzG3YB1tlRy.fqvM/BG', '+34 123 456 789', 'ADMINISTRADOR', true, true, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertar empresa del sistema para SUPER_ADMIN
MERGE INTO empresas (id, nombre, subdominio, email, telefono, descripcion, logo_url, color_primario, color_secundario, estado_suscripcion, fecha_fin_prueba, activa, fecha_creacion, fecha_actualizacion)
KEY(id) VALUES (2, 'Sistema MiNegocio', 'sistema', 'sistema@minegocio.com', '+34 000 000 000', 'Empresa del sistema para super administradores', null, '#1f2937', '#374151', 'ACTIVA', DATEADD('MONTH', 12, CURRENT_TIMESTAMP), true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Insertar usuario SUPER_ADMIN
MERGE INTO usuarios (id, nombre, apellidos, email, password, telefono, rol, activo, email_verificado, empresa_id, fecha_creacion, fecha_actualizacion)
KEY(id) VALUES (2, 'Super', 'Administrador', 'jrncarrizo@gmail.com', '$2a$10$Pu4TqrmVkrsfwD1WBRq0Ruin3w96eJSPuLDScl0igGiSH/8os9jwi', '+34 000 000 000', 'SUPER_ADMIN', true, true, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP); 