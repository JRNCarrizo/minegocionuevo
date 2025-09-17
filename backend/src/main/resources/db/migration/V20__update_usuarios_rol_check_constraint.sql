-- Actualizar la restricción CHECK del campo rol en la tabla usuarios
-- para permitir los valores: ADMINISTRADOR, ASIGNADO, SUPER_ADMIN

-- Primero, eliminar la restricción existente si existe
ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_rol_check;

-- Crear la nueva restricción que permite los tres valores
ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check 
CHECK (rol IN ('ADMINISTRADOR', 'ASIGNADO', 'SUPER_ADMIN'));
