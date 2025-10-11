-- Verificar usuario manualmente
-- Buscar el usuario por email
SELECT id, nombre, email, email_verificado, activo FROM usuarios WHERE email = 'jrncarrizo1987@gmail.com';

-- Actualizar para marcar como verificado
UPDATE usuarios 
SET email_verificado = true, activo = true, token_verificacion = null 
WHERE email = 'jrncarrizo1987@gmail.com';

-- Verificar la actualización
SELECT id, nombre, email, email_verificado, activo FROM usuarios WHERE email = 'jrncarrizo1987@gmail.com';

