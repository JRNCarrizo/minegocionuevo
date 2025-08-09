package com.minegocio.backend.controladores;

import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Suscripcion;
import com.minegocio.backend.entidades.Usuario;
import com.minegocio.backend.entidades.Plan;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.SuscripcionRepository;
import com.minegocio.backend.repositorios.UsuarioRepository;
import com.minegocio.backend.repositorios.PlanRepository;
import com.minegocio.backend.servicios.SuscripcionService;
import com.minegocio.backend.seguridad.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.List;

/**
 * Controlador para manejar suscripciones de empresas desde el frontend
 */
@RestController
@RequestMapping("/api/suscripciones")
@CrossOrigin(origins = {"http://localhost:5173", "http://*.localhost:5173", "https://*.localhost:5173", "https://*.onrender.com", "https://*.netlify.app", "https://*.vercel.app", "https://negocio360.org", "https://*.negocio360.org"}, allowedHeaders = "*")
public class EmpresaSuscripcionController {

    @Autowired
    private SuscripcionService suscripcionService;

    @Autowired
    private EmpresaRepository empresaRepository;

    @Autowired
    private SuscripcionRepository suscripcionRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PlanRepository planRepository;

    @Autowired
    private JwtUtils jwtUtils;

    /**
     * Obtiene la suscripción actual de la empresa autenticada
     */
    @GetMapping("/mi-suscripcion")
    public ResponseEntity<?> obtenerMiSuscripcion(HttpServletRequest request) {
        try {
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
            
            if (usuario.getEmpresa() == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Usuario no tiene empresa asociada"));
            }
            
            Empresa empresa = usuario.getEmpresa();
            System.out.println("🔍 Empresa encontrada: " + empresa.getNombre() + " (ID: " + empresa.getId() + ")");
            
            // Buscar suscripción activa
            Suscripcion suscripcion = suscripcionRepository.findFirstByEmpresaAndEstado(empresa, Suscripcion.EstadoSuscripcion.ACTIVA)
                .orElse(null);
            
            if (suscripcion == null) {
                return ResponseEntity.status(404).body(Map.of("error", "No se encontró suscripción activa"));
            }
            
            // Obtener estadísticas de consumo con manejo de errores
            Map<String, Object> consumo;
            try {
                System.out.println("🔍 Obteniendo estadísticas de consumo para empresa: " + empresa.getId());
                consumo = suscripcionService.obtenerEstadisticasConsumo(empresa.getId());
                System.out.println("✅ Estadísticas de consumo obtenidas correctamente");
            } catch (Exception e) {
                System.out.println("❌ Error obteniendo estadísticas de consumo: " + e.getMessage());
                e.printStackTrace();
                // Crear consumo vacío para evitar error completo
                consumo = Map.of(
                    "plan", Map.of("nombre", "Error"),
                    "consumo", Map.of("productos", 0, "clientes", 0, "usuarios", 0, "almacenamientoGB", 0),
                    "suscripcion", Map.of("diasRestantes", 0, "estaPorExpirar", false)
                );
            }
            
            // Crear respuesta con información detallada
            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("id", suscripcion.getId());
            
            // Crear mapa del plan con todas las características
            Map<String, Object> planInfo = new HashMap<>();
            planInfo.put("id", suscripcion.getPlan().getId());
            planInfo.put("nombre", suscripcion.getPlan().getNombre());
            planInfo.put("descripcion", suscripcion.getPlan().getDescripcion());
            planInfo.put("precio", suscripcion.getPlan().getPrecio());
            planInfo.put("periodo", suscripcion.getPlan().getPeriodo());
            planInfo.put("maxProductos", suscripcion.getPlan().getMaxProductos());
            planInfo.put("maxUsuarios", suscripcion.getPlan().getMaxUsuarios());
            planInfo.put("maxClientes", suscripcion.getPlan().getMaxClientes());
            planInfo.put("maxAlmacenamientoGB", suscripcion.getPlan().getMaxAlmacenamientoGB());
            planInfo.put("personalizacionCompleta", suscripcion.getPlan().getPersonalizacionCompleta());
            planInfo.put("estadisticasAvanzadas", suscripcion.getPlan().getEstadisticasAvanzadas());
            planInfo.put("soportePrioritario", suscripcion.getPlan().getSoportePrioritario());
            planInfo.put("integracionesAvanzadas", suscripcion.getPlan().getIntegracionesAvanzadas());
            planInfo.put("backupAutomatico", suscripcion.getPlan().getBackupAutomatico());
            planInfo.put("dominioPersonalizado", suscripcion.getPlan().getDominioPersonalizado());
            
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
            respuesta.put("consumo", consumo);
            
            System.out.println("✅ Suscripción encontrada: " + suscripcion.getPlan().getNombre() + 
                             " - Días restantes: " + suscripcion.getDiasRestantes());
            
            return ResponseEntity.ok(respuesta);
            
        } catch (Exception e) {
            System.out.println("❌ Error obteniendo suscripción: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error interno del servidor"));
        }
    }

    /**
     * Obtiene el consumo actual de la empresa
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
            
            // Buscar usuario por email
            Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            
            if (usuario.getEmpresa() == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Usuario no tiene empresa asociada"));
            }
            
            Empresa empresa = usuario.getEmpresa();
            
            // Obtener estadísticas de consumo
            Map<String, Object> consumo = suscripcionService.obtenerEstadisticasConsumo(empresa.getId());
            
            return ResponseEntity.ok(consumo);
            
        } catch (Exception e) {
            System.out.println("❌ Error obteniendo consumo: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error interno del servidor"));
        }
    }

    /**
     * Endpoint de debug SIN AUTENTICACIÓN para verificar configuración
     */
    @GetMapping("/debug/info")
    public ResponseEntity<?> debugInfo() {
        try {
            Map<String, Object> info = new HashMap<>();
            info.put("mensaje", "Controlador EmpresaSuscripcionController funcionando");
            info.put("timestamp", LocalDateTime.now());
            info.put("endpoints", List.of(
                "/api/suscripciones/mi-suscripcion",
                "/api/suscripciones/mi-consumo", 
                "/api/suscripciones/debug/test",
                "/api/suscripciones/debug/crear-suscripcion-usuario"
            ));
            return ResponseEntity.ok(info);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Endpoint de debug para probar la conexión y obtener información básica
     */
    @GetMapping("/debug/test")
    public ResponseEntity<?> testEndpoint(HttpServletRequest request) {
        try {
            // Extraer token del header Authorization
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of("error", "Token de autorización requerido"));
            }
            String token = authHeader.substring(7);
            
            // Extraer email del JWT
            String email = jwtUtils.extractUsername(token);
            System.out.println("🔧 DEBUG TEST: Email extraído: " + email);
            
            // Buscar usuario por email
            Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            
            System.out.println("🔧 DEBUG TEST: Usuario encontrado: " + usuario.getNombre());
            
            if (usuario.getEmpresa() == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Usuario no tiene empresa asociada"));
            }
            
            Empresa empresa = usuario.getEmpresa();
            System.out.println("🔧 DEBUG TEST: Empresa encontrada: " + empresa.getNombre() + " (ID: " + empresa.getId() + ")");
            
            // Verificar si tiene suscripción
            Suscripcion suscripcion = suscripcionRepository.findFirstByEmpresaAndEstado(empresa, Suscripcion.EstadoSuscripcion.ACTIVA)
                .orElse(null);
            
            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("usuario", Map.of(
                "id", usuario.getId(),
                "email", usuario.getEmail(),
                "nombre", usuario.getNombre()
            ));
            respuesta.put("empresa", Map.of(
                "id", empresa.getId(),
                "nombre", empresa.getNombre()
            ));
            respuesta.put("tieneSuscripcion", suscripcion != null);
            if (suscripcion != null) {
                respuesta.put("suscripcion", Map.of(
                    "id", suscripcion.getId(),
                    "plan", suscripcion.getPlan().getNombre(),
                    "estado", suscripcion.getEstado()
                ));
            }
            
            return ResponseEntity.ok(respuesta);
            
        } catch (Exception e) {
            System.out.println("❌ Error en test endpoint: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error interno del servidor: " + e.getMessage()));
        }
    }

    /**
     * Endpoint de debug para crear suscripción para usuarios sin suscripción
     */
    @PostMapping("/debug/crear-suscripcion-usuario")
    public ResponseEntity<?> crearSuscripcionParaUsuario(HttpServletRequest request) {
        try {
            // Extraer token del header Authorization
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of("error", "Token de autorización requerido"));
            }
            String token = authHeader.substring(7);
            
            // Extraer email del JWT
            String email = jwtUtils.extractUsername(token);
            System.out.println("🔧 DEBUG: Creando suscripción para usuario: " + email);
            
            // Buscar usuario por email
            Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            
            if (usuario.getEmpresa() == null) {
                return ResponseEntity.status(404).body(Map.of("error", "Usuario no tiene empresa asociada"));
            }
            
            Empresa empresa = usuario.getEmpresa();
            System.out.println("🔧 DEBUG: Empresa encontrada: " + empresa.getNombre() + " (ID: " + empresa.getId() + ")");
            
            // Verificar si ya tiene suscripción
            Suscripcion suscripcionExistente = suscripcionRepository.findFirstByEmpresaAndEstado(empresa, Suscripcion.EstadoSuscripcion.ACTIVA)
                .orElse(null);
            
            if (suscripcionExistente != null) {
                return ResponseEntity.ok(Map.of(
                    "mensaje", "El usuario ya tiene una suscripción activa",
                    "suscripcionId", suscripcionExistente.getId(),
                    "plan", suscripcionExistente.getPlan().getNombre()
                ));
            }
            
            // Buscar plan por defecto o crear uno básico
            Optional<Plan> planPorDefecto = planRepository.findByPlanPorDefectoTrue();
            Plan plan;
            
            if (planPorDefecto.isPresent()) {
                plan = planPorDefecto.get();
                System.out.println("🔧 DEBUG: Usando plan por defecto: " + plan.getNombre());
            } else {
                // Crear un plan básico si no existe
                plan = new Plan();
                plan.setNombre("Plan Básico");
                plan.setDescripcion("Plan básico para usuarios existentes");
                plan.setPrecio(BigDecimal.ZERO);
                plan.setPeriodo(Plan.PeriodoPlan.MENSUAL);
                plan.setMaxProductos(10);
                plan.setMaxUsuarios(2);
                plan.setMaxClientes(50);
                plan.setMaxAlmacenamientoGB(1);
                plan.setPlanPorDefecto(true);
                plan.setPersonalizacionCompleta(false);
                plan.setEstadisticasAvanzadas(false);
                plan.setSoportePrioritario(false);
                plan.setIntegracionesAvanzadas(false);
                plan.setBackupAutomatico(false);
                plan.setDominioPersonalizado(false);
                
                plan = planRepository.save(plan);
                System.out.println("🔧 DEBUG: Plan básico creado con ID: " + plan.getId());
            }
            
            // Crear suscripción
            Suscripcion nuevaSuscripcion = new Suscripcion();
            nuevaSuscripcion.setEmpresa(empresa);
            nuevaSuscripcion.setPlan(plan);
            nuevaSuscripcion.setEstado(Suscripcion.EstadoSuscripcion.ACTIVA);
            nuevaSuscripcion.setFechaInicio(LocalDateTime.now());
            nuevaSuscripcion.setFechaFin(LocalDateTime.now().plusMonths(1)); // 1 mes de suscripción
            nuevaSuscripcion.setPrecio(plan.getPrecio());
            nuevaSuscripcion.setMoneda("USD");
            
            nuevaSuscripcion = suscripcionRepository.save(nuevaSuscripcion);
            
            System.out.println("✅ DEBUG: Suscripción creada exitosamente con ID: " + nuevaSuscripcion.getId());
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Suscripción creada exitosamente",
                "suscripcionId", nuevaSuscripcion.getId(),
                "plan", plan.getNombre(),
                "fechaInicio", nuevaSuscripcion.getFechaInicio(),
                "fechaFin", nuevaSuscripcion.getFechaFin()
            ));
            
        } catch (Exception e) {
            System.out.println("❌ Error creando suscripción: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error interno del servidor: " + e.getMessage()));
        }
    }
}
