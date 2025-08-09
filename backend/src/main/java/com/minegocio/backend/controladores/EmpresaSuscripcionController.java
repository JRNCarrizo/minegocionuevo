package com.minegocio.backend.controladores;

import com.minegocio.backend.dto.SuscripcionDTO;
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
            if (suscripciones.isEmpty()) {
                System.out.println("🔥 ❌ No hay suscripciones para la empresa");
                return ResponseEntity.status(404).body(Map.of("error", "No hay suscripciones para la empresa"));
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

            // Preparar respuesta
            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("suscripcion", Map.of(
                "id", suscripcionActivaDTO.getId(),
                "estado", suscripcionActivaDTO.getEstado(),
                "fechaInicio", suscripcionActivaDTO.getFechaInicio(),
                "fechaFin", suscripcionActivaDTO.getFechaFin(),
                "diasRestantes", Math.max(0, diasRestantes),
                "estaActiva", suscripcionActivaDTO.getEstaActiva(),
                "estaPorExpirar", diasRestantes <= 7 && diasRestantes > 0
            ));

            Map<String, Object> planData = new HashMap<>();
            planData.put("id", suscripcionActivaDTO.getPlanId());
            planData.put("nombre", suscripcionActivaDTO.getPlanNombre());
            planData.put("descripcion", "");  // No disponible en DTO
            planData.put("precio", suscripcionActivaDTO.getPrecio());
            planData.put("periodo", "MENSUAL");  // Valor por defecto
            planData.put("maxProductos", 100);  // Valores por defecto temporales
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
}