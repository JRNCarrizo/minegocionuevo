package com.minegocio.backend.controladores;

import com.minegocio.backend.servicios.ReporteStockService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * Controlador independiente para reporte de stock
 * Endpoints completamente públicos sin autenticación
 */
@RestController
@CrossOrigin(origins = "*")
public class ReporteStockIndependienteController {

    @Autowired
    private ReporteStockService reporteStockService;

    /**
     * Endpoint para descargar reporte de stock público
     */
    @GetMapping("/api/reporte-stock/{empresaId}")
    public void descargarReporteStockPublico(@PathVariable Long empresaId, HttpServletResponse response) throws IOException {
        try {
            System.out.println("📊 Descargando reporte de stock público desde ReporteStockIndependienteController para empresa: " + empresaId);
            
            // Configurar respuesta
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment; filename=\"reporte_stock_" + empresaId + "_" + 
                LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + ".xlsx\"");
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            response.setHeader("Access-Control-Allow-Headers", "*");
            
            // Generar el reporte
            byte[] reporte = reporteStockService.generarReporteStock(empresaId);
            
            if (reporte == null || reporte.length == 0) {
                System.err.println("❌ Error: Reporte generado está vacío");
                response.setContentType("application/json");
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                response.getWriter().write("{\"error\": \"Error al generar el reporte: archivo vacío\"}");
                return;
            }
            
            // Escribir directamente a la respuesta
            response.getOutputStream().write(reporte);
            response.getOutputStream().flush();
            
            System.out.println("✅ Reporte de stock público generado exitosamente, tamaño: " + reporte.length + " bytes");
        } catch (Exception e) {
            System.err.println("❌ Error en ReporteStockIndependienteController: " + e.getMessage());
            e.printStackTrace();
            
            // Enviar error como JSON
            response.setContentType("application/json");
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\": \"Error al generar reporte de stock: " + e.getMessage() + "\"}");
        }
    }

    /**
     * Endpoint alternativo para descargar reporte de stock
     */
    @GetMapping("/api/reporte-stock-directo/{empresaId}")
    public void descargarReporteStockDirecto(@PathVariable Long empresaId, HttpServletResponse response) throws IOException {
        try {
            System.out.println("📊 Descargando reporte de stock directo desde ReporteStockIndependienteController para empresa: " + empresaId);
            
            // Configurar respuesta
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment; filename=\"reporte_stock_directo_" + empresaId + "_" + 
                LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + ".xlsx\"");
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            response.setHeader("Access-Control-Allow-Headers", "*");
            
            // Generar el reporte
            byte[] reporte = reporteStockService.generarReporteStock(empresaId);
            
            if (reporte == null || reporte.length == 0) {
                System.err.println("❌ Error: Reporte generado está vacío");
                response.setContentType("application/json");
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                response.getWriter().write("{\"error\": \"Error al generar el reporte: archivo vacío\"}");
                return;
            }
            
            // Escribir directamente a la respuesta
            response.getOutputStream().write(reporte);
            response.getOutputStream().flush();
            
            System.out.println("✅ Reporte de stock directo generado exitosamente, tamaño: " + reporte.length + " bytes");
        } catch (Exception e) {
            System.err.println("❌ Error en ReporteStockIndependienteController (directo): " + e.getMessage());
            e.printStackTrace();
            
            // Enviar error como JSON
            response.setContentType("application/json");
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\": \"Error al generar reporte de stock: " + e.getMessage() + "\"}");
        }
    }

    /**
     * Endpoint de prueba para verificar que el controlador funciona
     */
    @GetMapping("/api/reporte-stock-test/{empresaId}")
    public void testReporteStock(@PathVariable Long empresaId, HttpServletResponse response) throws IOException {
        try {
            System.out.println("🧪 Test: Verificando reporte de stock para empresa: " + empresaId);
            
            response.setContentType("application/json");
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            response.setHeader("Access-Control-Allow-Headers", "*");
            
            // Verificar si el servicio está disponible
            try {
                byte[] reporte = reporteStockService.generarReporteStock(empresaId);
                
                response.getWriter().write("{\"status\": \"success\", \"message\": \"Reporte de stock disponible\", \"empresaId\": " + empresaId + ", \"tamaño\": " + (reporte != null ? reporte.length : 0) + "}");
            } catch (Exception e) {
                response.getWriter().write("{\"status\": \"error\", \"message\": \"Error al generar reporte: " + e.getMessage() + "\", \"empresaId\": " + empresaId + "}");
            }
            
        } catch (Exception e) {
            System.err.println("❌ Error en test de reporte de stock: " + e.getMessage());
            e.printStackTrace();
            
            response.setContentType("application/json");
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\": \"Error en test de reporte de stock: " + e.getMessage() + "\"}");
        }
    }
}
