-- Agregar estado COMPLETADO_SIN_CONTEO al constraint CHECK de conteo_sector
-- Necesario para permitir marcar sectores como completados sin conteo

DO $$
BEGIN
    -- Eliminar el constraint CHECK existente si existe
    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'conteo_sector_estado_check'
        AND table_name = 'conteo_sector'
    ) THEN
        ALTER TABLE conteo_sector DROP CONSTRAINT conteo_sector_estado_check;
        RAISE NOTICE 'Constraint CHECK anterior eliminado';
    END IF;

    -- Crear el nuevo constraint CHECK con todos los estados
    ALTER TABLE conteo_sector
    ADD CONSTRAINT conteo_sector_estado_check
    CHECK (estado IN (
        'PENDIENTE',
        'EN_PROGRESO',
        'ESPERANDO_VERIFICACION',
        'CON_DIFERENCIAS',
        'COMPLETADO',
        'COMPLETADO_SIN_CONTEO',
        'CANCELADO'
    ));
    
    RAISE NOTICE 'Constraint CHECK actualizado con COMPLETADO_SIN_CONTEO';
END $$;

