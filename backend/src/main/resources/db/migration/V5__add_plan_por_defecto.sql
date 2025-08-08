-- Agregar campo plan_por_defecto a la tabla planes
ALTER TABLE planes ADD COLUMN plan_por_defecto BOOLEAN DEFAULT FALSE;

-- Establecer el Plan Gratuito como plan por defecto
UPDATE planes SET plan_por_defecto = TRUE WHERE nombre = 'Plan Gratuito'; 