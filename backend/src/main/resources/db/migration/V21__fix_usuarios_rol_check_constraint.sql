-- Corregir la restricción CHECK del campo rol en la tabla usuarios
-- para permitir los valores: ADMINISTRADOR, ASIGNADO, SUPER_ADMIN
-- Compatible con PostgreSQL

-- Primero, eliminar la restricción existente si existe
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'usuarios_rol_check' 
               AND table_name = 'usuarios') THEN
        ALTER TABLE usuarios DROP CONSTRAINT usuarios_rol_check;
    END IF;
END $$;

-- Crear la nueva restricción que permite los tres valores
ALTER TABLE usuarios ADD CONSTRAINT usuarios_rol_check 
CHECK (rol IN ('ADMINISTRADOR', 'ASIGNADO', 'SUPER_ADMIN'));
