-- Crear tabla permisos_usuario
CREATE TABLE permisos_usuario (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id BIGINT NOT NULL,
    funcionalidad VARCHAR(100) NOT NULL,
    permitido BOOLEAN NOT NULL DEFAULT false,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE (usuario_id, funcionalidad)
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_permisos_usuario_id ON permisos_usuario(usuario_id);
CREATE INDEX idx_permisos_funcionalidad ON permisos_usuario(funcionalidad);
CREATE INDEX idx_permisos_permitido ON permisos_usuario(permitido);
