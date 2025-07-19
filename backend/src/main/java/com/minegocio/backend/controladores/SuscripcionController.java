package com.minegocio.backend.controladores;

import com.minegocio.backend.dto.PlanDTO;
import com.minegocio.backend.dto.SuscripcionDTO;
import com.minegocio.backend.entidades.Suscripcion;
import com.minegocio.backend.servicios.SuscripcionService;
import com.minegocio.backend.utils.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Controlador para la gestión de suscripciones
 */
@RestController
@RequestMapping("/api/super-admin/suscripciones")
@CrossOrigin(origins = "*")
public class SuscripcionController {

    @Autowired
    private SuscripcionService suscripcionService;

    // ===== GESTIÓN DE PLANES =====

    /**
     * Obtiene todos los planes activos
     */
    @GetMapping("/planes")
    public ResponseEntity<ApiResponse<List<PlanDTO>>> obtenerPlanes() {
        try {
            List<PlanDTO> planes = suscripcionService.obtenerPlanesActivos();
            return ResponseEntity.ok(new ApiResponse<>(true, "Planes obtenidos correctamente", planes));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Error al obtener planes: " + e.getMessage(), null));
        }
    }

    /**
     * Obtiene un plan por ID
     */
    @GetMapping("/planes/{id}")
    public ResponseEntity<ApiResponse<PlanDTO>> obtenerPlan(@PathVariable Long id) {
        try {
            return suscripcionService.obtenerPlan(id)
                    .map(plan -> ResponseEntity.ok(new ApiResponse<>(true, "Plan obtenido correctamente", plan)))
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Error al obtener plan: " + e.getMessage(), null));
        }
    }

    /**
     * Crea un nuevo plan
     */
    @PostMapping("/planes")
    public ResponseEntity<ApiResponse<PlanDTO>> crearPlan(@RequestBody PlanDTO planDTO) {
        try {
            PlanDTO planCreado = suscripcionService.crearPlan(planDTO);
            return ResponseEntity.ok(new ApiResponse<>(true, "Plan creado correctamente", planCreado));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Error al crear plan: " + e.getMessage(), null));
        }
    }

    /**
     * Actualiza un plan existente
     */
    @PutMapping("/planes/{id}")
    public ResponseEntity<ApiResponse<PlanDTO>> actualizarPlan(@PathVariable Long id, @RequestBody PlanDTO planDTO) {
        try {
            PlanDTO planActualizado = suscripcionService.actualizarPlan(id, planDTO);
            return ResponseEntity.ok(new ApiResponse<>(true, "Plan actualizado correctamente", planActualizado));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Error al actualizar plan: " + e.getMessage(), null));
        }
    }

