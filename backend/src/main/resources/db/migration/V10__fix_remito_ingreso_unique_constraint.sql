-- Eliminar la restricción única existente en numero_remito
ALTER TABLE remitos_ingreso DROP CONSTRAINT IF EXISTS uk_remitos_ingreso_numero_remito;

-- Agregar restricción única compuesta para numero_remito y empresa_id
ALTER TABLE remitos_ingreso ADD CONSTRAINT uk_remitos_ingreso_numero_empresa UNIQUE (numero_remito, empresa_id);
