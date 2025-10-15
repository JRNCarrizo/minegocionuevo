package com.minegocio.backend.controladores;

import com.minegocio.backend.dto.HistorialMovimientoStockResponseDTO;
import com.minegocio.backend.servicios.HistorialMovimientoStockService;
import com.minegocio.backend.seguridad.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/historial-movimientos")
@CrossOrigin(origins = "*")
public class HistorialMovimientoStockController {
    
    @Autowired
    private HistorialMovimientoStockService historialService;
    
    @Autowired
    private JwtUtils jwtUtil;
    
    /**
     * Obtener historial por empresa
     */
    @GetMapping("/empresa")
    public ResponseEntity<List<HistorialMovimientoStockResponseDTO>> obtenerHistorialPorEmpresa(
            @RequestHeader("Authorization") String token) {
        
        try {
            // Limpiar el token removiendo el prefijo "Bearer " si existe
            String cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;
            Long empresaId = jwtUtil.getEmpresaIdFromJwtToken(cleanToken);
            List<HistorialMovimientoStockResponseDTO> historial = historialService.obtenerHistorialPorEmpresa(empresaId);
            return ResponseEntity.ok(historial);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Obtener historial por sector
     */
    @GetMapping("/sector/{sectorId}")
    public ResponseEntity<List<HistorialMovimientoStockResponseDTO>> obtenerHistorialPorSector(
            @RequestHeader("Authorization") String token,
            @PathVariable Long sectorId) {
        
        try {
            // Limpiar el token removiendo el prefijo "Bearer " si existe
            String cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;
            Long empresaId = jwtUtil.getEmpresaIdFromJwtToken(cleanToken);
            System.out.println("🔍 HISTORIAL - EmpresaId: " + empresaId + ", SectorId: " + sectorId);
            
            List<HistorialMovimientoStockResponseDTO> historial = historialService.obtenerHistorialPorSector(empresaId, sectorId);
            System.out.println("🔍 HISTORIAL - Movimientos encontrados: " + historial.size());
            
            return ResponseEntity.ok(historial);
        } catch (Exception e) {
            System.err.println("🔍 HISTORIAL - Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(null);
        }
    }
    
    /**
     * Obtener historial por producto
     */
    @GetMapping("/producto/{productoId}")
    public ResponseEntity<List<HistorialMovimientoStockResponseDTO>> obtenerHistorialPorProducto(
            @RequestHeader("Authorization") String token,
            @PathVariable Long productoId) {
        
        try {
            // Limpiar el token removiendo el prefijo "Bearer " si existe
            String cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;
            Long empresaId = jwtUtil.getEmpresaIdFromJwtToken(cleanToken);
            List<HistorialMovimientoStockResponseDTO> historial = historialService.obtenerHistorialPorProducto(empresaId, productoId);
            return ResponseEntity.ok(historial);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Obtener movimientos del día actual
     */
    @GetMapping("/hoy")
    public ResponseEntity<List<HistorialMovimientoStockResponseDTO>> obtenerMovimientosDelDia(
            @RequestHeader("Authorization") String token) {
        
        try {
            // Limpiar el token removiendo el prefijo "Bearer " si existe
            String cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;
            Long empresaId = jwtUtil.getEmpresaIdFromJwtToken(cleanToken);
            List<HistorialMovimientoStockResponseDTO> movimientos = historialService.obtenerMovimientosDelDia(empresaId);
            return ResponseEntity.ok(movimientos);
        } catch (Exception e) {
            System.err.println("🔍 HISTORIAL GENERAL - Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(null);
        }
    }
    
    /**
     * Obtener movimientos por rango de fechas
     */
    @GetMapping("/rango-fechas")
    public ResponseEntity<List<HistorialMovimientoStockResponseDTO>> obtenerMovimientosPorRangoFechas(
            @RequestHeader("Authorization") String token,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin) {
        
        try {
            // Limpiar el token removiendo el prefijo "Bearer " si existe
            String cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;
            Long empresaId = jwtUtil.getEmpresaIdFromJwtToken(cleanToken);
            List<HistorialMovimientoStockResponseDTO> movimientos = historialService
                .obtenerMovimientosPorRangoFechas(empresaId, fechaInicio, fechaFin);
            return ResponseEntity.ok(movimientos);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Obtener resumen de movimientos por día
     */
    @GetMapping("/resumen-por-dia")
    public ResponseEntity<List<Map<String, Object>>> obtenerResumenMovimientosPorDia(
            @RequestHeader("Authorization") String token,
            @RequestParam(defaultValue = "30") int diasAtras) {
        
        try {
            // Limpiar el token removiendo el prefijo "Bearer " si existe
            String cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;
            Long empresaId = jwtUtil.getEmpresaIdFromJwtToken(cleanToken);
            List<Map<String, Object>> resumen = historialService.obtenerResumenMovimientosPorDia(empresaId, diasAtras);
            return ResponseEntity.ok(resumen);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Obtener estadísticas de movimientos
     */
    @GetMapping("/estadisticas")
    public ResponseEntity<Map<String, Object>> obtenerEstadisticasMovimientos(
            @RequestHeader("Authorization") String token,
            @RequestParam(defaultValue = "30") int diasAtras) {
        
        try {
            // Limpiar el token removiendo el prefijo "Bearer " si existe
            String cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;
            Long empresaId = jwtUtil.getEmpresaIdFromJwtToken(cleanToken);
            Map<String, Object> estadisticas = historialService.obtenerEstadisticasMovimientos(empresaId, diasAtras);
            return ResponseEntity.ok(estadisticas);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
