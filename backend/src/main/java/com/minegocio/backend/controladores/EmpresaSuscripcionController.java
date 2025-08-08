package com.minegocio.backend.controladores;

import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Suscripcion;
import com.minegocio.backend.entidades.Usuario;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.SuscripcionRepository;
import com.minegocio.backend.repositorios.UsuarioRepository;
import com.minegocio.backend.servicios.SuscripcionService;
import com.minegocio.backend.seguridad.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

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
            
            // Obtener estadísticas de consumo
            Map<String, Object> consumo = suscripcionService.obtenerEstadisticasConsumo(empresa.getId());
            
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
}
