package com.minegocio.backend.controladores;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * Controlador independiente para plantillas de Excel
 * Endpoints completamente públicos sin autenticación
 */
@RestController
@CrossOrigin(origins = "*")
public class PlantillaIndependienteController {

    /**
     * Endpoint para descargar plantilla pública
     */
    @GetMapping("/api/plantilla-publica")
    public void descargarPlantillaPublica(HttpServletResponse response) throws IOException {
        try {
            System.out.println("📥 Descargando plantilla pública desde PlantillaIndependienteController");
            
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
                
                // Crear headers (formato unificado)
                String[] headers = {
                    "Nombre*", "Marca", "Descripción", "Categoría", 
                    "Sector Almacenamiento", "Stock Actual*", "Stock Mínimo", 
                    "Precio", "Código de Barras", "Código Personalizado", "Estado"
                };
                
                Row headerRow = sheet.createRow(0);
                for (int i = 0; i < headers.length; i++) {
                    Cell cell = headerRow.createCell(i);
                    cell.setCellValue(headers[i]);
                    cell.setCellStyle(headerStyle);
                    sheet.setColumnWidth(i, 4000);
                }
                
                // Crear fila de ejemplo (formato unificado)
                Row exampleRow = sheet.createRow(1);
                exampleRow.createCell(0).setCellValue("Ejemplo Producto");
                exampleRow.createCell(1).setCellValue("Marca Ejemplo");
                exampleRow.createCell(2).setCellValue("Descripción del producto");
                exampleRow.createCell(3).setCellValue("Categoría Ejemplo");
                exampleRow.createCell(4).setCellValue("Sector A");
                exampleRow.createCell(5).setCellValue(50);
                exampleRow.createCell(6).setCellValue(10);
                exampleRow.createCell(7).setCellValue(1000.00);
                exampleRow.createCell(8).setCellValue("1234567890123");
                exampleRow.createCell(9).setCellValue("COD001");
                exampleRow.createCell(10).setCellValue("Activo");
                
                // Escribir directamente a la respuesta
                workbook.write(response.getOutputStream());
                response.getOutputStream().flush();
            }
            
            System.out.println("✅ Plantilla pública generada exitosamente");
        } catch (Exception e) {
            System.err.println("❌ Error en PlantillaIndependienteController (pública): " + e.getMessage());
            e.printStackTrace();
            
            // Enviar error como JSON
            response.setContentType("application/json");
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\": \"Error al generar plantilla: " + e.getMessage() + "\"}");
        }
    }

    /**
     * Endpoint para descargar plantilla simple
     */
    @GetMapping("/api/plantilla-simple")
    public void descargarPlantillaSimple(HttpServletResponse response) throws IOException {
        try {
            System.out.println("📥 Descargando plantilla simple desde PlantillaIndependienteController");
            
            // Configurar respuesta
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment; filename=\"plantilla_simple_" + 
                LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + ".xlsx\"");
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            response.setHeader("Access-Control-Allow-Headers", "*");
            
            // Crear workbook
            try (Workbook workbook = new XSSFWorkbook()) {
                Sheet sheet = workbook.createSheet("Plantilla Simple");
                
                // Crear estilos
                CellStyle headerStyle = workbook.createCellStyle();
                Font headerFont = workbook.createFont();
                headerFont.setBold(true);
                headerFont.setColor(IndexedColors.WHITE.getIndex());
                headerStyle.setFont(headerFont);
                headerStyle.setFillForegroundColor(IndexedColors.GREEN.getIndex());
                headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
                headerStyle.setAlignment(HorizontalAlignment.CENTER);
                
                // Crear headers simplificados
                String[] headers = {
                    "Nombre*", "Precio", "Stock", "Categoría", "Descripción"
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
                exampleRow.createCell(0).setCellValue("Producto Ejemplo");
                exampleRow.createCell(1).setCellValue(500.00);
                exampleRow.createCell(2).setCellValue(25);
                exampleRow.createCell(3).setCellValue("General");
                exampleRow.createCell(4).setCellValue("Descripción del producto");
                
                // Escribir directamente a la respuesta
                workbook.write(response.getOutputStream());
                response.getOutputStream().flush();
            }
            
            System.out.println("✅ Plantilla simple generada exitosamente");
        } catch (Exception e) {
            System.err.println("❌ Error en PlantillaIndependienteController (simple): " + e.getMessage());
            e.printStackTrace();
            
            // Enviar error como JSON
            response.setContentType("application/json");
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\": \"Error al generar plantilla: " + e.getMessage() + "\"}");
        }
    }

    /**
     * Endpoint para descargar plantilla final
     */
    @GetMapping("/api/plantilla-final")
    public void descargarPlantillaFinal(HttpServletResponse response) throws IOException {
        try {
            System.out.println("📥 Descargando plantilla final desde PlantillaIndependienteController");
            
            // Configurar respuesta
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment; filename=\"plantilla_final_" + 
                LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + ".xlsx\"");
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            response.setHeader("Access-Control-Allow-Headers", "*");
            
            // Crear workbook
            try (Workbook workbook = new XSSFWorkbook()) {
                Sheet sheet = workbook.createSheet("Plantilla Final");
                
                // Crear estilos
                CellStyle headerStyle = workbook.createCellStyle();
                Font headerFont = workbook.createFont();
                headerFont.setBold(true);
                headerFont.setColor(IndexedColors.WHITE.getIndex());
                headerStyle.setFont(headerFont);
                headerStyle.setFillForegroundColor(IndexedColors.INDIGO.getIndex());
                headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
                headerStyle.setAlignment(HorizontalAlignment.CENTER);
                
                // Crear headers completos (formato unificado)
                String[] headers = {
                    "Nombre*", "Marca", "Descripción", "Categoría", 
                    "Sector Almacenamiento", "Stock Actual*", "Stock Mínimo", 
                    "Precio", "Código de Barras", "Código Personalizado", "Estado"
                };
                
                Row headerRow = sheet.createRow(0);
                for (int i = 0; i < headers.length; i++) {
                    Cell cell = headerRow.createCell(i);
                    cell.setCellValue(headers[i]);
                    cell.setCellStyle(headerStyle);
                    sheet.setColumnWidth(i, 4000);
                }
                
                // Crear fila de ejemplo (formato unificado)
                Row exampleRow = sheet.createRow(1);
                exampleRow.createCell(0).setCellValue("Producto Final");
                exampleRow.createCell(1).setCellValue("Marca Final");
                exampleRow.createCell(2).setCellValue("Descripción completa del producto");
                exampleRow.createCell(3).setCellValue("Categoría Final");
                exampleRow.createCell(4).setCellValue("Sector Final");
                exampleRow.createCell(5).setCellValue(100);
                exampleRow.createCell(6).setCellValue(20);
                exampleRow.createCell(7).setCellValue(1500.00);
                exampleRow.createCell(8).setCellValue("9876543210987");
                exampleRow.createCell(9).setCellValue("COD_FINAL");
                exampleRow.createCell(10).setCellValue("Activo");
                
                // Escribir directamente a la respuesta
                workbook.write(response.getOutputStream());
                response.getOutputStream().flush();
            }
            
            System.out.println("✅ Plantilla final generada exitosamente");
        } catch (Exception e) {
            System.err.println("❌ Error en PlantillaIndependienteController (final): " + e.getMessage());
            e.printStackTrace();
            
            // Enviar error como JSON
            response.setContentType("application/json");
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\": \"Error al generar plantilla: " + e.getMessage() + "\"}");
        }
    }
}
