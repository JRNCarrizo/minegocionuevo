-- Script para PostgreSQL - Agregar columna texto_bienvenida si no existe
-- Se ejecuta automáticamente al iniciar la aplicación en producción

-- Agregar columna texto_bienvenida si no existe (sintaxis más robusta)
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS texto_bienvenida VARCHAR(200); 