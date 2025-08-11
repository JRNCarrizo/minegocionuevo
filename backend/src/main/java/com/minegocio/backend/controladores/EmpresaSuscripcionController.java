package com.minegocio.backend.controladores;

import com.minegocio.backend.dto.SuscripcionDTO;
import com.minegocio.backend.entidades.ArchivoEmpresa;
import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Plan;
import com.minegocio.backend.entidades.Producto;
import com.minegocio.backend.entidades.Suscripcion;
import com.minegocio.backend.entidades.Usuario;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.UsuarioRepository;
import com.minegocio.backend.repositorios.PlanRepository;
import com.minegocio.backend.repositorios.ProductoRepository;
import com.minegocio.backend.repositorios.SuscripcionRepository;
import com.minegocio.backend.seguridad.JwtUtils;
import com.minegocio.backend.servicios.SuscripcionService;
import com.minegocio.backend.servicios.AlmacenamientoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Controlador para que las empresas normales accedan a su información de suscripción
 */
@RestController
@RequestMapping("/api/suscripciones")
@CrossOrigin(origins = "*", maxAge = 3600)
public class EmpresaSuscripcionController {

    @Autowired
    private SuscripcionService suscripcionService;
    
    @Autowired
    private PlanRepository planRepository;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private EmpresaRepository empresaRepository;
    
    @Autowired
    private SuscripcionRepository suscripcionRepository;
    
    @Autowired
    private AlmacenamientoService almacenamientoService;
    
    @Autowired
    private ProductoRepository productoRepository;

    /**
     * Obtener mi suscripción (para empresas normales)
     */
    @GetMapping("/mi-suscripcion")
    @Transactional(readOnly = true)
    public ResponseEntity<?> obtenerMiSuscripcion(HttpServletRequest request) {
        try {
            System.out.println("🔥 === INICIO DEBUG MI-SUSCRIPCION EMPRESA ===");
            System.out.println("🔥 Request URI: " + request.getRequestURI());
            System.out.println("🔥 Request Method: " + request.getMethod());
            System.out.println("🔥 Authorization Header: " + request.getHeader("Authorization"));

            // Extraer token del header
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                System.out.println("🔥 ❌ No hay token válido en el header");
                return ResponseEntity.status(401).body(Map.of("error", "Token requerido"));
            }

            String token = authHeader.substring(7);
            System.out.println("🔥 Token extraído (primeros 50 chars): " + token.substring(0, Math.min(50, token.length())) + "...");

            // Validar token
            if (!jwtUtils.validateJwtToken(token)) {
                System.out.println("🔥 ❌ Token inválido");
                return ResponseEntity.status(401).body(Map.of("error", "Token inválido"));
            }

            // Extraer email del token
            String email = jwtUtils.getEmailFromJwtToken(token);
            System.out.println("🔥 Email extraído del token: " + email);

            // Buscar usuario
            Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);
            if (!usuarioOpt.isPresent()) {
                System.out.println("🔥 ❌ Usuario no encontrado: " + email);
                return ResponseEntity.status(404).body(Map.of("error", "Usuario no encontrado"));
            }

            Usuario usuario = usuarioOpt.get();
            System.out.println("🔥 Usuario encontrado - ID: " + usuario.getId() + ", Rol: " + usuario.getRol());

            // Obtener empresa
            Empresa empresa = usuario.getEmpresa();
            if (empresa == null) {
                System.out.println("🔥 ❌ Usuario sin empresa asociada");
                return ResponseEntity.status(400).body(Map.of("error", "Usuario sin empresa asociada"));
            }

            System.out.println("🔥 Empresa encontrada - ID: " + empresa.getId() + ", Nombre: " + empresa.getNombre());

            // Obtener suscripciones de la empresa
            List<SuscripcionDTO> suscripciones = suscripcionService.obtenerSuscripcionesPorEmpresa(empresa.getId());
            
