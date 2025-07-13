-- Ejecutar este script en tu base de datos
-- Copia y pega estas líneas en tu cliente de base de datos

-- Agregar columna de color de título principal
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS color_titulo_principal VARCHAR(7) DEFAULT '#1F2937';

-- Agregar columna de color de card de filtros  
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS color_card_filtros VARCHAR(7) DEFAULT '#FFFFFF';

-- Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'empresas' 
AND column_name IN ('color_titulo_principal', 'color_card_filtros'); 