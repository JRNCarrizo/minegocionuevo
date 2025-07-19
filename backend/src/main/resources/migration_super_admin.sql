-- Script de migración para el panel de super administrador
-- Este script crea las tablas necesarias e inserta datos iniciales

-- Crear tabla de planes
CREATE TABLE IF NOT EXISTS planes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion VARCHAR(500),
    precio DECIMAL(10,2) NOT NULL,
    precio_anual DECIMAL(10,2),
    moneda VARCHAR(3) DEFAULT 'USD',
    tipo VARCHAR(20) NOT NULL DEFAULT 'GRATUITO',
    activo BOOLEAN DEFAULT TRUE,
    limite_productos INT,
    limite_usuarios INT,
    limite_clientes INT,
    limite_almacenamiento_mb INT,
    incluye_analiticas BOOLEAN DEFAULT FALSE,
    incluye_soporte_prioritario BOOLEAN DEFAULT FALSE,
    incluye_personalizacion_avanzada BOOLEAN DEFAULT FALSE,
    incluye_api_access BOOLEAN DEFAULT FALSE,
    incluye_backup_automatico BOOLEAN DEFAULT FALSE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Crear tabla de super administradores
CREATE TABLE IF NOT EXISTS super_admins (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    rol VARCHAR(20) NOT NULL DEFAULT 'ADMIN',
    activo BOOLEAN DEFAULT TRUE,
    email_verificado BOOLEAN DEFAULT FALSE,
    token_verificacion VARCHAR(255),
    ultimo_acceso TIMESTAMP,
    fecha_ultimo_cambio_password TIMESTAMP,
    requiere_cambio_password BOOLEAN DEFAULT FALSE,
    intentos_fallidos_login INT DEFAULT 0,
    cuenta_bloqueada BOOLEAN DEFAULT FALSE,
    fecha_desbloqueo TIMESTAMP,
    observaciones VARCHAR(500),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Crear tabla de suscripciones
CREATE TABLE IF NOT EXISTS suscripciones (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    empresa_id BIGINT NOT NULL,
    plan_id BIGINT NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVA',
    tipo_facturacion VARCHAR(20) NOT NULL DEFAULT 'MENSUAL',
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP,
    fecha_proximo_cobro TIMESTAMP,
    fecha_cancelacion TIMESTAMP,
    precio DECIMAL(10,2),
    moneda VARCHAR(3) DEFAULT 'USD',
    metodo_pago VARCHAR(100),
    referencia_pago VARCHAR(255),
    facturacion_automatica BOOLEAN DEFAULT TRUE,
    notificaciones_activas BOOLEAN DEFAULT TRUE,
    observaciones VARCHAR(500),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES planes(id) ON DELETE CASCADE
);

-- Insertar planes por defecto
INSERT INTO planes (nombre, descripcion, precio, precio_anual, tipo, limite_productos, limite_usuarios, limite_clientes, incluye_analiticas, incluye_soporte_prioritario) VALUES
('Gratuito', 'Plan básico gratuito con funcionalidades limitadas', 0.00, 0.00, 'GRATUITO', 50, 1, 100, FALSE, FALSE),
('Básico', 'Plan básico para pequeñas empresas', 29.99, 299.99, 'BASICO', 500, 3, 1000, TRUE, FALSE),
('Profesional', 'Plan profesional para empresas en crecimiento', 79.99, 799.99, 'PROFESIONAL', 2000, 10, 5000, TRUE, TRUE),
('Enterprise', 'Plan enterprise para grandes empresas', 199.99, 1999.99, 'ENTERPRISE', 10000, 50, 50000, TRUE, TRUE);

-- Insertar super administrador por defecto
-- Password: admin123 (debe ser hasheado en producción)
INSERT INTO super_admins (nombre, apellidos, email, password, rol, activo, email_verificado) VALUES
('Super', 'Administrador', 'admin@minegocio.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', 'SUPER_ADMIN', TRUE, TRUE);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_suscripciones_empresa_id ON suscripciones(empresa_id);
CREATE INDEX idx_suscripciones_plan_id ON suscripciones(plan_id);
CREATE INDEX idx_suscripciones_estado ON suscripciones(estado);
CREATE INDEX idx_suscripciones_fecha_fin ON suscripciones(fecha_fin);
CREATE INDEX idx_super_admins_email ON super_admins(email);
CREATE INDEX idx_super_admins_rol ON super_admins(rol);
CREATE INDEX idx_planes_tipo ON planes(tipo);
CREATE INDEX idx_planes_activo ON planes(activo); 

-- Script para crear el superusuario del sistema
-- Empresa: Sistema MiNegocio (Super Admin)
-- Usuario: jrncarrizo@gmail.com / 32691240Jor.

-- Insertar empresa del sistema (solo si no existe)
INSERT INTO empresas (nombre, subdominio, email, telefono, descripcion, logo_url, color_primario, color_secundario, estado_suscripcion, fecha_fin_prueba, activa, fecha_creacion, fecha_actualizacion)
SELECT 'Sistema MiNegocio', 'sistema', 'admin@minegocio.com', '+54 9 11 1234-5678', 'Empresa del sistema para super administrador', null, '#1F2937', '#3B82F6', 'ACTIVA', DATEADD('YEAR', 10, CURRENT_TIMESTAMP), true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM empresas WHERE subdominio = 'sistema');

-- Insertar usuario super admin (password: 32691240Jor. - BCrypt)
-- Hash generado para la contraseña: 32691240Jor.
INSERT INTO usuarios (nombre, apellidos, email, password, telefono, rol, activo, email_verificado, empresa_id, fecha_creacion, fecha_actualizacion)
SELECT 'Jorge', 'Carrizo', 'jrncarrizo@gmail.com', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iKTVEFDa', '+54 9 11 1234-5678', 'SUPER_ADMIN', true, true, 
       (SELECT id FROM empresas WHERE subdominio = 'sistema'), 
       CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE email = 'jrncarrizo@gmail.com');

-- Verificar que se creó correctamente
SELECT 'Super Admin creado:' as mensaje, u.nombre, u.apellidos, u.email, u.rol, e.nombre as empresa
FROM usuarios u 
JOIN empresas e ON u.empresa_id = e.id 
WHERE u.email = 'jrncarrizo@gmail.com'; 