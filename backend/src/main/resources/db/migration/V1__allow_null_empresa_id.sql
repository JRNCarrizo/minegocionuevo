-- Migración para permitir valores null en empresa_id
ALTER TABLE usuarios ALTER COLUMN empresa_id DROP NOT NULL; 