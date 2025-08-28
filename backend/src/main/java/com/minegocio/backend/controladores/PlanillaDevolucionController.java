package com.minegocio.backend.controladores;

import com.minegocio.backend.dto.PlanillaDevolucionDTO;
import com.minegocio.backend.dto.PlanillaDevolucionResponseDTO;
import com.minegocio.backend.entidades.PlanillaDevolucion;
import com.minegocio.backend.servicios.PlanillaDevolucionService;
import com.minegocio.backend.seguridad.UsuarioPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.Map;

@RestController
@RequestMapping("/api/devoluciones")
@CrossOrigin(origins = "*")
public class PlanillaDevolucionController {

    @Autowired
    private PlanillaDevolucionService planillaDevolucionService;

    /**
     * Validar que el usuario tenga rol de administrador
     */
    private boolean esAdministrador(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        
        UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
        String rol = usuarioPrincipal.getUsuario().getRol().name();
        return rol != null && 
               (rol.equals("ADMINISTRADOR") || 
                rol.equals("SUPER_ADMIN"));
    }

    /**
     * Crear una nueva planilla de devolución
     */
    @PostMapping
    public ResponseEntity<?> crearPlanillaDevolucion(@RequestBody PlanillaDevolucionDTO dto) {
        try {
            // Obtener empresaId y usuarioId del contexto de seguridad
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(Map.of("error", "No autorizado"));
            }

            // Validar rol de administrador
            if (!esAdministrador(authentication)) {
                return ResponseEntity.status(403).body(Map.of(
                    "error", "Usuario no autorizado. Verifique que esté logueado con un rol de administrador."
                ));
            }

            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long empresaId = usuarioPrincipal.getEmpresaId();
            Long usuarioId = usuarioPrincipal.getId();

            if (empresaId == null) {
                return ResponseEntity.status(400).body(Map.of("error", "ID de empresa no válido"));
            }
            
            PlanillaDevolucion planilla = planillaDevolucionService.crearPlanillaDevolucion(dto, empresaId, usuarioId);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Planilla de devolución creada exitosamente",
                "planilla", planilla
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Error al crear la planilla de devolución: " + e.getMessage()
            ));
        }
    }

    /**
     * Obtener todas las planillas de devolución de la empresa del usuario autenticado
     */
    @GetMapping
    public ResponseEntity<?> obtenerPlanillasDevolucion() {
        try {
            // Obtener empresaId del contexto de seguridad
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(Map.of("error", "No autorizado"));
            }

            // Validar rol de administrador
            if (!esAdministrador(authentication)) {
                return ResponseEntity.status(403).body(Map.of(
                    "error", "Usuario no autorizado. Verifique que esté logueado con un rol de administrador."
                ));
            }

            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long empresaId = usuarioPrincipal.getEmpresaId();

            if (empresaId == null) {
                return ResponseEntity.status(400).body(Map.of("error", "ID de empresa no válido"));
            }

            List<PlanillaDevolucionResponseDTO> planillas = planillaDevolucionService.obtenerPlanillasDevolucionPorEmpresa(empresaId);
            
            return ResponseEntity.ok(planillas);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Error al obtener las planillas de devolución: " + e.getMessage()
            ));
        }
    }

    /**
     * Obtener una planilla de devolución por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> obtenerPlanillaDevolucionPorId(@PathVariable Long id) {
        try {
            // Validar rol de administrador
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(Map.of("error", "No autorizado"));
            }

            if (!esAdministrador(authentication)) {
                return ResponseEntity.status(403).body(Map.of(
                    "error", "Usuario no autorizado. Verifique que esté logueado con un rol de administrador."
                ));
            }

            Optional<PlanillaDevolucion> planilla = planillaDevolucionService.obtenerPlanillaDevolucionPorId(id);
            
            if (planilla.isPresent()) {
                return ResponseEntity.ok(Map.of(
                    "mensaje", "Planilla de devolución obtenida exitosamente",
                    "planilla", planilla.get()
                ));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Error al obtener la planilla de devolución: " + e.getMessage()
            ));
        }
    }

    /**
     * Eliminar una planilla de devolución
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarPlanillaDevolucion(@PathVariable Long id) {
        try {
            // Validar rol de administrador
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(Map.of("error", "No autorizado"));
            }

            if (!esAdministrador(authentication)) {
                return ResponseEntity.status(403).body(Map.of(
                    "error", "Usuario no autorizado. Verifique que esté logueado con un rol de administrador."
                ));
            }

            planillaDevolucionService.eliminarPlanillaDevolucion(id);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Planilla de devolución eliminada exitosamente"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Error al eliminar la planilla de devolución: " + e.getMessage()
            ));
        }
    }
}
