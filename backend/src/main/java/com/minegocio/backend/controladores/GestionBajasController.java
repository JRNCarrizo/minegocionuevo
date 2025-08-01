package com.minegocio.backend.controladores;

import com.minegocio.backend.dto.BajaCuentaDTO;
import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.servicios.GestionBajasService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;

/**
 * Controlador para la gestión de bajas de cuentas
 */
@RestController
@RequestMapping("/api/admin/bajas")
@CrossOrigin(origins = "*", maxAge = 3600)
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMINISTRADOR')")
public class GestionBajasController {

    @Autowired
    private GestionBajasService gestionBajasService;

    /**
     * Da de baja una empresa
     */
    @PostMapping("/dar-baja/{empresaId}")
    public ResponseEntity<?> darDeBajaEmpresa(
            @PathVariable Long empresaId,
            @Valid @RequestBody BajaCuentaDTO bajaDTO,
            @RequestParam String adminEmail) {
        
        try {
            boolean resultado = gestionBajasService.darDeBajaEmpresa(empresaId, bajaDTO, adminEmail);
            
            if (resultado) {
                return ResponseEntity.ok(Map.of(
                    "exito", true,
                    "mensaje", "Empresa dada de baja exitosamente"
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                    "exito", false,
                    "mensaje", "No se pudo dar de baja la empresa"
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "exito", false,
                "mensaje", e.getMessage()
            ));
        }
    }

    /**
     * Reactiva una empresa dada de baja
     */
    @PostMapping("/reactivar/{empresaId}")
    public ResponseEntity<?> reactivarEmpresa(
            @PathVariable Long empresaId,
            @RequestParam String adminEmail) {
        
        try {
            boolean resultado = gestionBajasService.reactivarEmpresa(empresaId, adminEmail);
            
            if (resultado) {
                return ResponseEntity.ok(Map.of(
                    "exito", true,
                    "mensaje", "Empresa reactivada exitosamente"
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                    "exito", false,
                    "mensaje", "No se pudo reactivar la empresa"
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "exito", false,
                "mensaje", e.getMessage()
            ));
        }
    }

    /**
     * Obtiene el historial de empresas dadas de baja
     */
    @GetMapping("/historial")
    public ResponseEntity<?> obtenerHistorialBajas() {
        try {
            List<Empresa> empresasDadasDeBaja = gestionBajasService.obtenerEmpresasDadasDeBaja();
            
            return ResponseEntity.ok(Map.of(
                "exito", true,
                "empresas", empresasDadasDeBaja
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "exito", false,
                "mensaje", "Error al obtener el historial de bajas: " + e.getMessage()
            ));
        }
    }

    /**
     * Obtiene estadísticas de bajas
     */
    @GetMapping("/estadisticas")
    public ResponseEntity<?> obtenerEstadisticasBajas() {
        try {
            Object estadisticas = gestionBajasService.obtenerEstadisticasBajas();
            
            return ResponseEntity.ok(Map.of(
                "exito", true,
                "estadisticas", estadisticas
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "exito", false,
                "mensaje", "Error al obtener estadísticas: " + e.getMessage()
            ));
        }
    }

    /**
     * Obtiene información detallada de una empresa dada de baja
     */
    @GetMapping("/empresa/{empresaId}")
    public ResponseEntity<?> obtenerDetalleEmpresaBaja(@PathVariable Long empresaId) {
        try {
            List<Empresa> empresas = gestionBajasService.obtenerEmpresasDadasDeBaja();
            Empresa empresa = empresas.stream()
                .filter(e -> e.getId().equals(empresaId))
                .findFirst()
                .orElse(null);
            
            if (empresa != null) {
                return ResponseEntity.ok(Map.of(
                    "exito", true,
                    "empresa", empresa
                ));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "exito", false,
                "mensaje", "Error al obtener detalles de la empresa: " + e.getMessage()
            ));
        }
    }
} 