-- Agregar campos de configuración del catálogo a la tabla empresas
ALTER TABLE empresas ADD COLUMN mostrar_stock BOOLEAN DEFAULT TRUE;
ALTER TABLE empresas ADD COLUMN mostrar_categorias BOOLEAN DEFAULT TRUE; 