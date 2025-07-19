package com.minegocio.backend.controladores;

import com.minegocio.backend.dto.*;
import com.minegocio.backend.servicios.SuperAdminService;
import com.minegocio.backend.utils.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Controlador para el panel de super administrador
 */
@RestController
@RequestMapping("/api/super-admin")
@CrossOrigin(origins = "*")
// @PreAuthorize("hasRole('SUPER_ADMIN')") // Comentado temporalmente para pruebas
public class SuperAdminController {

    @Autowired
    private SuperAdminService superAdminService;

    /**
     * Endpoint de prueba para verificar autenticación
     */
    @GetMapping("/test-auth")
    public ResponseEntity<?> testAuth() {
        try {
            return ResponseEntity.ok(Map.of(
                "mensaje", "Autenticación exitosa para Super Admin",
                "timestamp", System.currentTimeMillis(),
                "endpoint", "/api/super-admin/test-auth"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Endpoint de prueba simple para verificar acceso
     */
    @GetMapping("/ping")
    public ResponseEntity<?> ping() {
        try {
            return ResponseEntity.ok(Map.of(
                "mensaje", "Super Admin endpoint funcionando",
                "timestamp", System.currentTimeMillis(),
                "status", "OK"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Obtiene el dashboard principal
     */
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<DashboardSuperAdminDTO>> obtenerDashboard() {
        try {
            DashboardSuperAdminDTO dashboard = superAdminService.obtenerDashboard();
            return ResponseEntity.ok(ApiResponse.success("Dashboard obtenido exitosamente", dashboard));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Error al obtener dashboard: " + e.getMessage()));
        }
    }

    /**
     * Obtiene lista paginada de empresas
     */
    @GetMapping("/empresas")
    public ResponseEntity<ApiResponse<Page<EmpresaDTO>>> obtenerEmpresas(
            @RequestParam(required = false) String filtro,
            @RequestParam(required = false) String estadoSuscripcion,
            @RequestParam(required = false) String plan,
            @RequestParam(required = false) String fechaDesde,
            @RequestParam(required = false) String fechaHasta,
            Pageable pageable) {
        try {
            LocalDateTime desde = fechaDesde != null ? LocalDateTime.parse(fechaDesde) : null;
            LocalDateTime hasta = fechaHasta != null ? LocalDateTime.parse(fechaHasta) : null;
            
            Page<EmpresaDTO> empresas = superAdminService.obtenerEmpresas(
                filtro, estadoSuscripcion, plan, desde, hasta, pageable);
            return ResponseEntity.ok(ApiResponse.success("Empresas obtenidas exitosamente", empresas));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Error al obtener empresas: " + e.getMessage()));
        }
    }

    /**
     * Obtiene detalles de una empresa específica
     */
    @GetMapping("/empresas/{id}")
    public ResponseEntity<ApiResponse<EmpresaDTO>> obtenerEmpresa(@PathVariable Long id) {
        try {
            EmpresaDTO empresa = superAdminService.obtenerEmpresa(id);
            return ResponseEntity.ok(ApiResponse.success("Empresa obtenida exitosamente", empresa));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Error al obtener empresa: " + e.getMessage()));
        }
    }

    /**
     * Actualiza el estado de una empresa
     */
    @PutMapping("/empresas/{id}/estado")
    public ResponseEntity<ApiResponse<EmpresaDTO>> actualizarEstadoEmpresa(
            @PathVariable Long id, @RequestParam String estado) {
        try {
            EmpresaDTO empresa = superAdminService.actualizarEstadoEmpresa(id, estado);
            return ResponseEntity.ok(ApiResponse.success("Estado de empresa actualizado exitosamente", empresa));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Error al actualizar estado: " + e.getMessage()));
        }
    }

    /**
     * Obtiene estadísticas de suscripciones
     */
    @GetMapping("/suscripciones/estadisticas")
    public ResponseEntity<ApiResponse<Object>> obtenerEstadisticasSuscripciones() {
        try {
            Object estadisticas = superAdminService.obtenerEstadisticasSuscripciones();
            return ResponseEntity.ok(ApiResponse.success("Estadísticas obtenidas exitosamente", estadisticas));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Error al obtener estadísticas: " + e.getMessage()));
        }
    }

    /**
     * Obtiene empresas por expirar
     */
    @GetMapping("/empresas/por-expirar")
    public ResponseEntity<ApiResponse<List<EmpresaTopDTO>>> obtenerEmpresasPorExpirar() {
        try {
            List<EmpresaTopDTO> empresas = superAdminService.obtenerEmpresasPorExpirar();
            return ResponseEntity.ok(ApiResponse.success("Empresas por expirar obtenidas exitosamente", empresas));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Error al obtener empresas por expirar: " + e.getMessage()));
        }
    }

    /**
     * Obtiene top empresas por ingresos
     */
    @GetMapping("/empresas/top-ingresos")
    public ResponseEntity<ApiResponse<List<EmpresaTopDTO>>> obtenerTopEmpresasPorIngresos(
            @RequestParam(defaultValue = "10") int limite) {
        try {
            List<EmpresaTopDTO> empresas = superAdminService.obtenerTopEmpresasPorIngresos(limite);
            return ResponseEntity.ok(ApiResponse.success("Top empresas obtenidas exitosamente", empresas));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Error al obtener top empresas: " + e.getMessage()));
        }
    }

    /**
     * Obtiene empresas en riesgo
     */
    @GetMapping("/empresas/en-riesgo")
    public ResponseEntity<ApiResponse<List<EmpresaTopDTO>>> obtenerEmpresasEnRiesgo() {
        try {
            List<EmpresaTopDTO> empresas = superAdminService.obtenerEmpresasEnRiesgo();
            return ResponseEntity.ok(ApiResponse.success("Empresas en riesgo obtenidas exitosamente", empresas));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Error al obtener empresas en riesgo: " + e.getMessage()));
        }
    }

    /**
     * Obtiene alertas del sistema
     */
    @GetMapping("/alertas")
    public ResponseEntity<ApiResponse<List<AlertaSuperAdminDTO>>> obtenerAlertas(
            @RequestParam(defaultValue = "false") Boolean soloNoLeidas) {
        try {
            List<AlertaSuperAdminDTO> alertas = superAdminService.obtenerAlertas(soloNoLeidas);
            return ResponseEntity.ok(ApiResponse.success("Alertas obtenidas exitosamente", alertas));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Error al obtener alertas: " + e.getMessage()));
        }
    }

    /**
     * Marca una alerta como leída
     */
    @PutMapping("/alertas/{id}/leer")
    public ResponseEntity<ApiResponse<Void>> marcarAlertaComoLeida(@PathVariable Long id) {
        try {
            superAdminService.marcarAlertaComoLeida(id);
            return ResponseEntity.ok(ApiResponse.success("Alerta marcada como leída exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Error al marcar alerta: " + e.getMessage()));
        }
    }

    /**
     * Obtiene notificaciones del sistema
     */
    @GetMapping("/notificaciones")
    public ResponseEntity<ApiResponse<List<NotificacionSuperAdminDTO>>> obtenerNotificaciones(
            @RequestParam(defaultValue = "false") Boolean soloNoLeidas) {
        try {
            List<NotificacionSuperAdminDTO> notificaciones = superAdminService.obtenerNotificaciones(soloNoLeidas);
            return ResponseEntity.ok(ApiResponse.success("Notificaciones obtenidas exitosamente", notificaciones));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Error al obtener notificaciones: " + e.getMessage()));
        }
    }

    /**
     * Marca una notificación como leída
     */
    @PutMapping("/notificaciones/{id}/leer")
    public ResponseEntity<ApiResponse<Void>> marcarNotificacionComoLeida(@PathVariable Long id) {
        try {
            superAdminService.marcarNotificacionComoLeida(id);
            return ResponseEntity.ok(ApiResponse.success("Notificación marcada como leída exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Error al marcar notificación: " + e.getMessage()));
        }
    }

    /**
     * Obtiene reporte de ingresos
     */
    @GetMapping("/reportes/ingresos")
    public ResponseEntity<ApiResponse<Object>> obtenerReporteIngresos(
            @RequestParam String fechaDesde, @RequestParam String fechaHasta) {
        try {
            LocalDateTime desde = LocalDateTime.parse(fechaDesde);
            LocalDateTime hasta = LocalDateTime.parse(fechaHasta);
            
            Object reporte = superAdminService.obtenerReporteIngresos(desde, hasta);
            return ResponseEntity.ok(ApiResponse.success("Reporte de ingresos obtenido exitosamente", reporte));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Error al obtener reporte: " + e.getMessage()));
        }
    }

    /**
     * Obtiene reporte de crecimiento
     */
    @GetMapping("/reportes/crecimiento")
    public ResponseEntity<ApiResponse<Object>> obtenerReporteCrecimiento(
            @RequestParam(defaultValue = "12") int meses) {
        try {
            Object reporte = superAdminService.obtenerReporteCrecimiento(meses);
            return ResponseEntity.ok(ApiResponse.success("Reporte de crecimiento obtenido exitosamente", reporte));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Error al obtener reporte: " + e.getMessage()));
        }
    }

    /**
     * Envía notificación a una empresa
     */
    @PostMapping("/empresas/{id}/notificar")
    public ResponseEntity<ApiResponse<Void>> enviarNotificacionEmpresa(
            @PathVariable Long id, @RequestBody NotificacionSuperAdminDTO notificacion) {
        try {
            superAdminService.enviarNotificacionEmpresa(id, notificacion);
            return ResponseEntity.ok(ApiResponse.success("Notificación enviada exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Error al enviar notificación: " + e.getMessage()));
        }
    }

    /**
     * Obtiene logs del sistema
     */
    @GetMapping("/logs")
    public ResponseEntity<ApiResponse<Object>> obtenerLogs(
            @RequestParam(required = false) String nivel,
            @RequestParam(required = false) String empresa,
            @RequestParam(required = false) String fechaDesde,
            @RequestParam(required = false) String fechaHasta,
            Pageable pageable) {
        try {
            LocalDateTime desde = fechaDesde != null ? LocalDateTime.parse(fechaDesde) : null;
            LocalDateTime hasta = fechaHasta != null ? LocalDateTime.parse(fechaHasta) : null;
            
            Object logs = superAdminService.obtenerLogs(nivel, empresa, desde, hasta, pageable);
            return ResponseEntity.ok(ApiResponse.success("Logs obtenidos exitosamente", logs));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Error al obtener logs: " + e.getMessage()));
        }
    }
} 