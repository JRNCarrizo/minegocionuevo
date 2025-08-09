package com.minegocio.backend.controladores;

import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Plan;
import com.minegocio.backend.entidades.Suscripcion;
import com.minegocio.backend.entidades.Usuario;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.UsuarioRepository;
import com.minegocio.backend.seguridad.JwtUtils;
import com.minegocio.backend.servicios.SuscripcionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
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
    private JwtUtils jwtUtils;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private EmpresaRepository empresaRepository;

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
            String email = jwtUtils.getUserNameFromJwtToken(token);
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

            // Obtener suscripción activa
            Suscripcion suscripcionActiva = suscripcionService.obtenerSuscripcionActivaPorEmpresa(empresa.getId());
            if (suscripcionActiva == null) {
                System.out.println("🔥 ❌ No hay suscripción activa para la empresa");
                return ResponseEntity.status(404).body(Map.of("error", "No hay suscripción activa"));
            }

            System.out.println("🔥 Suscripción activa encontrada - ID: " + suscripcionActiva.getId());

            Plan plan = suscripcionActiva.getPlan();
            System.out.println("🔥 Plan - ID: " + plan.getId() + ", Nombre: " + plan.getNombre());

            // Calcular días restantes
            long diasRestantes = ChronoUnit.DAYS.between(LocalDateTime.now(), suscripcionActiva.getFechaFin());
            System.out.println("🔥 Días restantes calculados: " + diasRestantes);

            // Preparar respuesta
            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("suscripcion", Map.of(
                "id", suscripcionActiva.getId(),
                "estado", suscripcionActiva.getEstado(),
                "fechaInicio", suscripcionActiva.getFechaInicio(),
                "fechaFin", suscripcionActiva.getFechaFin(),
                "diasRestantes", Math.max(0, diasRestantes),
                "estaActiva", suscripcionActiva.isEstaActiva(),
                "estaPorExpirar", diasRestantes <= 7 && diasRestantes > 0
            ));

            respuesta.put("plan", Map.of(
                "id", plan.getId(),
                "nombre", plan.getNombre(),
                "descripcion", plan.getDescripcion() != null ? plan.getDescripcion() : "",
                "precio", plan.getPrecio(),
                "periodo", plan.getPeriodo() != null ? plan.getPeriodo() : "MENSUAL",
                "maxProductos", plan.getMaxProductos(),
                "maxUsuarios", plan.getMaxUsuarios(),
                "maxClientes", plan.getMaxClientes(),
                "maxAlmacenamientoGB", plan.getMaxAlmacenamientoGB(),
                "personalizacionCompleta", plan.isPersonalizacionCompleta(),
                "estadisticasAvanzadas", plan.isEstadisticasAvanzadas(),
                "soportePrioritario", plan.isSoportePrioritario(),
                "integracionesAvanzadas", plan.isIntegracionesAvanzadas(),
                "backupAutomatico", plan.isBackupAutomatico(),
                "dominioPersonalizado", plan.isDominioPersonalizado()
            ));

            respuesta.put("empresa", Map.of(
                "id", empresa.getId(),
                "nombre", empresa.getNombre()
            ));

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

            String email = jwtUtils.getUserNameFromJwtToken(token);
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
}