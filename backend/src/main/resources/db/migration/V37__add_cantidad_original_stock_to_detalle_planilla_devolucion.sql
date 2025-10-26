-- Agregar columna para guardar la cantidad original que se sumó al stock
ALTER TABLE detalle_planillas_devoluciones 
ADD COLUMN cantidad_original_stock INTEGER;

-- Inicializar con la cantidad actual para registros existentes
UPDATE detalle_planillas_devoluciones 
SET cantidad_original_stock = cantidad 
WHERE cantidad_original_stock IS NULL;




