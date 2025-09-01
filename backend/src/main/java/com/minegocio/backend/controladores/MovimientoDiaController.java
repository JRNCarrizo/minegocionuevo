package com.minegocio.backend.controladores;

import com.minegocio.backend.dto.MovimientoDiaDTO;
import com.minegocio.backend.servicios.MovimientoDiaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

@RestController
@RequestMapping("/api/movimientos-dia")
@CrossOrigin(origins = "*")
public class MovimientoDiaController {
    
    @Autowired
    private MovimientoDiaService movimientoDiaService;
    
    /**
     * Obtener movimientos del día para una fecha específica
     */
    @GetMapping("/{fecha}")
    public ResponseEntity<MovimientoDiaDTO> obtenerMovimientosDia(@PathVariable String fecha) {
        try {
            System.out.println("🔍 [CONTROLLER] Obteniendo movimientos para fecha: " + fecha);
            MovimientoDiaDTO movimientos = movimientoDiaService.obtenerMovimientosDia(fecha);
            return ResponseEntity.ok(movimientos);
        } catch (Exception e) {
            System.err.println("❌ [CONTROLLER] Error al obtener movimientos: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Obtener movimientos acumulados por rango de fechas
     */
    @GetMapping("/rango")
    public ResponseEntity<MovimientoDiaDTO> obtenerMovimientosRango(
            @RequestParam String fechaInicio,
            @RequestParam String fechaFin) {
        try {
            System.out.println("🔍 [CONTROLLER] Obteniendo movimientos para rango: " + fechaInicio + " a " + fechaFin);
            MovimientoDiaDTO movimientos = movimientoDiaService.obtenerMovimientosRango(fechaInicio, fechaFin);
            return ResponseEntity.ok(movimientos);
        } catch (Exception e) {
            System.err.println("❌ [CONTROLLER] Error al obtener movimientos por rango: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Exportar movimientos del día a Excel
     */
    @GetMapping("/{fecha}/exportar-excel")
    public ResponseEntity<byte[]> exportarMovimientosDiaExcel(@PathVariable String fecha) {
        try {
            System.out.println("🔍 [CONTROLLER] Exportando movimientos a Excel para fecha: " + fecha);
            byte[] excelBytes = movimientoDiaService.exportarMovimientosDiaExcel(fecha);
            
            String nombreArchivo = "movimientos_dia_" + fecha + ".xlsx";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", nombreArchivo);
            headers.setContentLength(excelBytes.length);
            
            System.out.println("✅ [CONTROLLER] Excel exportado exitosamente. Tamaño: " + excelBytes.length + " bytes");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(excelBytes);
                    
        } catch (Exception e) {
            System.err.println("❌ [CONTROLLER] Error al exportar movimientos a Excel: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Exportar movimientos por rango de fechas a Excel
     */
    @GetMapping("/rango/exportar-excel")
    public ResponseEntity<byte[]> exportarMovimientosRangoExcel(
            @RequestParam String fechaInicio,
            @RequestParam String fechaFin) {
        try {
            System.out.println("🔍 [CONTROLLER] Exportando movimientos a Excel para rango: " + fechaInicio + " a " + fechaFin);
            byte[] excelBytes = movimientoDiaService.exportarMovimientosRangoExcel(fechaInicio, fechaFin);
            
            String nombreArchivo = "movimientos_rango_" + fechaInicio + "_a_" + fechaFin + ".xlsx";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", nombreArchivo);
            headers.setContentLength(excelBytes.length);
            
            System.out.println("✅ [CONTROLLER] Excel de rango exportado exitosamente. Tamaño: " + excelBytes.length + " bytes");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(excelBytes);
                    
        } catch (Exception e) {
            System.err.println("❌ [CONTROLLER] Error al exportar movimientos de rango a Excel: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

}
