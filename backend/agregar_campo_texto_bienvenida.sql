-- Script para agregar el campo texto_bienvenida a la tabla empresas
-- Ejecutar este script en la base de datos

-- Para H2 Database (desarrollo)
ALTER TABLE empresas ADD COLUMN texto_bienvenida VARCHAR(200);

-- Para PostgreSQL (producción)
-- ALTER TABLE empresas ADD COLUMN texto_bienvenida VARCHAR(200);

-- Comentario sobre el nuevo campo
COMMENT ON COLUMN empresas.texto_bienvenida IS 'Texto de bienvenida personalizable para el catálogo público'; 