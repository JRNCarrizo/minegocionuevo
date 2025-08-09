package com.minegocio.backend.controladores;

import com.minegocio.backend.dto.PlanDTO;
import com.minegocio.backend.dto.SuscripcionDTO;
import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Plan;
import com.minegocio.backend.entidades.Suscripcion;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.PlanRepository;
import com.minegocio.backend.repositorios.SuscripcionRepository;
import com.minegocio.backend.servicios.SuscripcionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.ArrayList;
import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Plan;
import com.minegocio.backend.entidades.Suscripcion;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.PlanRepository;
import com.minegocio.backend.repositorios.SuscripcionRepository;
import com.minegocio.backend.repositorios.UsuarioRepository;
import com.minegocio.backend.seguridad.JwtUtils;
import com.minegocio.backend.entidades.Usuario;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.math.BigDecimal;
import com.minegocio.backend.servicios.SuscripcionAutomaticaService;

/**
 * Controlador para la gestión de suscripciones (Super Admin)
 */
@RestController
@RequestMapping("/api/super-admin/suscripciones")
@CrossOrigin(origins = "*", maxAge = 3600)
public class SuscripcionController {

    @Autowired
    private SuscripcionService suscripcionService;

    @Autowired
    private EmpresaRepository empresaRepository;

    @Autowired
    private PlanRepository planRepository;

    @Autowired
    private SuscripcionRepository suscripcionRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private SuscripcionAutomaticaService suscripcionAutomaticaService;

    // ===== ENDPOINTS PARA PLANES =====

