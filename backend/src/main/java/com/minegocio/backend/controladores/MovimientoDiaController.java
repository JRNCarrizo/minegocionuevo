package com.minegocio.backend.controladores;

import com.minegocio.backend.dto.MovimientoDiaDTO;
import com.minegocio.backend.servicios.MovimientoDiaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import java.util.Map;

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
            System.err.println("❌ [CONTROLLER] Fecha recibida: " + fecha);
            System.err.println("❌ [CONTROLLER] Stack trace completo:");
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

    /**
     * Exportar ingresos del día a Excel con estructura específica
     * Incluye: código personalizado, productos iniciales, cantidades, remitos por día
     */
    @GetMapping("/{fecha}/exportar-ingresos-excel")
    public ResponseEntity<byte[]> exportarIngresosDiaExcel(@PathVariable String fecha) {
        try {
            System.out.println("🔍 [CONTROLLER] Exportando ingresos a Excel para fecha: " + fecha);
            byte[] excelBytes = movimientoDiaService.exportarIngresosDiaExcel(fecha);
            
            String nombreArchivo = "ingresos_dia_" + fecha + ".xlsx";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", nombreArchivo);
            headers.setContentLength(excelBytes.length);
            
            System.out.println("✅ [CONTROLLER] Excel de ingresos exportado exitosamente. Tamaño: " + excelBytes.length + " bytes");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(excelBytes);
                    
        } catch (Exception e) {
            System.err.println("❌ [CONTROLLER] Error al exportar ingresos a Excel: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Exportar planillas del día a Excel con estructura específica
     * Incluye: código personalizado, productos, cantidades, planillas por día
     */
    @GetMapping("/{fecha}/exportar-planillas-excel")
    public ResponseEntity<byte[]> exportarPlanillasDiaExcel(@PathVariable String fecha) {
        try {
            System.out.println("🔍 [CONTROLLER] Exportando planillas a Excel para fecha: " + fecha);
            byte[] excelBytes = movimientoDiaService.exportarPlanillasDiaExcel(fecha);
            
            String nombreArchivo = "planillas_dia_" + fecha + ".xlsx";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", nombreArchivo);
            headers.setContentLength(excelBytes.length);
            
            System.out.println("✅ [CONTROLLER] Excel de planillas exportado exitosamente. Tamaño: " + excelBytes.length + " bytes");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(excelBytes);
                    
        } catch (Exception e) {
            System.err.println("❌ [CONTROLLER] Error al exportar planillas a Excel: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Exportar devoluciones del día a Excel con estructura específica
     * Incluye: código personalizado, productos, cantidades, planillas de devolución por día
     */
    @GetMapping("/{fecha}/exportar-devoluciones-excel")
    public ResponseEntity<byte[]> exportarDevolucionesDiaExcel(@PathVariable String fecha) {
        try {
            System.out.println("🔍 [CONTROLLER] Exportando devoluciones a Excel para fecha: " + fecha);
            byte[] excelBytes = movimientoDiaService.exportarDevolucionesDiaExcel(fecha);
            
            String nombreArchivo = "devoluciones_dia_" + fecha + ".xlsx";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", nombreArchivo);
            headers.setContentLength(excelBytes.length);
            
            System.out.println("✅ [CONTROLLER] Excel de devoluciones exportado exitosamente. Tamaño: " + excelBytes.length + " bytes");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(excelBytes);
                    
        } catch (Exception e) {
            System.err.println("❌ [CONTROLLER] Error al exportar devoluciones a Excel: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Exportar stock inicial del día a Excel
     * Incluye: código personalizado, descripción, cantidad inicial, total
     */
    @GetMapping("/{fecha}/exportar-stock-inicial-excel")
    public ResponseEntity<byte[]> exportarStockInicialExcel(@PathVariable String fecha) {
        try {
            System.out.println("🔍 [CONTROLLER] Exportando stock inicial a Excel para fecha: " + fecha);
            
            // Validar formato de fecha
            if (fecha == null || fecha.trim().isEmpty()) {
                System.err.println("❌ [CONTROLLER] Fecha vacía o nula");
                return ResponseEntity.badRequest().build();
            }
            
            byte[] excelBytes = movimientoDiaService.exportarStockInicialExcel(fecha);
            
            if (excelBytes == null || excelBytes.length == 0) {
                System.err.println("❌ [CONTROLLER] Excel generado está vacío");
                return ResponseEntity.badRequest().build();
            }
            
            String nombreArchivo = "stock_inicial_" + fecha + ".xlsx";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", nombreArchivo);
            headers.setContentLength(excelBytes.length);
            
            System.out.println("✅ [CONTROLLER] Excel de stock inicial exportado exitosamente. Tamaño: " + excelBytes.length + " bytes");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(excelBytes);
                    
        } catch (Exception e) {
            System.err.println("❌ [CONTROLLER] Error al exportar stock inicial a Excel: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obtener productos perdidos del día (ROTO, MAL_ESTADO, DEFECTUOSO)
     */
    @GetMapping("/{fecha}/productos-perdidos")
    public ResponseEntity<?> obtenerProductosPerdidos(@PathVariable String fecha) {
        try {
            System.out.println("🔍 [CONTROLLER] Obteniendo productos perdidos para fecha: " + fecha);
            var productosPerdidos = movimientoDiaService.obtenerProductosPerdidos(fecha);
            return ResponseEntity.ok(productosPerdidos);
        } catch (Exception e) {
            System.err.println("❌ [CONTROLLER] Error al obtener productos perdidos: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Limpiar cache del stock inicial (útil para testing o reinicio del día)
     */
    @PostMapping("/limpiar-cache-stock-inicial")
    public ResponseEntity<String> limpiarCacheStockInicial() {
        try {
            System.out.println("🔍 [CONTROLLER] Limpiando cache del stock inicial");
            movimientoDiaService.limpiarCacheStockInicial();
            return ResponseEntity.ok("Cache del stock inicial limpiado exitosamente");
        } catch (Exception e) {
            System.err.println("❌ [CONTROLLER] Error al limpiar cache del stock inicial: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error al limpiar cache del stock inicial");
        }
    }

    /**
     * Debug: Obtener información detallada del stock para una fecha específica
     */
    @GetMapping("/debug/{fecha}")
    public ResponseEntity<Map<String, Object>> debugStock(@PathVariable String fecha) {
        try {
            System.out.println("🔍 [DEBUG] Obteniendo información de debug para fecha: " + fecha);
            Map<String, Object> debug = movimientoDiaService.debugStock(fecha);
            return ResponseEntity.ok(debug);
        } catch (Exception e) {
            System.err.println("❌ [DEBUG] Error al obtener información de debug: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Cerrar o reabrir el día
     * Si está abierto: lo cierra y guarda el balance final
     * Si está cerrado: lo reabre eliminando el cierre
     */
    @PostMapping("/cerrar-dia/{fecha}")
    public ResponseEntity<String> cerrarDia(@PathVariable String fecha) {
        try {
            System.out.println("🔒 [CONTROLLER] Procesando día para fecha: " + fecha);
            
            // Validar formato de fecha
            if (fecha == null || fecha.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Fecha requerida");
            }
            
            String resultado = movimientoDiaService.cerrarDia(fecha);
            
            System.out.println("✅ [CONTROLLER] Día procesado exitosamente: " + resultado);
            return ResponseEntity.ok(resultado);
            
        } catch (Exception e) {
            System.err.println("❌ [CONTROLLER] Error al procesar el día: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error al procesar el día: " + e.getMessage());
        }
    }

    /**
     * Ejecutar migración V36 para agregar columna estado a planillas_devoluciones
     * SOLO PARA USAR EN PRODUCCIÓN - Ejecutar una sola vez
     */
    @PostMapping("/ejecutar-migracion-v36")
    public ResponseEntity<String> ejecutarMigracionV36() {
        try {
            System.out.println("🔧 [MIGRACIÓN] Iniciando ejecución de migración V36...");
            
            // Ejecutar la migración V36
            String resultado = movimientoDiaService.ejecutarMigracionV36();
            
            System.out.println("✅ [MIGRACIÓN] Migración V36 ejecutada exitosamente");
            return ResponseEntity.ok("✅ Migración V36 ejecutada exitosamente: " + resultado);
            
        } catch (Exception e) {
            System.err.println("❌ [MIGRACIÓN] Error al ejecutar migración V36: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("❌ Error al ejecutar migración V36: " + e.getMessage());
        }
    }

    /**
     * Capturar manualmente el stock inicial para una fecha específica
     */
    @PostMapping("/capturar-stock-inicial/{fecha}")
    public ResponseEntity<String> capturarStockInicial(@PathVariable String fecha) {
        try {
            System.out.println("🔍 [CONTROLLER] Capturando stock inicial para fecha: " + fecha);
            
            // Validar formato de fecha
            if (fecha == null || fecha.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Fecha requerida");
            }
            
            // Convertir string a LocalDate
            java.time.LocalDate fechaLocal = java.time.LocalDate.parse(fecha, java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd"));
            
            // Capturar stock inicial
            movimientoDiaService.capturarStockInicialParaFecha(fechaLocal);
            
            return ResponseEntity.ok("Stock inicial capturado exitosamente para la fecha: " + fecha);
        } catch (Exception e) {
            System.err.println("❌ [CONTROLLER] Error al capturar stock inicial: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error al capturar stock inicial: " + e.getMessage());
        }
    }

    /**
     * Exportar reporte completo del día a Excel con 5 pestañas
     * Pestañas: Ingresos, Planillas, Retornos, Pérdidas, Stock
     */
    @GetMapping("/{fecha}/exportar-reporte-completo-excel")
    public ResponseEntity<byte[]> exportarReporteCompletoExcel(@PathVariable String fecha) {
        try {
            System.out.println("🔍 [CONTROLLER] Exportando reporte completo a Excel para fecha: " + fecha);
            
            // Validar formato de fecha
            if (fecha == null || fecha.trim().isEmpty()) {
                System.err.println("❌ [CONTROLLER] Fecha vacía o nula");
                return ResponseEntity.badRequest().build();
            }
            
            byte[] excelBytes = movimientoDiaService.exportarReporteCompletoExcel(fecha);
            
            if (excelBytes == null || excelBytes.length == 0) {
                System.err.println("❌ [CONTROLLER] Excel generado está vacío");
                return ResponseEntity.badRequest().build();
            }
            
            String nombreArchivo = "reporte_completo_" + fecha + ".xlsx";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", nombreArchivo);
            headers.setContentLength(excelBytes.length);
            
            System.out.println("✅ [CONTROLLER] Reporte completo exportado exitosamente. Tamaño: " + excelBytes.length + " bytes");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(excelBytes);
                    
        } catch (Exception e) {
            System.err.println("❌ [CONTROLLER] Error al exportar reporte completo a Excel: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

}
