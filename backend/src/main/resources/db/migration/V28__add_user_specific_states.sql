-- Agregar campos para estados específicos de cada usuario
ALTER TABLE conteo_sector ADD COLUMN estado_usuario_1 VARCHAR(50) DEFAULT 'PENDIENTE';
ALTER TABLE conteo_sector ADD COLUMN estado_usuario_2 VARCHAR(50) DEFAULT 'PENDIENTE';
ALTER TABLE conteo_sector ADD COLUMN fecha_inicio_usuario_1 TIMESTAMP;
ALTER TABLE conteo_sector ADD COLUMN fecha_inicio_usuario_2 TIMESTAMP;
ALTER TABLE conteo_sector ADD COLUMN productos_contados_usuario_1 INTEGER DEFAULT 0;
ALTER TABLE conteo_sector ADD COLUMN productos_contados_usuario_2 INTEGER DEFAULT 0;































