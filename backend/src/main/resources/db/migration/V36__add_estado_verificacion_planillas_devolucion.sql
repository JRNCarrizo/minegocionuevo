-- Agregar campos de estado y verificacion a planillas de devoluciones
ALTER TABLE planillas_devoluciones 
ADD COLUMN estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE_VERIFICACION';

ALTER TABLE planillas_devoluciones 
ADD COLUMN usuario_verificacion_id BIGINT;

ALTER TABLE planillas_devoluciones 
ADD COLUMN fecha_verificacion TIMESTAMP;

-- Agregar foreign key para usuario de verificacion
ALTER TABLE planillas_devoluciones 
ADD CONSTRAINT fk_planilla_devolucion_usuario_verificacion 
FOREIGN KEY (usuario_verificacion_id) REFERENCES usuarios(id);

-- Crear indice para mejorar consultas por estado
CREATE INDEX idx_planillas_devoluciones_estado ON planillas_devoluciones(estado);