    /**
     * Obtiene todos los planes con estadísticas
     */
    @GetMapping("/planes")
    public ResponseEntity<List<PlanDTO>> obtenerPlanes() {
        try {
            List<PlanDTO> planes = suscripcionService.obtenerPlanesConEstadisticas();
            return ResponseEntity.ok(planes);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Obtiene un plan por ID
     */
    @GetMapping("/planes/{planId}")
    public ResponseEntity<PlanDTO> obtenerPlan(@PathVariable Long planId) {
        try {
            return suscripcionService.obtenerPlanPorId(planId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Crea un nuevo plan
     */
    @PostMapping("/planes")
    public ResponseEntity<?> crearPlan(@RequestBody PlanDTO planDTO) {
        try {
            System.out.println("🔍 Creando plan con datos: " + planDTO);
            PlanDTO planCreado = suscripcionService.crearPlan(planDTO);
            System.out.println("✅ Plan creado exitosamente: " + planCreado.getNombre());
            return ResponseEntity.ok(planCreado);
        } catch (Exception e) {
            System.out.println("❌ Error creando plan: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(400).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Actualiza un plan existente
     */
    @PutMapping("/planes/{planId}")
    public ResponseEntity<PlanDTO> actualizarPlan(@PathVariable Long planId, @RequestBody PlanDTO planDTO) {
        try {
            PlanDTO planActualizado = suscripcionService.actualizarPlan(planId, planDTO);
            return ResponseEntity.ok(planActualizado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Elimina un plan
     */
    @DeleteMapping("/planes/{planId}")
    public ResponseEntity<?> eliminarPlan(@PathVariable Long planId) {
        try {
            suscripcionService.eliminarPlan(planId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ===== ENDPOINTS PARA SUSCRIPCIONES =====

    /**
     * Obtiene todas las suscripciones con detalles
     */
    @GetMapping("")
    public ResponseEntity<List<SuscripcionDTO>> obtenerSuscripciones() {
        try {
            System.out.println("🎯 SuscripcionController - Iniciando obtenerSuscripciones");
            List<SuscripcionDTO> suscripciones = suscripcionService.obtenerSuscripcionesConDetalles();
            System.out.println("🎯 SuscripcionController - Suscripciones obtenidas: " + suscripciones.size());
            return ResponseEntity.ok(suscripciones);
        } catch (Exception e) {
            System.out.println("❌ SuscripcionController - Error obteniendo suscripciones: " + e.getMessage());
            e.printStackTrace();
            // En lugar de devolver 500, devolvemos una lista vacía para evitar el 403
            return ResponseEntity.ok(new ArrayList<>());
        }
    }

    /**
     * Obtiene suscripciones por empresa
     */
    @GetMapping("/suscripciones/empresa/{empresaId}")
    public ResponseEntity<List<SuscripcionDTO>> obtenerSuscripcionesPorEmpresa(@PathVariable Long empresaId) {
        try {
            List<SuscripcionDTO> suscripciones = suscripcionService.obtenerSuscripcionesPorEmpresa(empresaId);
            return ResponseEntity.ok(suscripciones);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Crea una nueva suscripción
     */
    @PostMapping("/suscripciones")
    public ResponseEntity<SuscripcionDTO> crearSuscripcion(@RequestBody Map<String, Object> request) {
        try {
            Long empresaId = Long.valueOf(request.get("empresaId").toString());
            Long planId = Long.valueOf(request.get("planId").toString());
            LocalDateTime fechaInicio = LocalDateTime.now(); // Por defecto ahora

            SuscripcionDTO suscripcionCreada = suscripcionService.crearSuscripcion(empresaId, planId, fechaInicio);
            return ResponseEntity.ok(suscripcionCreada);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    /**
     * Suspende una suscripción
     */
    @PostMapping("/suscripciones/{suscripcionId}/suspender")
    public ResponseEntity<SuscripcionDTO> suspenderSuscripcion(@PathVariable Long suscripcionId) {
        try {
            SuscripcionDTO suscripcionSuspendida = suscripcionService.suspenderSuscripcion(suscripcionId);
            return ResponseEntity.ok(suscripcionSuspendida);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Reactiva una suscripción
     */
    @PostMapping("/suscripciones/{suscripcionId}/reactivar")
    public ResponseEntity<SuscripcionDTO> reactivarSuscripcion(@PathVariable Long suscripcionId) {
        try {
            SuscripcionDTO suscripcionReactivada = suscripcionService.reactivarSuscripcion(suscripcionId);
            return ResponseEntity.ok(suscripcionReactivada);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Cancela una suscripción
     */
    @PostMapping("/suscripciones/{suscripcionId}/cancelar")
    public ResponseEntity<SuscripcionDTO> cancelarSuscripcion(@PathVariable Long suscripcionId, @RequestBody Map<String, String> request) {
        try {
            String motivo = request.get("motivo");
            SuscripcionDTO suscripcionCancelada = suscripcionService.cancelarSuscripcion(suscripcionId, motivo);
            return ResponseEntity.ok(suscripcionCancelada);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Renueva una suscripción
     */
    @PostMapping("/suscripciones/{suscripcionId}/renovar")
    public ResponseEntity<SuscripcionDTO> renovarSuscripcion(@PathVariable Long suscripcionId) {
        try {
            SuscripcionDTO suscripcionRenovada = suscripcionService.renovarSuscripcion(suscripcionId);
            return ResponseEntity.ok(suscripcionRenovada);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // ===== ENDPOINTS PARA ESTADÍSTICAS =====

    /**
     * Obtiene estadísticas de suscripciones
     */
    @GetMapping("/estadisticas")
    public ResponseEntity<Map<String, Object>> obtenerEstadisticas() {
        try {
            Map<String, Object> estadisticas = suscripcionService.obtenerEstadisticas();
            return ResponseEntity.ok(estadisticas);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Obtiene suscripciones que expiran pronto
     */
    @GetMapping("/suscripciones/por-expirar")
    public ResponseEntity<List<SuscripcionDTO>> obtenerSuscripcionesPorExpirar(@RequestParam(defaultValue = "30") int dias) {
        try {
            List<SuscripcionDTO> suscripciones = suscripcionService.obtenerSuscripcionesPorExpirar(dias);
            return ResponseEntity.ok(suscripciones);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Endpoint para crear datos de prueba
     */
    @PostMapping("/crear-datos-prueba")
    public ResponseEntity<Map<String, String>> crearDatosPrueba() {
        try {
            System.out.println("🎯 Creando datos de prueba...");
            
            // Crear empresa de prueba
            Empresa empresa = new Empresa();
            empresa.setNombre("Empresa de Prueba");
            empresa.setSubdominio("prueba");
            empresa.setEmail("prueba@empresa.com");
            empresa.setTelefono("123456789");
            empresa.setDireccion("Dirección de Prueba");
            empresa.setCiudad("Ciudad de Prueba");
            empresa.setCodigoPostal("12345");
            empresa.setPais("País de Prueba");
            empresa.setDescripcion("Empresa de prueba para testing");
            empresa.setActiva(true);
            
            Empresa empresaGuardada = empresaRepository.save(empresa);
            System.out.println("🎯 Empresa creada con ID: " + empresaGuardada.getId());
            
            // Obtener el primer plan disponible
            List<Plan> planes = planRepository.findByActivoTrueOrderByOrdenAsc();
            if (!planes.isEmpty()) {
                Plan plan = planes.get(0);
                
                // Crear suscripción de prueba
                Suscripcion suscripcion = new Suscripcion();
                suscripcion.setEmpresa(empresaGuardada);
                suscripcion.setPlan(plan);
                suscripcion.setFechaInicio(LocalDateTime.now());
                suscripcion.setFechaFin(LocalDateTime.now().plusMonths(1));
                suscripcion.setEstado(Suscripcion.EstadoSuscripcion.ACTIVA);
                suscripcion.setPrecio(plan.getPrecio());
                suscripcion.setMoneda("USD");
                suscripcion.setRenovacionAutomatica(true);
                suscripcion.setNotificarAntesRenovacion(true);
                suscripcion.setDiasNotificacionRenovacion(7);
                
                Suscripcion suscripcionGuardada = suscripcionRepository.save(suscripcion);
                System.out.println("🎯 Suscripción creada con ID: " + suscripcionGuardada.getId());
                
                return ResponseEntity.ok(Map.of("mensaje", "Datos de prueba creados exitosamente", 
                                               "empresaId", empresaGuardada.getId().toString(),
                                               "suscripcionId", suscripcionGuardada.getId().toString()));
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "No hay planes disponibles"));
            }
            
        } catch (Exception e) {
            System.out.println("❌ Error creando datos de prueba: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/debug/empresa/{empresaId}")
    public ResponseEntity<?> debugSuscripcionesEmpresa(@PathVariable Long empresaId) {
        try {
            System.out.println("🔍 DEBUG: Verificando suscripciones para empresa ID: " + empresaId);
            
            // Verificar si la empresa existe
            Optional<Empresa> empresaOpt = empresaRepository.findById(empresaId);
            if (empresaOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Empresa empresa = empresaOpt.get();
            System.out.println("🔍 DEBUG: Empresa encontrada: " + empresa.getNombre());
            
            // Buscar suscripciones de la empresa
            List<Suscripcion> suscripciones = suscripcionRepository.findByEmpresaOrderByFechaCreacionDesc(empresa);
            System.out.println("🔍 DEBUG: Suscripciones encontradas: " + suscripciones.size());
            
            // Buscar el plan gratuito
            Optional<Plan> planGratuito = planRepository.findByNombre("Plan Gratuito");
            System.out.println("🔍 DEBUG: Plan gratuito encontrado: " + (planGratuito.isPresent() ? "SÍ" : "NO"));
            
            return ResponseEntity.ok(Map.of(
                "empresa", Map.of(
                    "id", empresa.getId(),
                    "nombre", empresa.getNombre(),
                    "subdominio", empresa.getSubdominio()
                ),
                "suscripciones", suscripciones.stream().map(s -> Map.of(
                    "id", s.getId(),
                    "plan", s.getPlan().getNombre(),
                    "estado", s.getEstado(),
                    "fechaInicio", s.getFechaInicio(),
                    "fechaFin", s.getFechaFin(),
                    "precio", s.getPrecio()
                )).collect(Collectors.toList()),
                "planGratuitoDisponible", planGratuito.isPresent(),
                "totalSuscripciones", suscripciones.size()
            ));
            
        } catch (Exception e) {
            System.err.println("❌ ERROR en debugSuscripcionesEmpresa: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Error interno: " + e.getMessage()));
        }
    }

    @GetMapping("/debug/mi-empresa")
    public ResponseEntity<?> debugMiEmpresa(HttpServletRequest request) {
        try {
            String token = request.getHeader("Authorization");
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of("error", "Token no válido"));
            }
            
            token = token.substring(7);
            String email = jwtUtils.extractUsername(token);
            
            System.out.println("🔍 DEBUG: Email del usuario: " + email);
            
            // Buscar usuario por email
            Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);
            if (usuarioOpt.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            Usuario usuario = usuarioOpt.get();
            Empresa empresa = usuario.getEmpresa();
            
            if (empresa == null) {
                return ResponseEntity.ok(Map.of(
                    "mensaje", "Usuario sin empresa asignada",
                    "email", email,
                    "rol", usuario.getRol()
                ));
            }
            
            return ResponseEntity.ok(Map.of(
                "usuario", Map.of(
                    "id", usuario.getId(),
                    "email", usuario.getEmail(),
                    "nombre", usuario.getNombre(),
                    "rol", usuario.getRol()
                ),
                "empresa", Map.of(
                    "id", empresa.getId(),
                    "nombre", empresa.getNombre(),
                    "subdominio", empresa.getSubdominio(),
                    "email", empresa.getEmail()
                )
            ));
            
        } catch (Exception e) {
            System.err.println("❌ ERROR en debugMiEmpresa: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Error interno: " + e.getMessage()));
        }
    }

    @GetMapping("/debug/todas-empresas")
    public ResponseEntity<?> debugTodasEmpresas() {
        try {
            System.out.println("🔍 DEBUG: Verificando todas las empresas y suscripciones");
            
            List<Empresa> empresas = empresaRepository.findAll();
            System.out.println("🔍 DEBUG: Total empresas encontradas: " + empresas.size());
            
            List<Map<String, Object>> resultado = new ArrayList<>();
            
            for (Empresa empresa : empresas) {
                List<Suscripcion> suscripciones = suscripcionRepository.findByEmpresaOrderByFechaCreacionDesc(empresa);
                
                Map<String, Object> empresaInfo = Map.of(
                    "id", empresa.getId(),
                    "nombre", empresa.getNombre(),
                    "subdominio", empresa.getSubdominio(),
                    "email", empresa.getEmail(),
                    "fechaCreacion", empresa.getFechaCreacion(),
                    "suscripciones", suscripciones.stream().map(s -> Map.of(
                        "id", s.getId(),
                        "plan", s.getPlan().getNombre(),
                        "estado", s.getEstado(),
                        "fechaInicio", s.getFechaInicio(),
                        "fechaFin", s.getFechaFin(),
                        "precio", s.getPrecio()
                    )).collect(Collectors.toList()),
                    "totalSuscripciones", suscripciones.size()
                );
                
                resultado.add(empresaInfo);
                System.out.println("🔍 DEBUG: Empresa " + empresa.getNombre() + " - Suscripciones: " + suscripciones.size());
            }
            
            return ResponseEntity.ok(Map.of(
                "empresas", resultado,
                "totalEmpresas", empresas.size()
            ));
            
        } catch (Exception e) {
            System.err.println("❌ ERROR en debugTodasEmpresas: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Error interno: " + e.getMessage()));
        }
    }

    @PostMapping("/debug/crear-suscripcion-gratuita/{empresaId}")
    public ResponseEntity<?> crearSuscripcionGratuita(@PathVariable Long empresaId) {
        try {
            System.out.println("🎯 DEBUG: Creando suscripción gratuita para empresa ID: " + empresaId);
            
            // Verificar si la empresa existe
            Optional<Empresa> empresaOpt = empresaRepository.findById(empresaId);
            if (empresaOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Empresa no encontrada"));
            }
            
            Empresa empresa = empresaOpt.get();
            System.out.println("🎯 DEBUG: Empresa encontrada: " + empresa.getNombre());
            
            // Buscar el plan gratuito
            Optional<Plan> planGratuito = planRepository.findByNombre("Plan Gratuito");
            if (planGratuito.isEmpty()) {
                return ResponseEntity.status(400).body(Map.of("error", "Plan gratuito no encontrado"));
            }
            
            Plan plan = planGratuito.get();
            System.out.println("🎯 DEBUG: Plan gratuito encontrado: " + plan.getNombre());
            
            // Verificar si ya tiene una suscripción activa
            List<Suscripcion> suscripcionesExistentes = suscripcionRepository.findByEmpresaOrderByFechaCreacionDesc(empresa);
            if (!suscripcionesExistentes.isEmpty()) {
                return ResponseEntity.status(400).body(Map.of(
                    "error", "La empresa ya tiene suscripciones",
                    "suscripciones", suscripcionesExistentes.size()
                ));
            }
            
            // Crear la suscripción gratuita
            Suscripcion suscripcion = new Suscripcion();
            suscripcion.setEmpresa(empresa);
            suscripcion.setPlan(plan);
            suscripcion.setFechaInicio(java.time.LocalDateTime.now());
            suscripcion.setFechaFin(java.time.LocalDateTime.now().plusDays(45));
            suscripcion.setEstado(Suscripcion.EstadoSuscripcion.ACTIVA);
            suscripcion.setPrecio(java.math.BigDecimal.ZERO);
            suscripcion.setMoneda("USD");
            suscripcion.setRenovacionAutomatica(false);
            suscripcion.setNotificarAntesRenovacion(true);
            suscripcion.setDiasNotificacionRenovacion(7);
            
            Suscripcion suscripcionGuardada = suscripcionRepository.save(suscripcion);
            System.out.println("🎯 DEBUG: Suscripción gratuita creada con ID: " + suscripcionGuardada.getId());
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Suscripción gratuita creada exitosamente",
                "suscripcion", Map.of(
                    "id", suscripcionGuardada.getId(),
                    "plan", plan.getNombre(),
                    "estado", suscripcionGuardada.getEstado(),
                    "fechaInicio", suscripcionGuardada.getFechaInicio(),
                    "fechaFin", suscripcionGuardada.getFechaFin(),
                    "precio", suscripcionGuardada.getPrecio()
                )
            ));
            
        } catch (Exception e) {
            System.err.println("❌ ERROR creando suscripción gratuita: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Error interno: " + e.getMessage()));
        }
    }

    /**
     * Obtiene la suscripción actual de la empresa autenticada
     */
    @GetMapping("/mi-suscripcion")
    public ResponseEntity<?> obtenerMiSuscripcion(HttpServletRequest request) {
        try {
            System.out.println("🔥 === INICIO DEBUG MI-SUSCRIPCION ===");
            System.out.println("🔥 Request URI: " + request.getRequestURI());
            System.out.println("🔥 Request Method: " + request.getMethod());
            System.out.println("🔥 Authorization Header: " + request.getHeader("Authorization"));
            // Extraer token del header Authorization
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of("error", "Token de autorización requerido"));
            }
            String token = authHeader.substring(7);
            
            // Extraer email del JWT
            String email = jwtUtils.extractUsername(token);
            System.out.println("🔍 Buscando suscripción para empresa con email: " + email);
            
            // Buscar usuario por email
            Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            
            System.out.println("🔍 Usuario encontrado: " + usuario.getEmail() + " (ID: " + usuario.getId() + ")");
            
            if (usuario.getEmpresa() == null) {
                System.out.println("❌ Usuario no tiene empresa asociada");
                return ResponseEntity.status(404).body(Map.of("error", "Usuario no tiene empresa asociada"));
            }
            
            Empresa empresa = usuario.getEmpresa();
            System.out.println("🔍 Empresa encontrada: " + empresa.getNombre() + " (ID: " + empresa.getId() + ")");
            
            // Buscar suscripción activa
            System.out.println("🔍 Buscando suscripción activa para empresa: " + empresa.getId());
            Suscripcion suscripcion = suscripcionRepository.findFirstByEmpresaAndEstado(empresa, Suscripcion.EstadoSuscripcion.ACTIVA)
                .orElse(null);
            
            if (suscripcion == null) {
                System.out.println("❌ No se encontró suscripción activa para empresa: " + empresa.getId());
                return ResponseEntity.status(404).body(Map.of("error", "No se encontró suscripción activa"));
            }
            
            System.out.println("✅ Suscripción activa encontrada: " + suscripcion.getId());
            
            // Crear respuesta con información detallada
            System.out.println("🔍 Creando respuesta para suscripción...");
            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("id", suscripcion.getId());
            
            // Crear mapa del plan con todas las características
            System.out.println("🔍 Obteniendo información del plan...");
            Plan plan = suscripcion.getPlan();
            if (plan == null) {
                throw new RuntimeException("Suscripción sin plan asociado");
            }
            
            Map<String, Object> planInfo = new HashMap<>();
            planInfo.put("id", plan.getId());
            planInfo.put("nombre", plan.getNombre());
            planInfo.put("descripcion", plan.getDescripcion());
            planInfo.put("precio", plan.getPrecio());
            planInfo.put("periodo", plan.getPeriodo());
            planInfo.put("maxProductos", plan.getMaxProductos());
            planInfo.put("maxUsuarios", plan.getMaxUsuarios());
            planInfo.put("maxClientes", plan.getMaxClientes());
            planInfo.put("maxAlmacenamientoGB", plan.getMaxAlmacenamientoGB());
            planInfo.put("personalizacionCompleta", plan.getPersonalizacionCompleta());
            planInfo.put("estadisticasAvanzadas", plan.getEstadisticasAvanzadas());
            planInfo.put("soportePrioritario", plan.getSoportePrioritario());
            planInfo.put("integracionesAvanzadas", plan.getIntegracionesAvanzadas());
            planInfo.put("backupAutomatico", plan.getBackupAutomatico());
            planInfo.put("dominioPersonalizado", plan.getDominioPersonalizado());
            
            System.out.println("🔍 Agregando información de suscripción...");
            respuesta.put("plan", planInfo);
            respuesta.put("estado", suscripcion.getEstado());
            respuesta.put("fechaInicio", suscripcion.getFechaInicio());
            respuesta.put("fechaFin", suscripcion.getFechaFin());
            respuesta.put("diasRestantes", suscripcion.getDiasRestantes());
            respuesta.put("estaActiva", suscripcion.estaActiva());
            respuesta.put("estaExpirada", suscripcion.estaExpirada());
            respuesta.put("estaPorExpirar", suscripcion.estaPorExpirar());
            respuesta.put("precio", suscripcion.getPrecio());
            respuesta.put("moneda", suscripcion.getMoneda());
            
            System.out.println("✅ Suscripción encontrada: " + suscripcion.getPlan().getNombre() + 
                             " - Días restantes: " + suscripcion.getDiasRestantes());
            
            return ResponseEntity.ok(respuesta);
            
        } catch (Exception e) {
            System.out.println("🔥 ❌ ERROR COMPLETO EN MI-SUSCRIPCION:");
            System.out.println("🔥 Clase de error: " + e.getClass().getName());
            System.out.println("🔥 Mensaje: " + e.getMessage());
            System.out.println("🔥 Stack trace:");
            e.printStackTrace();
            System.out.println("🔥 === FIN ERROR MI-SUSCRIPCION ===");
            return ResponseEntity.status(500).body(Map.of("error", "Error interno del servidor", "detalle", e.getMessage()));
        }
    }

    /**
     * Debug simple para verificar que el endpoint funciona sin autenticación
     */
    @GetMapping("/debug/test-simple")
    public ResponseEntity<?> debugTestSimple() {
        try {
            System.out.println("🔥 TEST SIMPLE - Endpoint funcionando");
            
            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("mensaje", "Endpoint funcionando correctamente");
            respuesta.put("timestamp", LocalDateTime.now());
            respuesta.put("servidor", "Producción Railway");
            
            return ResponseEntity.ok(respuesta);
            
        } catch (Exception e) {
            System.err.println("❌ ERROR en test simple: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error en test simple: " + e.getMessage()));
        }
    }

    @GetMapping("/debug/plan-por-defecto")
    public ResponseEntity<?> debugPlanPorDefecto() {
        try {
            System.out.println("🔍 DEBUG: Verificando plan por defecto");
            
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
                planInfo.put("maxClientes", plan.getMaxClientes());
                planInfo.put("maxUsuarios", plan.getMaxUsuarios());
                planInfo.put("maxAlmacenamientoGB", plan.getMaxAlmacenamientoGB());
                
                System.out.println("🔍 DEBUG: Plan por defecto encontrado: " + plan.getNombre());
                return ResponseEntity.ok(planInfo);
            } else {
                System.out.println("🔍 DEBUG: No hay plan por defecto configurado");
                return ResponseEntity.status(404).body(Map.of("error", "No hay plan por defecto configurado"));
            }
        } catch (Exception e) {
            System.err.println("❌ ERROR en debugPlanPorDefecto: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Obtiene el plan por defecto
     */
    @GetMapping("/planes/por-defecto")
    public ResponseEntity<PlanDTO> obtenerPlanPorDefecto() {
        try {
            return suscripcionService.obtenerPlanPorDefecto()
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * Marca un plan como plan por defecto
     */
    @PostMapping("/planes/{planId}/marcar-por-defecto")
    public ResponseEntity<PlanDTO> marcarPlanPorDefecto(@PathVariable Long planId) {
        try {
            PlanDTO planActualizado = suscripcionService.marcarPlanPorDefecto(planId);
            return ResponseEntity.ok(planActualizado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Obtiene estadísticas de consumo para la empresa autenticada
     */
    @GetMapping("/mi-consumo")
    public ResponseEntity<?> obtenerMiConsumo(HttpServletRequest request) {
        try {
            // Extraer token del header Authorization
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of("error", "Token de autorización requerido"));
            }
            String token = authHeader.substring(7);
            
            // Extraer email del JWT
            String email = jwtUtils.extractUsername(token);
            System.out.println("🔍 Email extraído del token: " + email);
            
            // Buscar usuario por email
            Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            
            if (usuario.getEmpresa() == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Usuario no tiene empresa asociada"));
            }
            
            Empresa empresa = usuario.getEmpresa();
            Map<String, Object> estadisticas = suscripcionService.obtenerEstadisticasConsumo(empresa.getId());
            
            return ResponseEntity.ok(estadisticas);
            
        } catch (Exception e) {
            System.out.println("❌ Error obteniendo consumo: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error interno del servidor"));
        }
    }

    /**
     * Obtiene estadísticas de consumo para una empresa específica (Super Admin)
     */
    @GetMapping("/consumo/empresa/{empresaId}")
    public ResponseEntity<?> obtenerConsumoEmpresa(@PathVariable Long empresaId) {
        try {
            Map<String, Object> estadisticas = suscripcionService.obtenerEstadisticasConsumo(empresaId);
            return ResponseEntity.ok(estadisticas);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Debug endpoint para verificar suscripciones
     */
    @GetMapping("/debug/suscripciones")
    public ResponseEntity<?> debugSuscripciones() {
        try {
            System.out.println("🔍 DEBUG: Verificando suscripciones...");
            long totalSuscripciones = suscripcionRepository.count();
            System.out.println("🔍 DEBUG: Total suscripciones en BD: " + totalSuscripciones);
            List<Suscripcion> todasSuscripciones = suscripcionRepository.findAll();
            System.out.println("🔍 DEBUG: Suscripciones encontradas: " + todasSuscripciones.size());
            List<Object[]> resultados = suscripcionRepository.findSuscripcionesConDetalles();
            System.out.println("🔍 DEBUG: Resultados de consulta con detalles: " + resultados.size());
            List<Map<String, Object>> suscripcionesDebug = new ArrayList<>();
            for (int i = 0; i < Math.min(resultados.size(), 5); i++) {
                Object[] resultado = resultados.get(i);
                Map<String, Object> suscripcionDebug = new HashMap<>();
                if (resultado[0] instanceof Suscripcion) {
                    Suscripcion suscripcion = (Suscripcion) resultado[0];
                    suscripcionDebug.put("id", suscripcion.getId());
                    suscripcionDebug.put("estado", suscripcion.getEstado());
                    suscripcionDebug.put("fechaInicio", suscripcion.getFechaInicio());
                    suscripcionDebug.put("fechaFin", suscripcion.getFechaFin());
                    suscripcionDebug.put("empresaId", suscripcion.getEmpresa() != null ? suscripcion.getEmpresa().getId() : null);
                    suscripcionDebug.put("planId", suscripcion.getPlan() != null ? suscripcion.getPlan().getId() : null);
                }
                suscripcionDebug.put("empresaNombre", resultado[1]);
                suscripcionDebug.put("empresaSubdominio", resultado[2]);
                suscripcionDebug.put("planNombre", resultado[3]);
                suscripcionesDebug.add(suscripcionDebug);
            }
            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("totalSuscripciones", totalSuscripciones);
            respuesta.put("suscripcionesEncontradas", todasSuscripciones.size());
            respuesta.put("resultadosConsulta", resultados.size());
            respuesta.put("primerasSuscripciones", suscripcionesDebug);
            return ResponseEntity.ok(respuesta);
        } catch (Exception e) {
            System.err.println("❌ ERROR en debugSuscripciones: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error interno: " + e.getMessage()));
        }
    }

    /**
     * Debug endpoint para crear plan por defecto manualmente
     */
    @PostMapping("/debug/crear-plan-por-defecto")
    public ResponseEntity<?> crearPlanPorDefectoDebug() {
        try {
            System.out.println("🔧 DEBUG: Creando plan por defecto manualmente...");
            
            // Verificar si ya existe un plan por defecto
            Optional<Plan> planExistente = planRepository.findByPlanPorDefectoTrue();
            if (planExistente.isPresent()) {
                Plan plan = planExistente.get();
                return ResponseEntity.ok(Map.of(
                    "mensaje", "Plan por defecto ya existe",
                    "planId", plan.getId(),
                    "planNombre", plan.getNombre(),
                    "yaExiste", true
                ));
            }

            // Crear plan gratuito por defecto
            Plan planGratuito = new Plan();
            planGratuito.setNombre("Plan Gratuito");
            planGratuito.setDescripcion("Plan gratuito con funcionalidades básicas");
            planGratuito.setPrecio(BigDecimal.ZERO);
            planGratuito.setPeriodo(Plan.PeriodoPlan.MENSUAL);
            planGratuito.setMaxProductos(50);
            planGratuito.setMaxUsuarios(2);
            planGratuito.setMaxClientes(500);
            planGratuito.setMaxAlmacenamientoGB(5);
            planGratuito.setActivo(true);
            planGratuito.setPlanPorDefecto(true);
            planGratuito.setDestacado(false);
            planGratuito.setOrden(1);

            // Características del plan gratuito
            planGratuito.setPersonalizacionCompleta(false);
            planGratuito.setEstadisticasAvanzadas(false);
            planGratuito.setSoportePrioritario(false);
            planGratuito.setIntegracionesAvanzadas(false);
            planGratuito.setBackupAutomatico(false);
            planGratuito.setDominioPersonalizado(false);

            Plan planGuardado = planRepository.save(planGratuito);
            System.out.println("✅ Plan por defecto creado: " + planGuardado.getNombre());

            return ResponseEntity.ok(Map.of(
                "mensaje", "Plan por defecto creado exitosamente",
                "planId", planGuardado.getId(),
                "planNombre", planGuardado.getNombre(),
                "yaExiste", false
            ));
            
        } catch (Exception e) {
            System.err.println("❌ ERROR creando plan por defecto: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error interno: " + e.getMessage()));
        }
    }

    /**
     * Debug endpoint para verificar estado completo del sistema
     */
    @GetMapping("/debug/estado-sistema")
    public ResponseEntity<?> debugEstadoSistema() {
        try {
            System.out.println("🔍 DEBUG: Verificando estado completo del sistema...");
            
            // Verificar planes
            long totalPlanes = planRepository.count();
            Optional<Plan> planPorDefecto = planRepository.findByPlanPorDefectoTrue();
            
            // Verificar empresas
            long totalEmpresas = empresaRepository.count();
            
            // Verificar suscripciones
            long totalSuscripciones = suscripcionRepository.count();
            
            // Verificar usuarios
            long totalUsuarios = usuarioRepository.count();
            
            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("planes", Map.of(
                "total", totalPlanes,
                "planPorDefectoExiste", planPorDefecto.isPresent(),
                "planPorDefectoId", planPorDefecto.map(Plan::getId).orElse(null),
                "planPorDefectoNombre", planPorDefecto.map(Plan::getNombre).orElse(null)
            ));
            respuesta.put("empresas", Map.of("total", totalEmpresas));
            respuesta.put("suscripciones", Map.of("total", totalSuscripciones));
            respuesta.put("usuarios", Map.of("total", totalUsuarios));
            
            return ResponseEntity.ok(respuesta);
            
        } catch (Exception e) {
            System.err.println("❌ ERROR en debugEstadoSistema: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error interno: " + e.getMessage()));
        }
    }

    /**
     * Debug endpoint para arreglar empresas sin suscripción
     */
    @PostMapping("/debug/arreglar-empresas-sin-suscripcion")
    public ResponseEntity<?> arreglarEmpresasSinSuscripcion() {
        try {
            System.out.println("🔧 DEBUG: Arreglando empresas sin suscripción...");
            
            // Crear plan por defecto si no existe
            Optional<Plan> planPorDefecto = planRepository.findByPlanPorDefectoTrue();
            if (planPorDefecto.isEmpty()) {
                System.out.println("📋 Creando plan por defecto...");
                
                Plan planGratuito = new Plan();
                planGratuito.setNombre("Plan Gratuito");
                planGratuito.setDescripcion("Plan gratuito con funcionalidades básicas");
                planGratuito.setPrecio(BigDecimal.ZERO);
                planGratuito.setPeriodo(Plan.PeriodoPlan.MENSUAL);
                planGratuito.setMaxProductos(50);
                planGratuito.setMaxUsuarios(2);
                planGratuito.setMaxClientes(500);
                planGratuito.setMaxAlmacenamientoGB(5);
                planGratuito.setActivo(true);
                planGratuito.setPlanPorDefecto(true);
                planGratuito.setDestacado(false);
                planGratuito.setOrden(1);

                // Características del plan gratuito
                planGratuito.setPersonalizacionCompleta(false);
                planGratuito.setEstadisticasAvanzadas(false);
                planGratuito.setSoportePrioritario(false);
                planGratuito.setIntegracionesAvanzadas(false);
                planGratuito.setBackupAutomatico(false);
                planGratuito.setDominioPersonalizado(false);

                planGratuito = planRepository.save(planGratuito);
                System.out.println("✅ Plan por defecto creado: " + planGratuito.getNombre());
            }
            
            // Obtener todas las empresas
            List<Empresa> todasLasEmpresas = empresaRepository.findAll();
            List<Map<String, Object>> empresasArregladas = new ArrayList<>();
            List<Map<String, Object>> empresasConSuscripcion = new ArrayList<>();
            
            for (Empresa empresa : todasLasEmpresas) {
                // Verificar si la empresa ya tiene suscripción
                List<Suscripcion> suscripciones = suscripcionRepository.findByEmpresaOrderByFechaCreacionDesc(empresa);
                boolean tieneSuscripcion = !suscripciones.isEmpty();
                
                if (!tieneSuscripcion) {
                    System.out.println("🎯 Creando suscripción para empresa: " + empresa.getNombre() + " (ID: " + empresa.getId() + ")");
                    
                    try {
                        Suscripcion suscripcion = suscripcionAutomaticaService.crearSuscripcionGratuita(empresa);
                        empresasArregladas.add(Map.of(
                            "empresaId", empresa.getId(),
                            "empresaNombre", empresa.getNombre(),
                            "suscripcionId", suscripcion.getId(),
                            "estado", "Creada"
                        ));
                        System.out.println("✅ Suscripción creada para empresa: " + empresa.getNombre());
                    } catch (Exception e) {
                        empresasArregladas.add(Map.of(
                            "empresaId", empresa.getId(),
                            "empresaNombre", empresa.getNombre(),
                            "error", e.getMessage(),
                            "estado", "Error"
                        ));
                        System.err.println("❌ Error creando suscripción para empresa " + empresa.getNombre() + ": " + e.getMessage());
                    }
                } else {
                    empresasConSuscripcion.add(Map.of(
                        "empresaId", empresa.getId(),
                        "empresaNombre", empresa.getNombre(),
                        "estado", "Ya tiene suscripción"
                    ));
                }
            }
            
            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("mensaje", "Proceso completado");
            respuesta.put("empresasArregladas", empresasArregladas);
            respuesta.put("empresasConSuscripcion", empresasConSuscripcion);
            respuesta.put("totalEmpresasArregladas", empresasArregladas.size());
            respuesta.put("totalEmpresasConSuscripcion", empresasConSuscripcion.size());
            
            return ResponseEntity.ok(respuesta);
            
        } catch (Exception e) {
            System.err.println("❌ ERROR arreglando empresas: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error interno: " + e.getMessage()));
        }
    }
} 