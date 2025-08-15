package com.minegocio.backend.controladores;

import com.minegocio.backend.dto.DetallePlanillaPedidoDTO;
import com.minegocio.backend.dto.PlanillaPedidoDTO;
import com.minegocio.backend.entidades.DetallePlanillaPedido;
import com.minegocio.backend.entidades.PlanillaPedido;
import com.minegocio.backend.seguridad.UsuarioPrincipal;
import com.minegocio.backend.servicios.PlanillaPedidoService;
import com.minegocio.backend.utils.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/planillas-pedidos")
@CrossOrigin(origins = "*")
public class PlanillaPedidoController {

    @Autowired
    private PlanillaPedidoService planillaPedidoService;

    /**
     * Crear una nueva planilla de pedido
     */
    @PostMapping
    public ResponseEntity<ApiResponse<PlanillaPedido>> crearPlanillaPedido(
            @Valid @RequestBody PlanillaPedidoDTO dto,
            Authentication authentication) {
        
        try {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long empresaId = usuarioPrincipal.getEmpresaId();
            Long usuarioId = usuarioPrincipal.getId();

            PlanillaPedido planilla = planillaPedidoService.crearPlanillaPedido(dto, empresaId, usuarioId);
            
            return ResponseEntity.ok(ApiResponse.success("Planilla de pedido creada exitosamente", planilla));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Error al crear la planilla de pedido: " + e.getMessage()));
        }
    }

    /**
     * Obtener todas las planillas de la empresa del usuario autenticado
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PlanillaPedido>>> obtenerPlanillas(Authentication authentication) {
        try {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long empresaId = usuarioPrincipal.getEmpresaId();

            List<PlanillaPedido> planillas = planillaPedidoService.obtenerPlanillasPorEmpresa(empresaId);
            
            return ResponseEntity.ok(ApiResponse.success("Planillas obtenidas exitosamente", planillas));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Error al obtener las planillas: " + e.getMessage()));
        }
    }

    /**
     * Obtener planillas por fecha
     */
    @GetMapping("/fecha/{fecha}")
    public ResponseEntity<ApiResponse<List<PlanillaPedido>>> obtenerPlanillasPorFecha(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            Authentication authentication) {
        
        try {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long empresaId = usuarioPrincipal.getEmpresaId();

            List<PlanillaPedido> planillas = planillaPedidoService.obtenerPlanillasPorEmpresaYFecha(empresaId, fecha);
            
            return ResponseEntity.ok(ApiResponse.success("Planillas obtenidas exitosamente", planillas));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Error al obtener las planillas: " + e.getMessage()));
        }
    }

    /**
     * Obtener planillas por rango de fechas
     */
    @GetMapping("/rango-fechas")
    public ResponseEntity<ApiResponse<List<PlanillaPedido>>> obtenerPlanillasPorRangoFechas(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin,
            Authentication authentication) {
        
        try {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long empresaId = usuarioPrincipal.getEmpresaId();

            List<PlanillaPedido> planillas = planillaPedidoService.obtenerPlanillasPorEmpresaYRangoFechas(empresaId, fechaInicio, fechaFin);
            
            return ResponseEntity.ok(ApiResponse.success("Planillas obtenidas exitosamente", planillas));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Error al obtener las planillas: " + e.getMessage()));
        }
    }

