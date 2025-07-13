package com.minegocio.backend.controladores;

import com.minegocio.backend.entidades.Notificacion;
import com.minegocio.backend.servicios.NotificacionService;
import com.minegocio.backend.utils.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notificaciones")
@CrossOrigin(origins = "*")
public class NotificacionController {
    
    @Autowired
    private NotificacionService notificacionService;
    
    // Obtener notificaciones paginadas
    @GetMapping("/empresa/{empresaId}")
    public ResponseEntity<ApiResponse<Page<Notificacion>>> obtenerNotificaciones(
            @PathVariable Long empresaId,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "10") int tamano) {
        try {
            Page<Notificacion> notificaciones = notificacionService.obtenerNotificaciones(empresaId, pagina, tamano);
            return ResponseEntity.ok(new ApiResponse<>(true, "Notificaciones obtenidas exitosamente", notificaciones));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Error al obtener notificaciones: " + e.getMessage(), null));
        }
    }
    
    // Obtener notificaciones recientes (últimas 24 horas)
    @GetMapping("/empresa/{empresaId}/recientes")
    public ResponseEntity<ApiResponse<List<Notificacion>>> obtenerNotificacionesRecientes(@PathVariable Long empresaId) {
        try {
            List<Notificacion> notificaciones = notificacionService.obtenerNotificacionesRecientes(empresaId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Notificaciones recientes obtenidas exitosamente", notificaciones));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Error al obtener notificaciones recientes: " + e.getMessage(), null));
        }
    }
    
    // Obtener notificaciones no leídas
    @GetMapping("/empresa/{empresaId}/no-leidas")
    public ResponseEntity<ApiResponse<List<Notificacion>>> obtenerNotificacionesNoLeidas(@PathVariable Long empresaId) {
        try {
            List<Notificacion> notificaciones = notificacionService.obtenerNotificacionesNoLeidas(empresaId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Notificaciones no leídas obtenidas exitosamente", notificaciones));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Error al obtener notificaciones no leídas: " + e.getMessage(), null));
        }
    }
    
    // Contar notificaciones no leídas
    @GetMapping("/empresa/{empresaId}/contar-no-leidas")
    public ResponseEntity<ApiResponse<Long>> contarNotificacionesNoLeidas(@PathVariable Long empresaId) {
        try {
            long cantidad = notificacionService.contarNotificacionesNoLeidas(empresaId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Cantidad de notificaciones no leídas obtenida exitosamente", cantidad));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Error al contar notificaciones no leídas: " + e.getMessage(), null));
        }
    }
    
    // Marcar notificación como leída
    @PutMapping("/{notificacionId}/marcar-leida")
    public ResponseEntity<ApiResponse<Void>> marcarComoLeida(@PathVariable Long notificacionId) {
        try {
            notificacionService.marcarComoLeida(notificacionId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Notificación marcada como leída exitosamente", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Error al marcar notificación como leída: " + e.getMessage(), null));
        }
    }
    
    // Marcar todas las notificaciones como leídas
    @PutMapping("/empresa/{empresaId}/marcar-todas-leidas")
    public ResponseEntity<ApiResponse<Void>> marcarTodasComoLeidas(@PathVariable Long empresaId) {
        try {
            notificacionService.marcarTodasComoLeidas(empresaId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Todas las notificaciones marcadas como leídas exitosamente", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Error al marcar notificaciones como leídas: " + e.getMessage(), null));
        }
    }
    
    // Limpiar notificaciones antiguas
    @DeleteMapping("/empresa/{empresaId}/limpiar-antiguas")
    public ResponseEntity<ApiResponse<Map<String, Object>>> limpiarNotificacionesAntiguas(@PathVariable Long empresaId) {
        try {
            int cantidadEliminadas = notificacionService.limpiarNotificacionesAntiguas(empresaId);
            
            Map<String, Object> resultado = new HashMap<>();
            resultado.put("cantidadEliminadas", cantidadEliminadas);
            resultado.put("mensaje", cantidadEliminadas > 0 ? 
                cantidadEliminadas + " notificación" + (cantidadEliminadas > 1 ? "es" : "") + " antigua" + (cantidadEliminadas > 1 ? "s" : "") + " eliminada" + (cantidadEliminadas > 1 ? "s" : "") + " exitosamente" :
                "No se encontraron notificaciones antiguas para eliminar");
            
            return ResponseEntity.ok(new ApiResponse<>(true, resultado.get("mensaje").toString(), resultado));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Error al limpiar notificaciones antiguas: " + e.getMessage(), null));
        }
    }
    
    // Eliminar una notificación específica
    @DeleteMapping("/{notificacionId}")
    public ResponseEntity<ApiResponse<Void>> eliminarNotificacion(@PathVariable Long notificacionId, @RequestParam Long empresaId) {
        try {
            notificacionService.eliminarNotificacion(notificacionId, empresaId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Notificación eliminada exitosamente", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Error al eliminar notificación: " + e.getMessage(), null));
        }
    }
    
    // Eliminar múltiples notificaciones
    @DeleteMapping("/empresa/{empresaId}/eliminar-multiples")
    public ResponseEntity<ApiResponse<Void>> eliminarNotificaciones(@PathVariable Long empresaId, @RequestBody List<Long> notificacionIds) {
        try {
            notificacionService.eliminarNotificaciones(empresaId, notificacionIds);
            return ResponseEntity.ok(new ApiResponse<>(true, "Notificaciones eliminadas exitosamente", null));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(false, "Error al eliminar notificaciones: " + e.getMessage(), null));
        }
    }
} 