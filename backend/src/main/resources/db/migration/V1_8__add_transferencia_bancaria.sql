-- Agregar campos para transferencia bancaria
ALTER TABLE empresas ADD COLUMN transferencia_bancaria_habilitada BOOLEAN DEFAULT FALSE;
ALTER TABLE empresas ADD COLUMN banco VARCHAR(100);
ALTER TABLE empresas ADD COLUMN tipo_cuenta VARCHAR(50);
ALTER TABLE empresas ADD COLUMN numero_cuenta VARCHAR(50);
ALTER TABLE empresas ADD COLUMN cbu VARCHAR(22);
ALTER TABLE empresas ADD COLUMN alias VARCHAR(50);
ALTER TABLE empresas ADD COLUMN titular VARCHAR(100); 