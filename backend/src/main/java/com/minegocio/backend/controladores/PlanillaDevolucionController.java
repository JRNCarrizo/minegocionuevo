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
            // Verificar si es un error de violación de restricción de unicidad
            String errorMessage = e.getMessage();
            if (errorMessage != null && errorMessage.contains("NUMERO_PLANILLA") && errorMessage.contains("Unique index")) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "El número de planilla ya existe. Por favor, use un número diferente."
                ));
            }
            
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

    /**
     * Exportar planilla de devolución a Excel
     */
    @GetMapping("/{id}/exportar")
    public ResponseEntity<byte[]> exportarPlanilla(@PathVariable Long id, Authentication authentication) {
        try {
            System.out.println("📊 [EXPORTAR DEVOLUCION] Iniciando exportación de planilla ID: " + id);
            
            if (authentication == null || !authentication.isAuthenticated()) {
                System.out.println("❌ [EXPORTAR DEVOLUCION] Authentication: Ausente");
                return ResponseEntity.status(401).build();
            }
            
            System.out.println("✅ [EXPORTAR DEVOLUCION] Authentication: Presente");
            
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long empresaId = usuarioPrincipal.getEmpresaId();
            
            System.out.println("👤 [EXPORTAR DEVOLUCION] Usuario: " + usuarioPrincipal.getUsername());
            System.out.println("🏢 [EXPORTAR DEVOLUCION] Empresa ID: " + empresaId);
            System.out.println("🔐 [EXPORTAR DEVOLUCION] Roles: " + usuarioPrincipal.getAuthorities());
            
            byte[] excelBytes = planillaDevolucionService.exportarPlanillaAExcel(id, empresaId);
            
            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=\"planilla-devolucion-" + id + ".xlsx\"")
                    .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                    .body(excelBytes);
                    
        } catch (Exception e) {
            System.out.println("❌ [EXPORTAR DEVOLUCION] Error al exportar planilla: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }
}
