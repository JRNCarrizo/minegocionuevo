-- Crear tabla empresas
CREATE TABLE empresas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    subdominio VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(20),
    direccion VARCHAR(200),
    ciudad VARCHAR(100),
    codigo_postal VARCHAR(20),
    pais VARCHAR(100),
    descripcion VARCHAR(500),
    texto_bienvenida VARCHAR(200),
    
    -- Personalización visual
    logo_url VARCHAR(255),
    color_primario VARCHAR(7) DEFAULT '#3B82F6',
    color_secundario VARCHAR(7) DEFAULT '#1F2937',
    color_acento VARCHAR(7) DEFAULT '#F59E0B',
    color_fondo VARCHAR(7) DEFAULT '#FFFFFF',
    color_texto VARCHAR(7) DEFAULT '#1F2937',
    color_titulo_principal VARCHAR(7) DEFAULT '#1F2937',
    color_card_filtros VARCHAR(7) DEFAULT '#FFFFFF',
    imagen_fondo_url VARCHAR(255),
    moneda VARCHAR(10) DEFAULT 'USD',
    
    -- Redes sociales
    instagram_url VARCHAR(255),
    facebook_url VARCHAR(255),
    
    -- Transferencia bancaria
    transferencia_bancaria_habilitada BOOLEAN DEFAULT false,
    banco VARCHAR(100),
    tipo_cuenta VARCHAR(50),
    numero_cuenta VARCHAR(50),
    cbu VARCHAR(22),
    alias VARCHAR(50),
    titular VARCHAR(100),
    
    -- Configuración del catálogo
    mostrar_stock BOOLEAN DEFAULT true,
    mostrar_categorias BOOLEAN DEFAULT true,
    mostrar_precios BOOLEAN DEFAULT true,
    
    -- Estado de suscripción
    estado_suscripcion VARCHAR(20) DEFAULT 'PRUEBA',
    fecha_fin_prueba TIMESTAMP,
    activa BOOLEAN DEFAULT true,
    fecha_baja TIMESTAMP,
    motivo_baja VARCHAR(500),
    baja_permanente BOOLEAN DEFAULT false,
    
    -- Metadatos
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
); 