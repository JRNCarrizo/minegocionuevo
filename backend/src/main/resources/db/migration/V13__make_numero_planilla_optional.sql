-- Hacer opcional el campo numero_planilla en planillas_pedidos
ALTER TABLE planillas_pedidos ALTER COLUMN numero_planilla DROP NOT NULL;

-- Hacer opcional el campo numero_planilla en planillas_devoluciones
ALTER TABLE planillas_devoluciones ALTER COLUMN numero_planilla DROP NOT NULL;
