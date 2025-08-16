package com.minegocio.backend.servicios;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
public class PlantillaCargaMasivaService {

    /**
     * Genera una plantilla de carga masiva con el mismo formato que el reporte de stock
     */
    public byte[] generarPlantillaCargaMasiva() throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Plantilla Carga Masiva");

            // Crear estilos
            CellStyle headerStyle = crearEstiloEncabezado(workbook);
            CellStyle titleStyle = crearEstiloTitulo(workbook);
            CellStyle dateStyle = crearEstiloFecha(workbook);
            CellStyle numberStyle = crearEstiloNumero(workbook);
            CellStyle currencyStyle = crearEstiloMoneda(workbook);
            CellStyle instructionStyle = crearEstiloInstrucciones(workbook);

            // Título del reporte
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("PLANTILLA DE CARGA MASIVA - PRODUCTOS");
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 0, 10));

            // Fecha de generación
            Row dateRow = sheet.createRow(1);
            Cell dateCell = dateRow.createCell(0);
            dateCell.setCellValue("Fecha de generación: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")));
            dateCell.setCellStyle(dateStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(1, 1, 0, 10));

            // Instrucciones
            Row instructionRow1 = sheet.createRow(2);
            Cell instructionCell1 = instructionRow1.createCell(0);
            instructionCell1.setCellValue("INSTRUCCIONES: Complete los campos marcados con * (obligatorios). Los demás campos son opcionales.");
            instructionCell1.setCellStyle(instructionStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(2, 2, 0, 10));

            Row instructionRow2 = sheet.createRow(3);
            Cell instructionCell2 = instructionRow2.createCell(0);
            instructionCell2.setCellValue("Para importar: 1) Complete esta plantilla, 2) Guarde como .xlsx, 3) Use la función de carga masiva");
            instructionCell2.setCellStyle(instructionStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(3, 3, 0, 10));

            // Línea en blanco
            sheet.createRow(4);

            // Encabezados (exactamente igual al reporte de stock)
            Row headerRow = sheet.createRow(5);
            String[] headers = {
                "Nombre*", "Marca", "Descripción", "Categoría", 
                "Sector Almacenamiento", "Stock Actual*", "Stock Mínimo", 
                "Precio", "Código de Barras", "Código Personalizado", "Estado"
            };

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Fila de ejemplo
            Row exampleRow = sheet.createRow(6);
            
            // Nombre (obligatorio)
            Cell nameCell = exampleRow.createCell(0);
            nameCell.setCellValue("Producto Ejemplo");
            nameCell.setCellStyle(crearEstiloEjemplo(workbook));
            
            // Marca
            exampleRow.createCell(1).setCellValue("Samsung");
            
            // Descripción
            exampleRow.createCell(2).setCellValue("Descripción detallada del producto");
            
            // Categoría
            exampleRow.createCell(3).setCellValue("Electrónicos");
            
            // Sector Almacenamiento
            exampleRow.createCell(4).setCellValue("Depósito A");
            
            // Stock Actual (obligatorio)
            Cell stockCell = exampleRow.createCell(5);
            stockCell.setCellValue(50);
            stockCell.setCellStyle(numberStyle);
            
            // Stock Mínimo
            Cell stockMinCell = exampleRow.createCell(6);
            stockMinCell.setCellValue(10);
            stockMinCell.setCellStyle(numberStyle);
            
            // Precio (obligatorio)
            Cell priceCell = exampleRow.createCell(7);
            priceCell.setCellValue(299.99);
            priceCell.setCellStyle(currencyStyle);
            
            // Código de Barras
            exampleRow.createCell(8).setCellValue("1234567890123");
            
            // Código Personalizado
            exampleRow.createCell(9).setCellValue("PROD-001");
            
            // Estado
            exampleRow.createCell(10).setCellValue("Activo");

            // Fila de ejemplo 2
            Row exampleRow2 = sheet.createRow(7);
            
            // Nombre (obligatorio)
            Cell nameCell2 = exampleRow2.createCell(0);
            nameCell2.setCellValue("Otro Producto");
            nameCell2.setCellStyle(crearEstiloEjemplo(workbook));
            
            // Marca
            exampleRow2.createCell(1).setCellValue("Apple");
            
            // Descripción
            exampleRow2.createCell(2).setCellValue("Otro producto de ejemplo");
            
            // Categoría
            exampleRow2.createCell(3).setCellValue("Tecnología");
            
            // Sector Almacenamiento
            exampleRow2.createCell(4).setCellValue("Depósito B");
            
            // Stock Actual (obligatorio)
            Cell stockCell2 = exampleRow2.createCell(5);
            stockCell2.setCellValue(25);
            stockCell2.setCellStyle(numberStyle);
            
            // Stock Mínimo
            Cell stockMinCell2 = exampleRow2.createCell(6);
            stockMinCell2.setCellValue(5);
            stockMinCell2.setCellStyle(numberStyle);
            
            // Precio (obligatorio)
            Cell priceCell2 = exampleRow2.createCell(7);
            priceCell2.setCellValue(599.99);
            priceCell2.setCellStyle(currencyStyle);
            
            // Código de Barras
            exampleRow2.createCell(8).setCellValue("9876543210987");
            
            // Código Personalizado
            exampleRow2.createCell(9).setCellValue("PROD-002");
            
            // Estado
            exampleRow2.createCell(10).setCellValue("Activo");

            // Agregar información adicional
            agregarInformacionAdicional(sheet, 10);

            // Ajustar ancho de columnas
            sheet.setColumnWidth(0, 30 * 256);  // Nombre
            sheet.setColumnWidth(1, 15 * 256);  // Marca
            sheet.setColumnWidth(2, 40 * 256);  // Descripción
            sheet.setColumnWidth(3, 15 * 256);  // Categoría
            sheet.setColumnWidth(4, 20 * 256);  // Sector Almacenamiento
            sheet.setColumnWidth(5, 15 * 256);  // Stock Actual
            sheet.setColumnWidth(6, 15 * 256);  // Stock Mínimo
            sheet.setColumnWidth(7, 15 * 256);  // Precio
            sheet.setColumnWidth(8, 20 * 256);  // Código de Barras
            sheet.setColumnWidth(9, 20 * 256);  // Código Personalizado
            sheet.setColumnWidth(10, 15 * 256); // Estado

            // Convertir a bytes
            try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
                workbook.write(outputStream);
                return outputStream.toByteArray();
            }
        }
    }

    /**
     * Crea el estilo para los encabezados
     */
    private CellStyle crearEstiloEncabezado(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }

    /**
     * Crea el estilo para el título
     */
    private CellStyle crearEstiloTitulo(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 16);
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }

    /**
     * Crea el estilo para la fecha
     */
    private CellStyle crearEstiloFecha(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setItalic(true);
        style.setFont(font);
        return style;
    }

    /**
     * Crea el estilo para números
     */
    private CellStyle crearEstiloNumero(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }

    /**
     * Crea el estilo para moneda
     */
    private CellStyle crearEstiloMoneda(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setDataFormat(workbook.createDataFormat().getFormat("$#,##0.00"));
        style.setAlignment(HorizontalAlignment.RIGHT);
        return style;
    }

    /**
     * Crea el estilo para instrucciones
     */
    private CellStyle crearEstiloInstrucciones(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setItalic(true);
        font.setColor(IndexedColors.DARK_RED.getIndex());
        style.setFont(font);
        return style;
    }

    /**
     * Crea el estilo para ejemplos
     */
    private CellStyle crearEstiloEjemplo(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setColor(IndexedColors.GREY_50_PERCENT.getIndex());
        style.setFont(font);
        return style;
    }

    /**
     * Agrega información adicional al final de la plantilla
     */
    private void agregarInformacionAdicional(Sheet sheet, int startRow) {
        // Línea en blanco
        sheet.createRow(startRow);
        
        // Título de información adicional
        Row infoTitleRow = sheet.createRow(startRow + 1);
        Cell infoTitleCell = infoTitleRow.createCell(0);
        infoTitleCell.setCellValue("INFORMACIÓN ADICIONAL");
        infoTitleCell.setCellStyle(crearEstiloTitulo(sheet.getWorkbook()));
        sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(startRow + 1, startRow + 1, 0, 5));

        // Campos obligatorios
        Row obligatoriosRow = sheet.createRow(startRow + 3);
        obligatoriosRow.createCell(0).setCellValue("Campos obligatorios (*):");
        obligatoriosRow.createCell(1).setCellValue("Nombre, Stock Actual, Precio");

        // Estados válidos
        Row estadosRow = sheet.createRow(startRow + 4);
        estadosRow.createCell(0).setCellValue("Estados válidos:");
        estadosRow.createCell(1).setCellValue("Activo, Inactivo (por defecto: Activo)");

        // Formato de precio
        Row precioRow = sheet.createRow(startRow + 5);
        precioRow.createCell(0).setCellValue("Formato de precio:");
        precioRow.createCell(1).setCellValue("Números decimales (ej: 299.99)");

        // Formato de stock
        Row stockRow = sheet.createRow(startRow + 6);
        stockRow.createCell(0).setCellValue("Formato de stock:");
        stockRow.createCell(1).setCellValue("Números enteros (ej: 50)");

        // Notas importantes
        Row notasRow = sheet.createRow(startRow + 8);
        Cell notasCell = notasRow.createCell(0);
        notasCell.setCellValue("NOTAS IMPORTANTES:");
        notasCell.setCellStyle(crearEstiloInstrucciones(sheet.getWorkbook()));

        Row nota1Row = sheet.createRow(startRow + 9);
        nota1Row.createCell(0).setCellValue("• No modifique los encabezados de las columnas");
        nota1Row.createCell(1).setCellValue("• No agregue filas antes de la fila 6 (encabezados)");

        Row nota2Row = sheet.createRow(startRow + 10);
        nota2Row.createCell(0).setCellValue("• Los productos con el mismo código de barras se actualizarán");
        nota2Row.createCell(1).setCellValue("• Los productos con el mismo código personalizado se actualizarán");

        Row nota3Row = sheet.createRow(startRow + 11);
        nota3Row.createCell(0).setCellValue("• Guarde el archivo como .xlsx antes de importar");
        nota3Row.createCell(1).setCellValue("• Elimine las filas de ejemplo antes de importar");
    }
}
