package com.minegocio.backend.servicios;

import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
public class PlantillaCargaMasivaService {

    /**
     * Plantilla mínima: encabezados + filas de ejemplo. La importación detecta la fila de encabezados en las primeras 15 filas.
     */
    public byte[] generarPlantillaCargaMasiva() throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Plantilla Carga Masiva");

            CellStyle headerStyle = crearEstiloEncabezado(workbook);
            CellStyle numberStyle = crearEstiloNumero(workbook);
            CellStyle currencyStyle = crearEstiloMoneda(workbook);

            String[] headers = {
                "Código Personalizado",
                "Nombre*",
                "Marca",
                "Descripción",
                "Categoría",
                "Sector de almacenamiento",
                "Stock Actual*",
                "Precio",
                "Código de Barras"
            };

            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            Row exampleRow = sheet.createRow(1);
            exampleRow.createCell(0).setCellValue("PROD-001");
            exampleRow.createCell(1).setCellValue("Producto Ejemplo");
            exampleRow.createCell(2).setCellValue("Samsung");
            exampleRow.createCell(3).setCellValue("Descripción detallada del producto");
            exampleRow.createCell(4).setCellValue("Electrónicos");
            exampleRow.createCell(5).setCellValue("Depósito A");
            Cell stockCell = exampleRow.createCell(6);
            stockCell.setCellValue(50);
            stockCell.setCellStyle(numberStyle);
            Cell priceCell = exampleRow.createCell(7);
            priceCell.setCellValue(299.99);
            priceCell.setCellStyle(currencyStyle);
            exampleRow.createCell(8).setCellValue("1234567890123");

            Row exampleRow2 = sheet.createRow(2);
            exampleRow2.createCell(0).setCellValue("PROD-002");
            exampleRow2.createCell(1).setCellValue("Otro Producto");
            exampleRow2.createCell(2).setCellValue("Apple");
            exampleRow2.createCell(3).setCellValue("Otro producto de ejemplo");
            exampleRow2.createCell(4).setCellValue("Tecnología");
            exampleRow2.createCell(5).setCellValue("Depósito B");
            Cell stockCell2 = exampleRow2.createCell(6);
            stockCell2.setCellValue(25);
            stockCell2.setCellStyle(numberStyle);
            Cell priceCell2 = exampleRow2.createCell(7);
            priceCell2.setCellValue(599.99);
            priceCell2.setCellStyle(currencyStyle);
            exampleRow2.createCell(8).setCellValue("9876543210987");

            sheet.setColumnWidth(0, 22 * 256);
            sheet.setColumnWidth(1, 30 * 256);
            sheet.setColumnWidth(2, 15 * 256);
            sheet.setColumnWidth(3, 40 * 256);
            sheet.setColumnWidth(4, 15 * 256);
            sheet.setColumnWidth(5, 22 * 256);
            sheet.setColumnWidth(6, 15 * 256);
            sheet.setColumnWidth(7, 15 * 256);
            sheet.setColumnWidth(8, 20 * 256);

            try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
                workbook.write(outputStream);
                return outputStream.toByteArray();
            }
        }
    }

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

    private CellStyle crearEstiloNumero(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }

    private CellStyle crearEstiloMoneda(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setDataFormat(workbook.createDataFormat().getFormat("$#,##0.00"));
        style.setAlignment(HorizontalAlignment.RIGHT);
        return style;
    }
}
