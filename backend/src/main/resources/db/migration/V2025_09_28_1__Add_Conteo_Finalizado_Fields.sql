-- Agregar campos para rastrear si cada usuario completó su reconteo
ALTER TABLE conteo_sector ADD COLUMN conteo1_finalizado BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE conteo_sector ADD COLUMN conteo2_finalizado BOOLEAN DEFAULT FALSE NOT NULL;
