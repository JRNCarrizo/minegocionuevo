-- Alterar el campo precio en la tabla productos para que sea nullable
-- Esto permite que los productos no tengan precio obligatorio

ALTER TABLE productos ALTER COLUMN precio DROP NOT NULL;
