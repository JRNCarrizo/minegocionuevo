-- Migración final para corregir la restricción CHECK del campo rol
-- Versión ultra-simplificada para PostgreSQL

-- Paso 1: Eliminar cualquier restricción existente
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;

-- Paso 2: Crear la nueva restricción que permite los tres valores
ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check 
CHECK (rol IN ('ADMINISTRADOR', 'ASIGNADO', 'SUPER_ADMIN'));