            // Si no hay suscripciones, crear una suscripción gratuita automáticamente
            if (suscripciones.isEmpty()) {
                System.out.println("🔥 ⚠️ No hay suscripciones para la empresa " + empresa.getId() + ". Creando suscripción gratuita automáticamente...");
                try {
                    // Buscar plan gratuito por defecto
                    Optional<Plan> planGratuitoOpt = planRepository.findByPlanPorDefectoTrue();
                    if (planGratuitoOpt.isEmpty()) {
                        System.out.println("🔥 ❌ No existe plan por defecto. Creando respuesta de error controlada.");
                        return ResponseEntity.status(500).body(Map.of(
                            "error", "Configuración de sistema incompleta", 
                            "detalle", "No existe plan por defecto configurado"
                        ));
                    }
                    
                    Plan planGratuito = planGratuitoOpt.get();
                    
                    // Crear suscripción usando el servicio que maneja transacciones correctamente
                    SuscripcionDTO nuevaSuscripcion = suscripcionService.crearSuscripcion(
                        empresa.getId(), 
                        planGratuito.getId(), 
                        LocalDateTime.now()
                    );
                    
                    System.out.println("🔥 ✅ Suscripción gratuita creada automáticamente con ID: " + nuevaSuscripcion.getId());
                    
                    // Recargar suscripciones
                    suscripciones = suscripcionService.obtenerSuscripcionesPorEmpresa(empresa.getId());
                    
                } catch (Exception autoCreateError) {
                    System.out.println("🔥 ❌ Error creando suscripción automáticamente: " + autoCreateError.getMessage());
                    autoCreateError.printStackTrace();
                    return ResponseEntity.status(500).body(Map.of(
                        "error", "Error del sistema al configurar suscripción", 
                        "detalle", autoCreateError.getMessage()
                    ));
                }
            }
            
            if (suscripciones.isEmpty()) {
                System.out.println("🔥 ❌ Aún no hay suscripciones después del intento de creación automática");
                return ResponseEntity.status(500).body(Map.of("error", "Error interno del sistema de suscripciones"));
            }
            
            // Buscar suscripción activa
            SuscripcionDTO suscripcionActivaDTO = suscripciones.stream()
                .filter(s -> "ACTIVA".equals(s.getEstado()))
                .findFirst()
                .orElse(null);
                
            if (suscripcionActivaDTO == null) {
                System.out.println("🔥 ❌ No hay suscripción activa para la empresa");
                return ResponseEntity.status(404).body(Map.of("error", "No hay suscripción activa"));
            }

            System.out.println("🔥 Suscripción activa encontrada - ID: " + suscripcionActivaDTO.getId());

            // Necesitamos obtener las entidades completas para acceso a los datos detallados
            // Por ahora usamos los datos del DTO
            System.out.println("🔥 Plan - ID: " + suscripcionActivaDTO.getPlanId() + ", Nombre: " + suscripcionActivaDTO.getPlanNombre());

            // Calcular días restantes
            long diasRestantes = ChronoUnit.DAYS.between(LocalDateTime.now(), suscripcionActivaDTO.getFechaFin());
            System.out.println("🔥 Días restantes calculados: " + diasRestantes);

            // Obtener estadísticas de consumo de forma segura
            Map<String, Object> consumoData = new HashMap<>();
            try {
                consumoData = suscripcionService.obtenerEstadisticasConsumo(empresa.getId());
                System.out.println("🔥 Consumo obtenido: " + consumoData);
            } catch (Exception consumoError) {
                System.out.println("🔥 ❌ Error obteniendo consumo, usando datos por defecto: " + consumoError.getMessage());
                // Crear datos de consumo por defecto
                Map<String, Object> consumoPorDefecto = new HashMap<>();
                consumoPorDefecto.put("productos", 0);
                consumoPorDefecto.put("usuarios", 1);
                consumoPorDefecto.put("clientes", 0);
                consumoPorDefecto.put("almacenamiento", 0);
                consumoData.put("consumo", consumoPorDefecto);
            }

            // Preparar respuesta simplificada (formato esperado por el frontend)
            Map<String, Object> respuesta = new HashMap<>();
            
