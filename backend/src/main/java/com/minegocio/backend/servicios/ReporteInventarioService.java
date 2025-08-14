package com.minegocio.backend.servicios;

import com.minegocio.backend.entidades.Producto;
import com.minegocio.backend.repositorios.ProductoRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class ReporteInventarioService {

    @Autowired
    private ProductoRepository productoRepository;

    /**
     * Genera un reporte de inventario del día para una empresa
     */
    public byte[] generarReporteInventarioDia(Long empresaId, LocalDate fecha) throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Reporte de Inventario");

            // Crear estilos
            CellStyle headerStyle = crearEstiloEncabezado(workbook);
            CellStyle titleStyle = crearEstiloTitulo(workbook);
            CellStyle dateStyle = crearEstiloFecha(workbook);
            CellStyle numberStyle = crearEstiloNumero(workbook);
            CellStyle currencyStyle = crearEstiloMoneda(workbook);

            // Título del reporte
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("REPORTE DE INVENTARIO - " + fecha.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 0, 9));

            // Fecha de generación
            Row dateRow = sheet.createRow(1);
            Cell dateCell = dateRow.createCell(0);
            dateCell.setCellValue("Fecha de generación: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")));
            dateCell.setCellStyle(dateStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(1, 1, 0, 9));

            // Línea en blanco
            sheet.createRow(2);

            // Encabezados
            Row headerRow = sheet.createRow(3);
            String[] headers = {
                "Nombre", "Marca", "Descripción", "Categoría", 
                "Sector Almacenamiento", "Stock Actual", "Stock Mínimo", 
                "Precio", "Código de Barras", "Código Personalizado", "Estado"
            };

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Obtener productos de la empresa
            List<Producto> productos = productoRepository.findByEmpresaId(empresaId);

            // Llenar datos
            int rowNum = 4;
            for (Producto producto : productos) {
                Row row = sheet.createRow(rowNum++);
                
                row.createCell(0).setCellValue(producto.getNombre());
                row.createCell(1).setCellValue(producto.getMarca() != null ? producto.getMarca() : "");
                row.createCell(2).setCellValue(producto.getDescripcion() != null ? producto.getDescripcion() : "");
                row.createCell(3).setCellValue(producto.getCategoria() != null ? producto.getCategoria() : "");
                row.createCell(4).setCellValue(producto.getSectorAlmacenamiento() != null ? producto.getSectorAlmacenamiento() : "");
                
                // Stock actual
                Cell stockCell = row.createCell(5);
                stockCell.setCellValue(producto.getStock());
                stockCell.setCellStyle(numberStyle);
                
                // Stock mínimo
                Cell stockMinCell = row.createCell(6);
                stockMinCell.setCellValue(producto.getStockMinimo() != null ? producto.getStockMinimo() : 0);
                stockMinCell.setCellStyle(numberStyle);
                
                // Precio
                Cell precioCell = row.createCell(7);
                if (producto.getPrecio() != null) {
                    precioCell.setCellValue(producto.getPrecio().doubleValue());
                    precioCell.setCellStyle(currencyStyle);
                } else {
                    precioCell.setCellValue("No especificado");
                }
                
                row.createCell(8).setCellValue(producto.getCodigoBarras() != null ? producto.getCodigoBarras() : "");
                row.createCell(9).setCellValue(producto.getCodigoPersonalizado() != null ? producto.getCodigoPersonalizado() : "");
                row.createCell(10).setCellValue(producto.getActivo() ? "Activo" : "Inactivo");
            }

            // Agregar resumen al final
            agregarResumen(sheet, productos, rowNum + 2);

            // Ajustar ancho de columnas
            for (int i = 0; i < headers.length; i++) {
                sheet.autoSizeColumn(i);
            }

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
     * Agrega un resumen al final del reporte
     */
    private void agregarResumen(Sheet sheet, List<Producto> productos, int startRow) {
        // Línea en blanco
        sheet.createRow(startRow);
        
        // Título del resumen
        Row summaryTitleRow = sheet.createRow(startRow + 1);
        Cell summaryTitleCell = summaryTitleRow.createCell(0);
        summaryTitleCell.setCellValue("RESUMEN DEL INVENTARIO");
        summaryTitleCell.setCellStyle(crearEstiloTitulo(sheet.getWorkbook()));
        sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(startRow + 1, startRow + 1, 0, 5));

        // Estadísticas
        int totalProductos = productos.size();
        int productosActivos = (int) productos.stream().filter(Producto::getActivo).count();
        int productosInactivos = totalProductos - productosActivos;
        int stockTotal = productos.stream().mapToInt(Producto::getStock).sum();
        BigDecimal valorTotal = productos.stream()
            .filter(p -> p.getPrecio() != null)
            .map(p -> p.getPrecio().multiply(BigDecimal.valueOf(p.getStock())))
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Productos con stock bajo (menos del stock mínimo)
        long productosStockBajo = productos.stream()
            .filter(p -> p.getStockMinimo() != null && p.getStock() < p.getStockMinimo())
            .count();

        // Crear filas de resumen
        Row row1 = sheet.createRow(startRow + 3);
        row1.createCell(0).setCellValue("Total de productos:");
        row1.createCell(1).setCellValue(totalProductos);

        Row row2 = sheet.createRow(startRow + 4);
        row2.createCell(0).setCellValue("Productos activos:");
        row2.createCell(1).setCellValue(productosActivos);

        Row row3 = sheet.createRow(startRow + 5);
        row3.createCell(0).setCellValue("Productos inactivos:");
        row3.createCell(1).setCellValue(productosInactivos);

        Row row4 = sheet.createRow(startRow + 6);
        row4.createCell(0).setCellValue("Stock total:");
        row4.createCell(1).setCellValue(stockTotal);

        Row row5 = sheet.createRow(startRow + 7);
        row5.createCell(0).setCellValue("Valor total del inventario:");
        Cell valorCell = row5.createCell(1);
        valorCell.setCellValue(valorTotal.doubleValue());
        valorCell.setCellStyle(crearEstiloMoneda(sheet.getWorkbook()));

        Row row6 = sheet.createRow(startRow + 8);
        row6.createCell(0).setCellValue("Productos con stock bajo:");
        row6.createCell(1).setCellValue(productosStockBajo);

        // Ajustar ancho de las columnas del resumen
        sheet.autoSizeColumn(0);
        sheet.autoSizeColumn(1);
    }
}



