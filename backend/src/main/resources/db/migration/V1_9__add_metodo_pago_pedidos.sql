-- Agregar campo método de pago a la tabla pedidos
ALTER TABLE pedidos ADD COLUMN metodo_pago VARCHAR(50);

-- Actualizar el enum de estados para incluir PENDIENTE_PAGO
-- Nota: PostgreSQL no permite modificar enums directamente, 
-- pero el enum ya está definido en la entidad Java 