            // Datos básicos de suscripción
            respuesta.put("id", suscripcionActivaDTO.getId());
            respuesta.put("estado", suscripcionActivaDTO.getEstado());
            respuesta.put("fechaInicio", suscripcionActivaDTO.getFechaInicio());
            respuesta.put("fechaFin", suscripcionActivaDTO.getFechaFin());
            respuesta.put("diasRestantes", Math.max(0, diasRestantes));
            respuesta.put("estaActiva", suscripcionActivaDTO.getEstaActiva());
            respuesta.put("estaPorExpirar", diasRestantes <= 7 && diasRestantes > 0);

            // Usar los datos del plan directamente del DTO para evitar lazy loading
            System.out.println("🔥 Usando datos del plan del DTO para evitar lazy loading");
            
            Map<String, Object> planData = new HashMap<>();
            planData.put("id", suscripcionActivaDTO.getPlanId());
            planData.put("nombre", suscripcionActivaDTO.getPlanNombre());
            planData.put("descripcion", "Plan de suscripción");
            planData.put("precio", suscripcionActivaDTO.getPrecio());
            planData.put("periodo", "MENSUAL");
            
            // Obtener datos del plan de forma segura
            try {
                System.out.println("🔥 Intentando obtener datos adicionales del plan con ID: " + suscripcionActivaDTO.getPlanId());
                Optional<Plan> planRealOpt = planRepository.findById(suscripcionActivaDTO.getPlanId());
                if (planRealOpt.isPresent()) {
                    Plan planReal = planRealOpt.get();
                    System.out.println("🔥 Plan encontrado: " + planReal.getNombre());
                    
                    // Forzar la carga de propiedades para evitar lazy loading
                    planData.put("descripcion", planReal.getDescripcion() != null ? planReal.getDescripcion() : "Plan de suscripción");
                    planData.put("precio", planReal.getPrecio() != null ? planReal.getPrecio() : suscripcionActivaDTO.getPrecio());
                    planData.put("periodo", planReal.getPeriodo() != null ? planReal.getPeriodo().toString() : "MENSUAL");
                    planData.put("maxProductos", planReal.getMaxProductos() != null ? planReal.getMaxProductos() : 100);
                    planData.put("maxUsuarios", planReal.getMaxUsuarios() != null ? planReal.getMaxUsuarios() : 5);
                    planData.put("maxClientes", planReal.getMaxClientes() != null ? planReal.getMaxClientes() : 1000);
                    planData.put("maxAlmacenamientoGB", planReal.getMaxAlmacenamientoGB() != null ? planReal.getMaxAlmacenamientoGB() : 10);
                    planData.put("personalizacionCompleta", planReal.getPersonalizacionCompleta() != null ? planReal.getPersonalizacionCompleta() : true);
                    planData.put("estadisticasAvanzadas", planReal.getEstadisticasAvanzadas() != null ? planReal.getEstadisticasAvanzadas() : true);
                    planData.put("soportePrioritario", planReal.getSoportePrioritario() != null ? planReal.getSoportePrioritario() : false);
                    planData.put("integracionesAvanzadas", planReal.getIntegracionesAvanzadas() != null ? planReal.getIntegracionesAvanzadas() : false);
                    planData.put("backupAutomatico", planReal.getBackupAutomatico() != null ? planReal.getBackupAutomatico() : false);
                    planData.put("dominioPersonalizado", planReal.getDominioPersonalizado() != null ? planReal.getDominioPersonalizado() : false);
                } else {
                    System.out.println("🔥 ❌ Plan no encontrado, usando valores por defecto");
                    planData.put("maxProductos", 100);
                    planData.put("maxUsuarios", 5);
                    planData.put("maxClientes", 1000);
                    planData.put("maxAlmacenamientoGB", 10);
                    planData.put("personalizacionCompleta", true);
                    planData.put("estadisticasAvanzadas", true);
                    planData.put("soportePrioritario", false);
                    planData.put("integracionesAvanzadas", false);
                    planData.put("backupAutomatico", false);
                    planData.put("dominioPersonalizado", false);
                }
            } catch (Exception planError) {
                System.out.println("🔥 ❌ Error obteniendo datos del plan, usando valores por defecto: " + planError.getMessage());
                planData.put("maxProductos", 100);
                planData.put("maxUsuarios", 5);
                planData.put("maxClientes", 1000);
                planData.put("maxAlmacenamientoGB", 10);
                planData.put("personalizacionCompleta", true);
                planData.put("estadisticasAvanzadas", true);
                planData.put("soportePrioritario", false);
                planData.put("integracionesAvanzadas", false);
                planData.put("backupAutomatico", false);
                planData.put("dominioPersonalizado", false);
            }
            respuesta.put("plan", planData);

