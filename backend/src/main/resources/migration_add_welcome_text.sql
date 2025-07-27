-- Migración para agregar campo de texto de bienvenida
-- Agregar campo para texto de bienvenida personalizable

ALTER TABLE empresas ADD COLUMN texto_bienvenida VARCHAR(200);

-- Comentario sobre el nuevo campo
COMMENT ON COLUMN empresas.texto_bienvenida IS 'Texto de bienvenida personalizable para el catálogo público'; 