    /**
     * Elimina un plan (desactiva)
     */
    @DeleteMapping("/planes/{id}")
    public ResponseEntity<ApiResponse<Void>> eliminarPlan(@PathVariable Long id) {
        try {
            suscripcionService.eliminarPlan(id);
            return ResponseEntity.ok(new ApiResponse<>(true, "Plan eliminado correctamente", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Error al eliminar plan: " + e.getMessage(), null));
        }
    }

    // ===== GESTIÓN DE SUSCRIPCIONES =====

    /**
     * Obtiene suscripciones con filtros
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<SuscripcionDTO>>> obtenerSuscripciones(
            @RequestParam(required = false) Long empresaId,
            @RequestParam(required = false) Long planId,
            @RequestParam(required = false) Suscripcion.EstadoSuscripcion estado,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaInicio,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaFin,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            Pageable pageable = PageRequest.of(page, size);
            Page<SuscripcionDTO> suscripciones = suscripcionService.obtenerSuscripciones(
                    empresaId, planId, estado, fechaInicio, fechaFin, pageable);
            return ResponseEntity.ok(new ApiResponse<>(true, "Suscripciones obtenidas correctamente", suscripciones));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Error al obtener suscripciones: " + e.getMessage(), null));
        }
    }

    /**
     * Obtiene una suscripción por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SuscripcionDTO>> obtenerSuscripcion(@PathVariable Long id) {
        try {
            return suscripcionService.obtenerSuscripcion(id)
                    .map(suscripcion -> ResponseEntity.ok(new ApiResponse<>(true, "Suscripción obtenida correctamente", suscripcion)))
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Error al obtener suscripción: " + e.getMessage(), null));
        }
    }

    /**
     * Obtiene la suscripción activa de una empresa
     */
    @GetMapping("/empresa/{empresaId}/activa")
    public ResponseEntity<ApiResponse<SuscripcionDTO>> obtenerSuscripcionActiva(@PathVariable Long empresaId) {
        try {
            return suscripcionService.obtenerSuscripcionActiva(empresaId)
                    .map(suscripcion -> ResponseEntity.ok(new ApiResponse<>(true, "Suscripción activa obtenida correctamente", suscripcion)))
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Error al obtener suscripción activa: " + e.getMessage(), null));
        }
    }

    /**
     * Crea una nueva suscripción
     */
    @PostMapping
    public ResponseEntity<ApiResponse<SuscripcionDTO>> crearSuscripcion(@RequestBody Map<String, Object> request) {
        try {
            Long empresaId = Long.valueOf(request.get("empresaId").toString());
            Long planId = Long.valueOf(request.get("planId").toString());
            String metodoPago = (String) request.get("metodoPago");
            String referenciaPago = (String) request.get("referenciaPago");

            SuscripcionDTO suscripcion = suscripcionService.crearSuscripcion(empresaId, planId, metodoPago, referenciaPago);
            return ResponseEntity.ok(new ApiResponse<>(true, "Suscripción creada correctamente", suscripcion));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Error al crear suscripción: " + e.getMessage(), null));
        }
    }

    /**
     * Cancela una suscripción
     */
    @PostMapping("/{id}/cancelar")
    public ResponseEntity<ApiResponse<SuscripcionDTO>> cancelarSuscripcion(
            @PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String motivo = request.get("motivo");
            SuscripcionDTO suscripcion = suscripcionService.cancelarSuscripcion(id, motivo);
            return ResponseEntity.ok(new ApiResponse<>(true, "Suscripción cancelada correctamente", suscripcion));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Error al cancelar suscripción: " + e.getMessage(), null));
        }
    }

    /**
     * Suspende una suscripción
     */
    @PostMapping("/{id}/suspender")
    public ResponseEntity<ApiResponse<SuscripcionDTO>> suspenderSuscripcion(@PathVariable Long id) {
        try {
            SuscripcionDTO suscripcion = suscripcionService.suspenderSuscripcion(id);
            return ResponseEntity.ok(new ApiResponse<>(true, "Suscripción suspendida correctamente", suscripcion));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Error al suspender suscripción: " + e.getMessage(), null));
        }
    }

    /**
     * Reactiva una suscripción
     */
    @PostMapping("/{id}/reactivar")
    public ResponseEntity<ApiResponse<SuscripcionDTO>> reactivarSuscripcion(@PathVariable Long id) {
        try {
            SuscripcionDTO suscripcion = suscripcionService.reactivarSuscripcion(id);
            return ResponseEntity.ok(new ApiResponse<>(true, "Suscripción reactivada correctamente", suscripcion));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Error al reactivar suscripción: " + e.getMessage(), null));
        }
    }

    /**
     * Renueva una suscripción
     */
    @PostMapping("/{id}/renovar")
    public ResponseEntity<ApiResponse<SuscripcionDTO>> renovarSuscripcion(@PathVariable Long id) {
        try {
            SuscripcionDTO suscripcion = suscripcionService.renovarSuscripcion(id);
            return ResponseEntity.ok(new ApiResponse<>(true, "Suscripción renovada correctamente", suscripcion));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Error al renovar suscripción: " + e.getMessage(), null));
        }
    }

    // ===== ESTADÍSTICAS Y REPORTES =====

    /**
     * Obtiene estadísticas de suscripciones
     */
    @GetMapping("/estadisticas-suscripciones")
    public ResponseEntity<ApiResponse<Map<String, Object>>> obtenerEstadisticas() {
        try {
            Map<String, Object> estadisticas = suscripcionService.obtenerEstadisticas();
            return ResponseEntity.ok(new ApiResponse<>(true, "Estadísticas obtenidas correctamente", estadisticas));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Error al obtener estadísticas: " + e.getMessage(), null));
        }
    }

    /**
     * Obtiene suscripciones por expirar
     */
    @GetMapping("/por-expirar")
    public ResponseEntity<ApiResponse<List<SuscripcionDTO>>> obtenerSuscripcionesPorExpirar() {
        try {
            List<SuscripcionDTO> suscripciones = suscripcionService.obtenerSuscripcionesPorExpirar();
            return ResponseEntity.ok(new ApiResponse<>(true, "Suscripciones por expirar obtenidas correctamente", suscripciones));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Error al obtener suscripciones por expirar: " + e.getMessage(), null));
        }
    }

    /**
     * Obtiene suscripciones expiradas
     */
    @GetMapping("/expiradas")
    public ResponseEntity<ApiResponse<List<SuscripcionDTO>>> obtenerSuscripcionesExpiradas() {
        try {
            List<SuscripcionDTO> suscripciones = suscripcionService.obtenerSuscripcionesExpiradas();
            return ResponseEntity.ok(new ApiResponse<>(true, "Suscripciones expiradas obtenidas correctamente", suscripciones));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Error al obtener suscripciones expiradas: " + e.getMessage(), null));
        }
    }

    /**
     * Procesa renovaciones automáticas
     */
    @PostMapping("/procesar-renovaciones")
    public ResponseEntity<ApiResponse<Void>> procesarRenovacionesAutomaticas() {
        try {
            suscripcionService.procesarRenovacionesAutomaticas();
            return ResponseEntity.ok(new ApiResponse<>(true, "Renovaciones automáticas procesadas correctamente", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Error al procesar renovaciones: " + e.getMessage(), null));
        }
    }
} 