            // Datos de la empresa
            respuesta.put("empresa", Map.of(
                "id", empresa.getId(),
                "nombre", empresa.getNombre()
            ));

            // Datos de consumo
            respuesta.put("consumo", consumoData.get("consumo"));

            System.out.println("🔥 ✅ Respuesta preparada exitosamente");
            System.out.println("🔥 === FIN DEBUG MI-SUSCRIPCION EMPRESA ===");
            
            return ResponseEntity.ok(respuesta);

        } catch (Exception e) {
            System.out.println("🔥 ❌ ERROR COMPLETO EN MI-SUSCRIPCION EMPRESA:");
            System.out.println("🔥 Clase de error: " + e.getClass().getName());
            System.out.println("🔥 Mensaje: " + e.getMessage());
            System.out.println("🔥 Stack trace:");
            e.printStackTrace();
            System.out.println("🔥 === FIN ERROR MI-SUSCRIPCION EMPRESA ===");
            return ResponseEntity.status(500).body(Map.of("error", "Error interno del servidor", "detalle", e.getMessage()));
        }
    }

    /**
     * Obtener mi consumo (para empresas normales)
     */
    @GetMapping("/mi-consumo")
    @Transactional(readOnly = true)
    public ResponseEntity<?> obtenerMiConsumo(HttpServletRequest request) {
        try {
            System.out.println("🔥 === INICIO DEBUG MI-CONSUMO EMPRESA ===");

            // Extraer token y validar (mismo proceso que arriba)
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                System.out.println("🔥 ❌ No hay token válido en el header");
                return ResponseEntity.status(401).body(Map.of("error", "Token requerido"));
            }

            String token = authHeader.substring(7);
            if (!jwtUtils.validateJwtToken(token)) {
                System.out.println("🔥 ❌ Token inválido");
                return ResponseEntity.status(401).body(Map.of("error", "Token inválido"));
            }

            String email = jwtUtils.getEmailFromJwtToken(token);
            Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);
            if (!usuarioOpt.isPresent()) {
                System.out.println("🔥 ❌ Usuario no encontrado: " + email);
                return ResponseEntity.status(404).body(Map.of("error", "Usuario no encontrado"));
            }

            Usuario usuario = usuarioOpt.get();
            Empresa empresa = usuario.getEmpresa();
            if (empresa == null) {
                System.out.println("🔥 ❌ Usuario sin empresa asociada");
                return ResponseEntity.status(400).body(Map.of("error", "Usuario sin empresa asociada"));
            }

            System.out.println("🔥 Obteniendo estadísticas de consumo para empresa ID: " + empresa.getId());

            // Obtener estadísticas de consumo
            Map<String, Object> estadisticas = suscripcionService.obtenerEstadisticasConsumo(empresa.getId());

            System.out.println("🔥 ✅ Estadísticas obtenidas exitosamente");
            System.out.println("🔥 === FIN DEBUG MI-CONSUMO EMPRESA ===");

            return ResponseEntity.ok(estadisticas);

        } catch (Exception e) {
            System.out.println("🔥 ❌ ERROR COMPLETO EN MI-CONSUMO EMPRESA:");
            System.out.println("🔥 Clase de error: " + e.getClass().getName());
            System.out.println("🔥 Mensaje: " + e.getMessage());
            System.out.println("🔥 Stack trace:");
            e.printStackTrace();
            System.out.println("🔥 === FIN ERROR MI-CONSUMO EMPRESA ===");
            return ResponseEntity.status(500).body(Map.of("error", "Error interno del servidor", "detalle", e.getMessage()));
        }
    }

    /**
     * Endpoint de debug simple para empresas
     */
    @GetMapping("/debug/test-simple")
    public ResponseEntity<?> debugTestSimple() {
        try {
            System.out.println("🔥 TEST SIMPLE EMPRESA - Endpoint funcionando");
            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("mensaje", "Endpoint empresa funcionando correctamente");
            respuesta.put("timestamp", LocalDateTime.now());
            respuesta.put("servidor", "Endpoint empresas");
            return ResponseEntity.ok(respuesta);
        } catch (Exception e) {
            System.err.println("❌ ERROR en test simple empresa: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error en test simple empresa: " + e.getMessage()));
        }
    }

    /**
     * Endpoint para migrar archivos existentes a la tabla de almacenamiento
     */
    @PostMapping("/debug/migrar-archivos-existentes")
    @Transactional
    public ResponseEntity<?> migrarArchivosExistentes(HttpServletRequest request) {
        try {
            System.out.println("🔥 DEBUG: Migrando archivos existentes");
            
            // Extraer token y validar
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of("error", "Token requerido"));
            }

            String token = authHeader.substring(7);
            if (!jwtUtils.validateJwtToken(token)) {
                return ResponseEntity.status(401).body(Map.of("error", "Token inválido"));
            }

            String email = jwtUtils.getEmailFromJwtToken(token);
            Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);
            if (!usuarioOpt.isPresent()) {
                return ResponseEntity.status(404).body(Map.of("error", "Usuario no encontrado"));
            }

            Usuario usuario = usuarioOpt.get();
            Empresa empresa = usuario.getEmpresa();
            if (empresa == null) {
                return ResponseEntity.status(400).body(Map.of("error", "Usuario sin empresa asociada"));
            }

            Long empresaId = empresa.getId();
            System.out.println("🔥 DEBUG: Migrando archivos para empresa ID: " + empresaId);

            // Obtener todos los productos activos con imágenes cargadas
            List<Producto> productos = productoRepository.findByEmpresaIdAndActivoTrue(empresaId);
            System.out.println("🔥 DEBUG: Productos encontrados: " + productos.size());
            int archivosRegistrados = 0;
            long totalBytes = 0;

            for (Producto producto : productos) {
                System.out.println("🔥 DEBUG: Procesando producto ID: " + producto.getId() + " - " + producto.getNombre());
                System.out.println("🔥 DEBUG: Imágenes del producto: " + (producto.getImagenes() != null ? producto.getImagenes().size() : "null"));
                
                if (producto.getImagenes() != null && !producto.getImagenes().isEmpty()) {
                    for (String urlImagen : producto.getImagenes()) {
                        if (urlImagen != null && !urlImagen.trim().isEmpty()) {
                            try {
                                // Extraer public_id de la URL de Cloudinary
                                String publicId = extraerPublicIdDeUrl(urlImagen);
                                
                                // Estimar tamaño (promedio de imagen de producto: 500KB)
                                Long tamañoEstimado = 500L * 1024L; // 500KB en bytes
                                
                                // Registrar archivo
                                ArchivoEmpresa archivo = almacenamientoService.registrarArchivo(
                                    empresaId,
                                    urlImagen,
                                    publicId,
                                    "producto",
                                    tamañoEstimado,
                                    "imagen_producto_" + producto.getId(),
                                    "image/jpeg"
                                );
                                
                                archivosRegistrados++;
                                totalBytes += tamañoEstimado;
                                
                                System.out.println("✅ Registrado archivo: " + urlImagen + " - " + tamañoEstimado + " bytes");
                                
                            } catch (Exception e) {
                                System.err.println("❌ Error registrando archivo: " + urlImagen + " - " + e.getMessage());
                            }
                        }
                    }
                }
            }

            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("empresaId", empresaId);
            respuesta.put("empresaNombre", empresa.getNombre());
            respuesta.put("archivosRegistrados", archivosRegistrados);
            respuesta.put("totalBytes", totalBytes);
            respuesta.put("totalMB", totalBytes / (1024.0 * 1024.0));
            respuesta.put("mensaje", "Migración completada");
            respuesta.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.ok(respuesta);
            
        } catch (Exception e) {
            System.err.println("❌ ERROR en migración de archivos: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error en migración: " + e.getMessage()));
        }
    }

    /**
     * Extrae el public_id de una URL de Cloudinary
     */
    private String extraerPublicIdDeUrl(String url) {
        try {
            // Ejemplo: https://res.cloudinary.com/demo/image/upload/v1234567890/minegocio/productos/abc123.jpg
            // Extraer: minegocio/productos/abc123
            String[] partes = url.split("/upload/");
            if (partes.length > 1) {
                String ruta = partes[1];
                // Remover versión si existe
                if (ruta.contains("/v")) {
                    ruta = ruta.substring(ruta.indexOf("/v") + 2);
                    ruta = ruta.substring(ruta.indexOf("/") + 1);
                }
                // Remover extensión
                if (ruta.contains(".")) {
                    ruta = ruta.substring(0, ruta.lastIndexOf("."));
                }
                return ruta;
            }
        } catch (Exception e) {
            System.err.println("Error extrayendo public_id de: " + url);
        }
        return "archivo_" + System.currentTimeMillis();
    }

    /**
     * Endpoint de debug para verificar almacenamiento
     */
    @GetMapping("/debug/verificar-almacenamiento")
    public ResponseEntity<?> debugVerificarAlmacenamiento(HttpServletRequest request) {
        try {
            System.out.println("🔥 DEBUG: Verificando almacenamiento desde EmpresaSuscripcionController");
            
            // Extraer token y validar
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of("error", "Token requerido"));
            }

            String token = authHeader.substring(7);
            if (!jwtUtils.validateJwtToken(token)) {
                return ResponseEntity.status(401).body(Map.of("error", "Token inválido"));
            }

            String email = jwtUtils.getEmailFromJwtToken(token);
            Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);
            if (!usuarioOpt.isPresent()) {
                return ResponseEntity.status(404).body(Map.of("error", "Usuario no encontrado"));
            }

            Usuario usuario = usuarioOpt.get();
            Empresa empresa = usuario.getEmpresa();
            if (empresa == null) {
                return ResponseEntity.status(400).body(Map.of("error", "Usuario sin empresa asociada"));
            }

            Long empresaId = empresa.getId();
            System.out.println("🔥 DEBUG: Verificando almacenamiento para empresa ID: " + empresaId);

            // Obtener estadísticas detalladas de almacenamiento
            Map<String, Object> estadisticasAlmacenamiento = almacenamientoService.obtenerEstadisticasAlmacenamientoTotal(empresaId);
            
            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("empresaId", empresaId);
            respuesta.put("empresaNombre", empresa.getNombre());
            respuesta.put("estadisticasAlmacenamiento", estadisticasAlmacenamiento);
            respuesta.put("timestamp", LocalDateTime.now());
            
            return ResponseEntity.ok(respuesta);
            
        } catch (Exception e) {
            System.err.println("❌ ERROR en debug almacenamiento: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error en debug almacenamiento: " + e.getMessage()));
        }
    }

    /**
     * Endpoint de debug para verificar configuración de planes
     */
    @GetMapping("/debug/verificar-plan-defecto")
    public ResponseEntity<?> debugVerificarPlanDefecto() {
        try {
            System.out.println("🔥 DEBUG: Verificando plan por defecto desde EmpresaSuscripcionController");
            
            Optional<Plan> planPorDefecto = planRepository.findByPlanPorDefectoTrue();
            
            if (planPorDefecto.isPresent()) {
                Plan plan = planPorDefecto.get();
                Map<String, Object> planInfo = new HashMap<>();
                planInfo.put("id", plan.getId());
                planInfo.put("nombre", plan.getNombre());
                planInfo.put("descripcion", plan.getDescripcion());
                planInfo.put("precio", plan.getPrecio());
                planInfo.put("planPorDefecto", plan.getPlanPorDefecto());
                planInfo.put("maxProductos", plan.getMaxProductos());
                
                System.out.println("🔥 DEBUG: Plan por defecto encontrado: " + plan.getNombre());
                return ResponseEntity.ok(Map.of(
                    "mensaje", "Plan por defecto encontrado",
                    "plan", planInfo
                ));
            } else {
                System.out.println("🔥 DEBUG: No hay plan por defecto configurado");
                return ResponseEntity.status(404).body(Map.of(
                    "error", "No hay plan por defecto configurado",
                    "solucion", "Ejecutar endpoint /api/super-admin/suscripciones/debug/crear-plan-por-defecto"
                ));
            }
        } catch (Exception e) {
            System.err.println("❌ ERROR en debugVerificarPlanDefecto: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Endpoint de fallback que devuelve siempre una respuesta válida sin lazy loading
     */
    @GetMapping("/mi-suscripcion-simple")
    @Transactional(readOnly = true)
    public ResponseEntity<?> obtenerMiSuscripcionSimple(HttpServletRequest request) {
        try {
            System.out.println("🔥 === INICIO MI-SUSCRIPCION-SIMPLE ===");

            // Validación de token
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of("error", "Token requerido"));
            }

            String token = authHeader.substring(7);
            if (!jwtUtils.validateJwtToken(token)) {
                return ResponseEntity.status(401).body(Map.of("error", "Token inválido"));
            }

            String email = jwtUtils.getEmailFromJwtToken(token);
            Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);
            if (!usuarioOpt.isPresent()) {
                return ResponseEntity.status(404).body(Map.of("error", "Usuario no encontrado"));
            }

            Usuario usuario = usuarioOpt.get();
            Empresa empresa = usuario.getEmpresa();
            if (empresa == null) {
                return ResponseEntity.status(400).body(Map.of("error", "Usuario sin empresa"));
            }

            System.out.println("🔥 Empresa: " + empresa.getNombre() + " (ID: " + empresa.getId() + ")");

            // Crear respuesta por defecto
            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("id", 1L);
            respuesta.put("estado", "ACTIVA");
            respuesta.put("fechaInicio", LocalDateTime.now().minusDays(1));
            respuesta.put("fechaFin", LocalDateTime.now().plusDays(30));
            respuesta.put("diasRestantes", 30L);
            respuesta.put("estaActiva", true);
            respuesta.put("estaPorExpirar", false);

            // Plan por defecto
            Map<String, Object> planData = new HashMap<>();
            planData.put("id", 1L);
            planData.put("nombre", "Plan Básico");
            planData.put("descripcion", "Plan básico de suscripción");
            planData.put("precio", 0);
            planData.put("periodo", "MENSUAL");
            planData.put("maxProductos", 100);
            planData.put("maxUsuarios", 5);
            planData.put("maxClientes", 1000);
            planData.put("maxAlmacenamientoGB", 10);
            planData.put("personalizacionCompleta", true);
            planData.put("estadisticasAvanzadas", true);
            planData.put("soportePrioritario", false);
            planData.put("integracionesAvanzadas", false);
            planData.put("backupAutomatico", false);
            planData.put("dominioPersonalizado", false);
            respuesta.put("plan", planData);

            // Empresa
            respuesta.put("empresa", Map.of(
                "id", empresa.getId(),
                "nombre", empresa.getNombre()
            ));

            // Consumo por defecto
            Map<String, Object> consumoPorDefecto = new HashMap<>();
            consumoPorDefecto.put("productos", 0);
            consumoPorDefecto.put("usuarios", 1);
            consumoPorDefecto.put("clientes", 0);
            consumoPorDefecto.put("almacenamiento", 0);
            respuesta.put("consumo", consumoPorDefecto);

            System.out.println("🔥 ✅ Respuesta simple generada exitosamente");
            return ResponseEntity.ok(respuesta);

        } catch (Exception e) {
            System.out.println("🔥 ❌ ERROR en mi-suscripcion-simple: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error interno: " + e.getMessage()));
        }
    }
}