    /**
     * Obtener planilla por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PlanillaPedido>> obtenerPlanillaPorId(@PathVariable Long id) {
        try {
            Optional<PlanillaPedido> planilla = planillaPedidoService.obtenerPlanillaPorId(id);
            
            if (planilla.isPresent()) {
                return ResponseEntity.ok(ApiResponse.success("Planilla obtenida exitosamente", planilla.get()));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Error al obtener la planilla: " + e.getMessage()));
        }
    }

    /**
     * Obtener planilla por número de planilla
     */
    @GetMapping("/numero/{numeroPlanilla}")
    public ResponseEntity<ApiResponse<PlanillaPedido>> obtenerPlanillaPorNumero(@PathVariable String numeroPlanilla) {
        try {
            Optional<PlanillaPedido> planilla = planillaPedidoService.obtenerPlanillaPorNumero(numeroPlanilla);
            
            if (planilla.isPresent()) {
                return ResponseEntity.ok(ApiResponse.success("Planilla obtenida exitosamente", planilla.get()));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Error al obtener la planilla: " + e.getMessage()));
        }
    }

    /**
     * Actualizar planilla de pedido
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PlanillaPedido>> actualizarPlanillaPedido(
            @PathVariable Long id,
            @Valid @RequestBody PlanillaPedidoDTO dto) {
        
        try {
            PlanillaPedido planilla = planillaPedidoService.actualizarPlanillaPedido(id, dto);
            
            return ResponseEntity.ok(ApiResponse.success("Planilla actualizada exitosamente", planilla));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Error al actualizar la planilla: " + e.getMessage()));
        }
    }

    /**
     * Eliminar planilla de pedido
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> eliminarPlanillaPedido(@PathVariable Long id) {
        try {
            planillaPedidoService.eliminarPlanillaPedido(id);
            
            return ResponseEntity.ok(ApiResponse.success("Planilla eliminada exitosamente", "Planilla eliminada"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Error al eliminar la planilla: " + e.getMessage()));
        }
    }

    /**
     * Agregar detalle a una planilla
     */
    @PostMapping("/{planillaId}/detalles")
    public ResponseEntity<ApiResponse<DetallePlanillaPedido>> agregarDetalle(
            @PathVariable Long planillaId,
            @Valid @RequestBody DetallePlanillaPedidoDTO dto) {
        
        try {
            DetallePlanillaPedido detalle = planillaPedidoService.agregarDetalle(planillaId, dto);
            
            return ResponseEntity.ok(ApiResponse.success("Detalle agregado exitosamente", detalle));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Error al agregar el detalle: " + e.getMessage()));
        }
    }

    /**
     * Obtener detalles de una planilla
     */
    @GetMapping("/{planillaId}/detalles")
    public ResponseEntity<ApiResponse<List<DetallePlanillaPedido>>> obtenerDetalles(@PathVariable Long planillaId) {
        try {
            List<DetallePlanillaPedido> detalles = planillaPedidoService.obtenerDetallesPorPlanilla(planillaId);
            
            return ResponseEntity.ok(ApiResponse.success("Detalles obtenidos exitosamente", detalles));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Error al obtener los detalles: " + e.getMessage()));
        }
    }

    /**
     * Eliminar detalle de una planilla
     */
    @DeleteMapping("/detalles/{detalleId}")
    public ResponseEntity<ApiResponse<String>> eliminarDetalle(@PathVariable Long detalleId) {
        try {
            planillaPedidoService.eliminarDetalle(detalleId);
            
            return ResponseEntity.ok(ApiResponse.success("Detalle eliminado exitosamente", "Detalle eliminado"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Error al eliminar el detalle: " + e.getMessage()));
        }
    }

    /**
     * Obtener estadísticas de planillas
     */
    @GetMapping("/estadisticas")
    public ResponseEntity<ApiResponse<Map<String, Object>>> obtenerEstadisticas(Authentication authentication) {
        try {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long empresaId = usuarioPrincipal.getEmpresaId();

            long totalPlanillas = planillaPedidoService.contarPlanillasPorEmpresa(empresaId);
            long planillasHoy = planillaPedidoService.contarPlanillasPorEmpresaYFecha(empresaId, LocalDate.now());

            Map<String, Object> estadisticas = new HashMap<>();
            estadisticas.put("totalPlanillas", totalPlanillas);
            estadisticas.put("planillasHoy", planillasHoy);

            return ResponseEntity.ok(ApiResponse.success("Estadísticas obtenidas exitosamente", estadisticas));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Error al obtener las estadísticas: " + e.getMessage()));
        }
    }
}
