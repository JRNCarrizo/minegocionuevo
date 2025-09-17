-- Forzar actualización de la restricción CHECK del campo rol
-- Versión simplificada para PostgreSQL

-- Eliminar cualquier restricción existente con ese nombre
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;

-- Crear la nueva restricción
ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check 
CHECK (rol IN ('ADMINISTRADOR', 'ASIGNADO', 'SUPER_ADMIN'));
