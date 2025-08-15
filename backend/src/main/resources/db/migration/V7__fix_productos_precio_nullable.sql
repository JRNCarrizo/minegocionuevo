-- Corregir el campo precio en la tabla productos para que sea nullable
-- Esto permite que los productos no tengan precio obligatorio

ALTER TABLE productos MODIFY COLUMN precio DECIMAL(10,2) NULL;
