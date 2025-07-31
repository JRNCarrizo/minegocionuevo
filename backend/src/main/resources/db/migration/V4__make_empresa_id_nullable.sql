-- Hacer el campo empresa_id nullable en tokens_recuperacion
ALTER TABLE tokens_recuperacion ALTER COLUMN empresa_id DROP NOT NULL; 