package com.minegocio.backend.controladores;

import com.minegocio.backend.dto.SuscripcionDTO;
import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Plan;
import com.minegocio.backend.entidades.Suscripcion;
import com.minegocio.backend.entidades.Usuario;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.UsuarioRepository;
import com.minegocio.backend.repositorios.PlanRepository;
import com.minegocio.backend.repositorios.SuscripcionRepository;
import com.minegocio.backend.seguridad.JwtUtils;
import com.minegocio.backend.servicios.SuscripcionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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

    /**
     * Obtener mi suscripción (para empresas normales)
     */
    @GetMapping("/mi-suscripcion")
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
                    
                    // Crear suscripción directamente
                    Suscripcion nuevaSuscripcion = new Suscripcion();
                    nuevaSuscripcion.setEmpresa(empresa);
                    nuevaSuscripcion.setPlan(planGratuito);
                    nuevaSuscripcion.setFechaInicio(LocalDateTime.now());
                    nuevaSuscripcion.setFechaFin(LocalDateTime.now().plusDays(45)); // 45 días de prueba
                    nuevaSuscripcion.setEstado(Suscripcion.EstadoSuscripcion.ACTIVA);
                    nuevaSuscripcion.setPrecio(java.math.BigDecimal.ZERO);
                    nuevaSuscripcion.setMoneda("USD");
                    nuevaSuscripcion.setRenovacionAutomatica(false);
                    nuevaSuscripcion.setNotificarAntesRenovacion(true);
                    nuevaSuscripcion.setDiasNotificacionRenovacion(7);
                    
                    // Guardar la suscripción usando el repositorio directamente para evitar dependencias circulares
                    nuevaSuscripcion = suscripcionRepository.save(nuevaSuscripcion);
                    
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

            // Obtener estadísticas de consumo
            Map<String, Object> consumoData = suscripcionService.obtenerEstadisticasConsumo(empresa.getId());
            System.out.println("🔥 Consumo obtenido: " + consumoData);

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

            // Obtener datos reales del plan desde la base de datos
            System.out.println("🔥 Buscando plan con ID: " + suscripcionActivaDTO.getPlanId());
            Plan planReal = planRepository.findById(suscripcionActivaDTO.getPlanId()).orElse(null);
            
            Map<String, Object> planData = new HashMap<>();
            planData.put("id", suscripcionActivaDTO.getPlanId());
            planData.put("nombre", suscripcionActivaDTO.getPlanNombre());
            
            if (planReal != null) {
                System.out.println("🔥 Plan encontrado: " + planReal.getNombre());
                planData.put("descripcion", planReal.getDescripcion() != null ? planReal.getDescripcion() : "Plan de suscripción");
                planData.put("precio", planReal.getPrecio());
                planData.put("periodo", planReal.getPeriodo() != null ? planReal.getPeriodo().toString() : "MENSUAL");
                planData.put("maxProductos", planReal.getMaxProductos());
                planData.put("maxUsuarios", planReal.getMaxUsuarios());
                planData.put("maxClientes", planReal.getMaxClientes());
                planData.put("maxAlmacenamientoGB", planReal.getMaxAlmacenamientoGB());
                planData.put("personalizacionCompleta", planReal.getPersonalizacionCompleta());
                planData.put("estadisticasAvanzadas", planReal.getEstadisticasAvanzadas());
                planData.put("soportePrioritario", planReal.getSoportePrioritario());
                planData.put("integracionesAvanzadas", planReal.getIntegracionesAvanzadas());
                planData.put("backupAutomatico", planReal.getBackupAutomatico());
                planData.put("dominioPersonalizado", planReal.getDominioPersonalizado());
            } else {
                System.out.println("🔥 ❌ Plan no encontrado, usando valores por defecto");
                planData.put("descripcion", "Plan de suscripción");
                planData.put("precio", suscripcionActivaDTO.getPrecio());
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
}