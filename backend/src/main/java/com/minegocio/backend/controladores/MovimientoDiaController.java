package com.minegocio.backend.controladores;

import com.minegocio.backend.dto.MovimientoDiaDTO;
import com.minegocio.backend.servicios.MovimientoDiaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
    

}
