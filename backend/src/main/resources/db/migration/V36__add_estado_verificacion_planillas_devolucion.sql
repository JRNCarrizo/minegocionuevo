-- Agregar campos de estado y verificación a planillas de devoluciones
ALTER TABLE planillas_devoluciones 
ADD COLUMN estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE_VERIFICACION',
ADD COLUMN usuario_verificacion_id BIGINT,
ADD COLUMN fecha_verificacion TIMESTAMP;

-- Agregar foreign key para usuario de verificación
ALTER TABLE planillas_devoluciones 
ADD CONSTRAINT fk_planilla_devolucion_usuario_verificacion 
FOREIGN KEY (usuario_verificacion_id) REFERENCES usuarios(id);

-- Crear índice para mejorar consultas por estado
CREATE INDEX idx_planillas_devoluciones_estado ON planillas_devoluciones(estado);

-- Comentarios para documentación
COMMENT ON COLUMN planillas_devoluciones.estado IS 'Estado de la planilla: PENDIENTE_VERIFICACION o VERIFICADO';
COMMENT ON COLUMN planillas_devoluciones.usuario_verificacion_id IS 'Usuario que verificó la planilla';
COMMENT ON COLUMN planillas_devoluciones.fecha_verificacion IS 'Fecha y hora de verificación';

