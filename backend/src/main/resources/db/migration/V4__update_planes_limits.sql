-- Actualizar límites de planes de suscripción
-- Plan Gratuito: Aumentar límites para hacerlo más atractivo
UPDATE planes 
SET max_productos = 50, 
    max_clientes = 25, 
    max_almacenamiento_gb = 2,
    descripcion = 'Prueba gratuita de 45 días con funcionalidades básicas - ¡Ahora con más límites!'
WHERE nombre = 'Plan Gratuito';

-- Plan Básico: Ajustar precios y límites
UPDATE planes 
SET precio = 24.99,
    max_productos = 1000,
    max_clientes = 2000,
    max_almacenamiento_gb = 20,
    descripcion = 'Ideal para pequeñas empresas que están comenzando - ¡Más productos y clientes!'
WHERE nombre = 'Plan Básico';

-- Plan Profesional: Mantener pero ajustar
UPDATE planes 
SET precio = 59.99,
    max_productos = 10000,
    max_clientes = 20000,
    max_almacenamiento_gb = 100,
    descripcion = 'Perfecto para empresas en crecimiento - Escalabilidad garantizada'
WHERE nombre = 'Plan Profesional';

-- Plan Empresarial: Sin cambios (ilimitado)
-- Los valores -1 indican sin límite 