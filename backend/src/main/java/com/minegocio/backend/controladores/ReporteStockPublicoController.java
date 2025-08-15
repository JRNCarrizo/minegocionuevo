package com.minegocio.backend.controladores;

import com.minegocio.backend.servicios.ReporteStockService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * Controlador completamente público para reporte de stock
 * Sin autenticación, sin Spring Security
 */
@RestController
@CrossOrigin(origins = "*")
public class ReporteStockPublicoController {

    @Autowired
    private ReporteStockService reporteStockService;

    /**
     * Endpoint público para reporte de stock
     */
    @GetMapping("/api/files/stock/{empresaId}")
    public void descargarReporteStockPublico(@PathVariable Long empresaId, HttpServletResponse response) throws IOException {
        try {
            System.out.println("📊 Descargando reporte de stock público para empresa: " + empresaId);
            
            // Configurar respuesta
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment; filename=\"reporte_stock_" + empresaId + "_" + 
                LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + ".xlsx\"");
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.setHeader("Access-Control-Allow-Methods", "GET");
            response.setHeader("Access-Control-Allow-Headers", "*");
            
            // Generar reporte
            byte[] reporte = reporteStockService.generarReporteStock(empresaId);
            
            // Escribir directamente a la respuesta
            response.getOutputStream().write(reporte);
            response.getOutputStream().flush();
            
            System.out.println("✅ Reporte de stock público generado exitosamente");
        } catch (Exception e) {
            System.err.println("❌ Error en reporte de stock público: " + e.getMessage());
            e.printStackTrace();
            
            // Enviar error como JSON
            response.setContentType("application/json");
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\": \"Error al generar reporte de stock: " + e.getMessage() + "\"}");
        }
    }

    /**
     * Endpoint público directo para reporte de stock
     */
    @GetMapping("/api/direct/stock/{empresaId}")
    public void descargarReporteStockDirecto(@PathVariable Long empresaId, HttpServletResponse response) throws IOException {
        try {
            System.out.println("📊 Descargando reporte de stock directo para empresa: " + empresaId);
            
            // Configurar respuesta
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment; filename=\"reporte_stock_directo_" + empresaId + "_" + 
                LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + ".xlsx\"");
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.setHeader("Access-Control-Allow-Methods", "GET");
            response.setHeader("Access-Control-Allow-Headers", "*");
            
            // Generar reporte
            byte[] reporte = reporteStockService.generarReporteStock(empresaId);
            
            // Escribir directamente a la respuesta
            response.getOutputStream().write(reporte);
            response.getOutputStream().flush();
            
            System.out.println("✅ Reporte de stock directo generado exitosamente");
        } catch (Exception e) {
            System.err.println("❌ Error en reporte de stock directo: " + e.getMessage());
            e.printStackTrace();
            
            // Enviar error como JSON
            response.setContentType("application/json");
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\": \"Error al generar reporte de stock: " + e.getMessage() + "\"}");
        }
    }

    /**
     * Endpoint público para reporte de stock con ruta alternativa
     */
    @GetMapping("/api/public/reportes/stock/{empresaId}")
    public void descargarReporteStockPublicoAlternativo(@PathVariable Long empresaId, HttpServletResponse response) throws IOException {
        try {
            System.out.println("📊 Descargando reporte de stock público alternativo para empresa: " + empresaId);
            
            // Configurar respuesta
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment; filename=\"reporte_stock_publico_" + empresaId + "_" + 
                LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + ".xlsx\"");
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.setHeader("Access-Control-Allow-Methods", "GET");
            response.setHeader("Access-Control-Allow-Headers", "*");
            
            // Generar reporte
            byte[] reporte = reporteStockService.generarReporteStock(empresaId);
            
            // Escribir directamente a la respuesta
            response.getOutputStream().write(reporte);
            response.getOutputStream().flush();
            
            System.out.println("✅ Reporte de stock público alternativo generado exitosamente");
        } catch (Exception e) {
            System.err.println("❌ Error en reporte de stock público alternativo: " + e.getMessage());
            e.printStackTrace();
            
            // Enviar error como JSON
            response.setContentType("application/json");
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\": \"Error al generar reporte de stock: " + e.getMessage() + "\"}");
        }
    }

    /**
     * Endpoint público simple para reporte de stock
     */
    @GetMapping("/api/reportes/stock/{empresaId}")
    public void descargarReporteStockSimple(@PathVariable Long empresaId, HttpServletResponse response) throws IOException {
        try {
            System.out.println("📊 Descargando reporte de stock simple para empresa: " + empresaId);
            
            // Configurar respuesta
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment; filename=\"reporte_stock_simple_" + empresaId + "_" + 
                LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + ".xlsx\"");
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.setHeader("Access-Control-Allow-Methods", "GET");
            response.setHeader("Access-Control-Allow-Headers", "*");
            
            // Generar reporte
            byte[] reporte = reporteStockService.generarReporteStock(empresaId);
            
            // Escribir directamente a la respuesta
            response.getOutputStream().write(reporte);
            response.getOutputStream().flush();
            
            System.out.println("✅ Reporte de stock simple generado exitosamente");
        } catch (Exception e) {
            System.err.println("❌ Error en reporte de stock simple: " + e.getMessage());
            e.printStackTrace();
            
            // Enviar error como JSON
            response.setContentType("application/json");
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\": \"Error al generar reporte de stock: " + e.getMessage() + "\"}");
        }
    }
}
