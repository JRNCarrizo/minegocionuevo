package com.minegocio.backend.controladores;

import com.minegocio.backend.servicios.ReporteStockService;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * Controlador final para descargas - usa rutas completamente diferentes
 * para evitar conflictos con ResourceHttpRequestHandler
 */
@RestController
@RequestMapping("/files")
@CrossOrigin(origins = "*")
public class DescargaFinalController {

    @Autowired
    private ReporteStockService reporteStockService;

    /**
     * Endpoint final para reporte de stock
     */
    @GetMapping("/stock/{empresaId}")
    public void descargarReporteStockFinal(@PathVariable Long empresaId, HttpServletResponse response) throws IOException {
        try {
            System.out.println("📊 Descargando reporte de stock final para empresa: " + empresaId);
            
            // Configurar respuesta
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment; filename=\"reporte_stock_" + empresaId + "_" + 
                LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + ".xlsx\"");
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            response.setHeader("Access-Control-Allow-Headers", "*");
            
            // Generar reporte directamente
            byte[] reporte = reporteStockService.generarReporteStock(empresaId);
            
            // Escribir directamente a la respuesta
            response.getOutputStream().write(reporte);
            response.getOutputStream().flush();
            
            System.out.println("✅ Reporte de stock final generado exitosamente");
        } catch (Exception e) {
            System.err.println("❌ Error en reporte de stock final: " + e.getMessage());
            e.printStackTrace();
            
            // Enviar error como JSON
            response.setContentType("application/json");
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\": \"Error al generar reporte de stock: " + e.getMessage() + "\"}");
        }
    }

    /**
     * Endpoint final para plantilla de Excel
     */
    @GetMapping("/template")
    public void descargarPlantillaFinal(HttpServletResponse response) throws IOException {
        try {
            System.out.println("📥 Descargando plantilla final");
            
            // Configurar respuesta
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment; filename=\"plantilla_importacion_productos_" + 
                LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + ".xlsx\"");
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            response.setHeader("Access-Control-Allow-Headers", "*");
            
            // Crear workbook
            try (Workbook workbook = new XSSFWorkbook()) {
                Sheet sheet = workbook.createSheet("Plantilla Importación");
                
                // Crear estilos
                CellStyle headerStyle = workbook.createCellStyle();
                Font headerFont = workbook.createFont();
                headerFont.setBold(true);
                headerFont.setColor(IndexedColors.WHITE.getIndex());
                headerStyle.setFont(headerFont);
                headerStyle.setFillForegroundColor(IndexedColors.BLUE.getIndex());
                headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
                headerStyle.setAlignment(HorizontalAlignment.CENTER);
                
                // Crear headers
                String[] headers = {
                    "Nombre*", "Descripción", "Precio", "Stock", "Stock Mínimo", 
                    "Categoría", "Marca", "Unidad", "Sector Almacenamiento", 
                    "Código Personalizado", "Código de Barras"
                };
                
                Row headerRow = sheet.createRow(0);
                for (int i = 0; i < headers.length; i++) {
                    Cell cell = headerRow.createCell(i);
                    cell.setCellValue(headers[i]);
                    cell.setCellStyle(headerStyle);
                    sheet.setColumnWidth(i, 4000);
                }
                
                // Crear fila de ejemplo
                Row exampleRow = sheet.createRow(1);
                exampleRow.createCell(0).setCellValue("Ejemplo Producto");
                exampleRow.createCell(1).setCellValue("Descripción del producto");
                exampleRow.createCell(2).setCellValue(1000.00);
                exampleRow.createCell(3).setCellValue(50);
                exampleRow.createCell(4).setCellValue(10);
                exampleRow.createCell(5).setCellValue("Categoría Ejemplo");
                exampleRow.createCell(6).setCellValue("Marca Ejemplo");
                exampleRow.createCell(7).setCellValue("Unidad");
                exampleRow.createCell(8).setCellValue("Sector A");
                exampleRow.createCell(9).setCellValue("COD001");
                exampleRow.createCell(10).setCellValue("1234567890123");
                
                // Escribir directamente a la respuesta
                workbook.write(response.getOutputStream());
                response.getOutputStream().flush();
            }
            
            System.out.println("✅ Plantilla final generada exitosamente");
        } catch (Exception e) {
            System.err.println("❌ Error en plantilla final: " + e.getMessage());
            e.printStackTrace();
            
            // Enviar error como JSON
            response.setContentType("application/json");
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\": \"Error al generar plantilla: " + e.getMessage() + "\"}");
        }
    }
}

