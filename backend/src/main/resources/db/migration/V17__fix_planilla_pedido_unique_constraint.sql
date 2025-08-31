-- V17: Fix planilla pedido unique constraint
-- Asegurar que la restricción única del número de planilla funcione correctamente

-- Primero, eliminar cualquier restricción única existente que pueda estar causando problemas
ALTER TABLE planillas_pedidos DROP CONSTRAINT IF EXISTS uk5f64bwrvjlpwxjecp7ykjcyhd;
ALTER TABLE planillas_pedidos DROP CONSTRAINT IF EXISTS uk_planillas_pedidos_numero_planilla;

-- Crear una nueva restricción única más robusta
ALTER TABLE planillas_pedidos ADD CONSTRAINT uk_planillas_pedidos_numero_planilla UNIQUE (numero_planilla);

-- Crear un índice para mejorar el rendimiento de las búsquedas por número de planilla
CREATE INDEX IF NOT EXISTS idx_planillas_pedidos_numero_planilla ON planillas_pedidos (numero_planilla);

-- Comentario sobre la migración
COMMENT ON TABLE planillas_pedidos IS 'Tabla de planillas de pedidos con restricción única en numero_planilla';
COMMENT ON COLUMN planillas_pedidos.numero_planilla IS 'Número único de planilla generado automáticamente';
