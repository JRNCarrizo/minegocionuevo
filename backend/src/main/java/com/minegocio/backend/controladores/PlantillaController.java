package com.minegocio.backend.controladores;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;

@RestController
@RequestMapping("/download")
@CrossOrigin(origins = "*")
public class PlantillaController {

    @GetMapping("/template")
    public void descargarPlantilla(HttpServletResponse response) throws IOException {
        try {
            System.out.println("📥 Descargando plantilla desde controlador Download");
            
            // Configurar respuesta
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment; filename=\"plantilla_productos.xlsx\"");
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.setHeader("Access-Control-Allow-Methods", "GET");
            response.setHeader("Access-Control-Allow-Headers", "*");
            
            // Generar plantilla directamente
            try (Workbook workbook = new XSSFWorkbook()) {
                Sheet sheet = workbook.createSheet("Productos");
                
                // Crear encabezados
                Row headerRow = sheet.createRow(0);
                String[] headers = {"Nombre*", "Marca", "Descripción", "Precio", "Stock*", "Categoría", "Sector_Almacenamiento", "Código_Barras", "Código_Personalizado"};
                
                for (int i = 0; i < headers.length; i++) {
                    Cell cell = headerRow.createCell(i);
                    cell.setCellValue(headers[i]);
                }
                
                // Crear fila de ejemplo
                Row exampleRow = sheet.createRow(1);
                exampleRow.createCell(0).setCellValue("Producto Ejemplo");
                exampleRow.createCell(1).setCellValue("Samsung");
                exampleRow.createCell(2).setCellValue("Descripción del producto");
                exampleRow.createCell(3).setCellValue(100.50);
                exampleRow.createCell(4).setCellValue(50);
                exampleRow.createCell(5).setCellValue("Electrónicos");
                exampleRow.createCell(6).setCellValue("Depósito A");
                exampleRow.createCell(7).setCellValue("1234567890123");
                exampleRow.createCell(8).setCellValue("PROD-001");
                
                // Escribir directamente a la respuesta
                workbook.write(response.getOutputStream());
                response.getOutputStream().flush();
                
                System.out.println("✅ Plantilla generada exitosamente desde controlador Download");
            }
            
        } catch (Exception e) {
            System.err.println("❌ Error en controlador Download: " + e.getMessage());
            e.printStackTrace();
            
            // Enviar error como JSON
            response.setContentType("application/json");
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\": \"Error al generar plantilla: " + e.getMessage() + "\"}");
        }
    }

    @GetMapping("/test")
    public String test() {
        return "Controlador Download funcionando correctamente";
    }
}
