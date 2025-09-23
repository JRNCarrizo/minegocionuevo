package com.minegocio.backend.servicios;

import com.minegocio.backend.entidades.Producto;
import com.minegocio.backend.entidades.HistorialInventario;
import com.minegocio.backend.entidades.HistorialInventario.TipoOperacion;
import com.minegocio.backend.entidades.Usuario;
import com.minegocio.backend.repositorios.ProductoRepository;
import com.minegocio.backend.repositorios.HistorialInventarioRepository;
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
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReporteDiferenciasInventarioService {

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private HistorialInventarioRepository historialInventarioRepository;

    /**
     * Genera un reporte de diferencias de inventario del día para una empresa
     */
    public byte[] generarReporteDiferenciasDia(Long empresaId, LocalDate fecha) throws IOException {
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Reporte de Diferencias");

            // Crear estilos
            CellStyle headerStyle = crearEstiloEncabezado(workbook);
            CellStyle titleStyle = crearEstiloTitulo(workbook);
            CellStyle dateStyle = crearEstiloFecha(workbook);
            CellStyle numberStyle = crearEstiloNumero(workbook);
            CellStyle currencyStyle = crearEstiloMoneda(workbook);
            CellStyle positiveStyle = crearEstiloPositivo(workbook);
            CellStyle negativeStyle = crearEstiloNegativo(workbook);

            // Título del reporte
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("REPORTE DE DIFERENCIAS DE INVENTARIO - " + fecha.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 0, 11));

            // Fecha de generación
            Row dateRow = sheet.createRow(1);
            Cell dateCell = dateRow.createCell(0);
            dateCell.setCellValue("Fecha de generación: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss")));
            dateCell.setCellStyle(dateStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(1, 1, 0, 11));

            // Línea en blanco
            sheet.createRow(2);

            // Obtener operaciones del día
            List<HistorialInventario> operacionesDia = historialInventarioRepository
                .findByEmpresaIdAndFechaOperacionBetween(
                    empresaId,
                    fecha.atStartOfDay(),
                    fecha.atTime(23, 59, 59)
                );

            // Agrupar operaciones por producto
            Map<Long, List<HistorialInventario>> operacionesPorProducto = operacionesDia.stream()
                .collect(Collectors.groupingBy(op -> op.getProducto().getId()));

            // Obtener todos los productos de la empresa
            List<Producto> productos = productoRepository.findByEmpresaId(empresaId);

            // Encabezados
            Row headerRow = sheet.createRow(3);
            String[] headers = {
                "Producto", "Marca", "Categoría", "Stock Inicial", "Stock Final", 
                "Entradas", "Salidas", "Diferencia", "Valor Diferencia", 
                "Tipo Operación", "Usuario", "Hora"
            };

            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Llenar datos
            int rowNum = 4;
            BigDecimal valorTotalDiferencias = BigDecimal.ZERO;
            int productosConDiferencias = 0;

            for (Producto producto : productos) {
                List<HistorialInventario> operacionesProducto = operacionesPorProducto.get(producto.getId());
                
                if (operacionesProducto != null && !operacionesProducto.isEmpty()) {
                    // Calcular diferencias del día
                    int entradas = 0;
                    int salidas = 0;
                    BigDecimal valorEntradas = BigDecimal.ZERO;
                    BigDecimal valorSalidas = BigDecimal.ZERO;

                    for (HistorialInventario operacion : operacionesProducto) {
                        if (TipoOperacion.INCREMENTO.equals(operacion.getTipoOperacion())) {
                            entradas += operacion.getCantidad();
                            if (producto.getPrecio() != null) {
                                valorEntradas = valorEntradas.add(
                                    producto.getPrecio().multiply(BigDecimal.valueOf(operacion.getCantidad()))
                                );
                            }
                        } else if (TipoOperacion.DECREMENTO.equals(operacion.getTipoOperacion())) {
                            salidas += operacion.getCantidad();
                            if (producto.getPrecio() != null) {
                                valorSalidas = valorSalidas.add(
                                    producto.getPrecio().multiply(BigDecimal.valueOf(operacion.getCantidad()))
                                );
                            }
                        }
                    }

                    int diferencia = entradas - salidas;
                    BigDecimal valorDiferencia = valorEntradas.subtract(valorSalidas);

                    if (diferencia != 0) {
                        productosConDiferencias++;
                        valorTotalDiferencias = valorTotalDiferencias.add(valorDiferencia);
                    }

                    Row row = sheet.createRow(rowNum++);
                    
                    row.createCell(0).setCellValue(producto.getNombre());
                    row.createCell(1).setCellValue(producto.getMarca() != null ? producto.getMarca() : "");
                    row.createCell(2).setCellValue(producto.getCategoria() != null ? producto.getCategoria() : "");
                    
                    // Stock inicial (stock actual - entradas + salidas)
                    int stockInicial = producto.getStock() - entradas + salidas;
                    Cell stockInicialCell = row.createCell(3);
                    stockInicialCell.setCellValue(stockInicial);
                    stockInicialCell.setCellStyle(numberStyle);
                    
                    // Stock final (stock actual)
                    Cell stockFinalCell = row.createCell(4);
                    stockFinalCell.setCellValue(producto.getStock());
                    stockFinalCell.setCellStyle(numberStyle);
                    
                    // Entradas
                    Cell entradasCell = row.createCell(5);
                    entradasCell.setCellValue(entradas);
                    entradasCell.setCellStyle(positiveStyle);
                    
                    // Salidas
                    Cell salidasCell = row.createCell(6);
                    salidasCell.setCellValue(salidas);
                    salidasCell.setCellStyle(negativeStyle);
                    
                    // Diferencia
                    Cell diferenciaCell = row.createCell(7);
                    diferenciaCell.setCellValue(diferencia);
                    if (diferencia > 0) {
                        diferenciaCell.setCellStyle(positiveStyle);
                    } else if (diferencia < 0) {
                        diferenciaCell.setCellStyle(negativeStyle);
                    } else {
                        diferenciaCell.setCellStyle(numberStyle);
                    }
                    
                    // Valor diferencia
                    Cell valorDiferenciaCell = row.createCell(8);
                    if (producto.getPrecio() != null) {
                        valorDiferenciaCell.setCellValue(valorDiferencia.doubleValue());
                        if (valorDiferencia.compareTo(BigDecimal.ZERO) > 0) {
                            valorDiferenciaCell.setCellStyle(positiveStyle);
                        } else if (valorDiferencia.compareTo(BigDecimal.ZERO) < 0) {
                            valorDiferenciaCell.setCellStyle(negativeStyle);
                        } else {
                            valorDiferenciaCell.setCellStyle(currencyStyle);
                        }
                    } else {
                        valorDiferenciaCell.setCellValue("Sin precio");
                    }
                    
                    // Tipo operación (resumen)
                    String tipoOperacion = "";
                    if (entradas > 0 && salidas > 0) {
                        tipoOperacion = "Entrada y Salida";
                    } else if (entradas > 0) {
                        tipoOperacion = "Entrada";
                    } else if (salidas > 0) {
                        tipoOperacion = "Salida";
                    }
                    row.createCell(9).setCellValue(tipoOperacion);
                    
                    // Usuario (último que operó)
                    String ultimoUsuario = "";
                    Usuario ultimoUsuarioObj = operacionesProducto.get(operacionesProducto.size() - 1).getUsuario();
                    if (ultimoUsuarioObj != null) {
                        ultimoUsuario = ultimoUsuarioObj.getNombre() + " " + ultimoUsuarioObj.getApellidos();
                    }
                    row.createCell(10).setCellValue(ultimoUsuario);
                    
                    // Hora (última operación)
                    String ultimaHora = operacionesProducto.get(operacionesProducto.size() - 1).getFechaOperacion()
                        .format(DateTimeFormatter.ofPattern("HH:mm"));
                    row.createCell(11).setCellValue(ultimaHora);
                }
            }

            // Agregar resumen al final
            agregarResumenDiferencias(sheet, productos.size(), productosConDiferencias, valorTotalDiferencias, rowNum + 2);

            // Ajustar ancho de columnas (solo si no estamos en un entorno headless)
            try {
                for (int i = 0; i < headers.length; i++) {
                    sheet.autoSizeColumn(i);
                }
            } catch (Exception e) {
                // Si falla el auto-sizing (entorno headless), establecer anchos fijos
                System.out.println("⚠️ No se pudo auto-ajustar columnas en ReporteDiferenciasInventario, usando anchos fijos: " + e.getMessage());
                for (int i = 0; i < headers.length; i++) {
                    sheet.setColumnWidth(i, 15 * 256); // 15 caracteres por defecto
                }
            }

            // Convertir a bytes
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
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private CellStyle crearEstiloTitulo(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) 16);
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        return style;
    }

    private CellStyle crearEstiloFecha(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setItalic(true);
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        return style;
    }

    private CellStyle crearEstiloNumero(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private CellStyle crearEstiloMoneda(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        style.setDataFormat(workbook.createDataFormat().getFormat("#,##0.00"));
        style.setAlignment(HorizontalAlignment.RIGHT);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private CellStyle crearEstiloPositivo(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setColor(IndexedColors.GREEN.getIndex());
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private CellStyle crearEstiloNegativo(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setColor(IndexedColors.RED.getIndex());
        style.setFont(font);
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        return style;
    }

    private void agregarResumenDiferencias(Sheet sheet, int totalProductos, int productosConDiferencias, 
                                         BigDecimal valorTotalDiferencias, int startRow) {
        // Título del resumen
        Row resumenTitleRow = sheet.createRow(startRow);
        Cell resumenTitleCell = resumenTitleRow.createCell(0);
        resumenTitleCell.setCellValue("RESUMEN DEL DÍA");
        Font titleFont = sheet.getWorkbook().createFont();
        titleFont.setBold(true);
        titleFont.setFontHeightInPoints((short) 14);
        CellStyle titleStyle = sheet.getWorkbook().createCellStyle();
        titleStyle.setFont(titleFont);
        resumenTitleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(startRow, startRow, 0, 11));

        // Datos del resumen
        Row resumenRow1 = sheet.createRow(startRow + 1);
        resumenRow1.createCell(0).setCellValue("Total de productos operados:");
        resumenRow1.createCell(1).setCellValue(totalProductos);

        Row resumenRow2 = sheet.createRow(startRow + 2);
        resumenRow2.createCell(0).setCellValue("Productos con diferencias:");
        resumenRow2.createCell(1).setCellValue(productosConDiferencias);

        Row resumenRow3 = sheet.createRow(startRow + 3);
        resumenRow3.createCell(0).setCellValue("Valor total de diferencias:");
        Cell valorCell = resumenRow3.createCell(1);
        valorCell.setCellValue(valorTotalDiferencias.doubleValue());
        CellStyle currencyStyle = sheet.getWorkbook().createCellStyle();
        currencyStyle.setDataFormat(sheet.getWorkbook().createDataFormat().getFormat("#,##0.00"));
        if (valorTotalDiferencias.compareTo(BigDecimal.ZERO) > 0) {
            Font font = sheet.getWorkbook().createFont();
            font.setColor(IndexedColors.GREEN.getIndex());
            currencyStyle.setFont(font);
        } else if (valorTotalDiferencias.compareTo(BigDecimal.ZERO) < 0) {
            Font font = sheet.getWorkbook().createFont();
            font.setColor(IndexedColors.RED.getIndex());
            currencyStyle.setFont(font);
        }
        valorCell.setCellStyle(currencyStyle);

        Row resumenRow4 = sheet.createRow(startRow + 4);
        resumenRow4.createCell(0).setCellValue("Porcentaje de productos con diferencias:");
        double porcentaje = totalProductos > 0 ? (productosConDiferencias * 100.0 / totalProductos) : 0;
        resumenRow4.createCell(1).setCellValue(String.format("%.1f%%", porcentaje));
    }
}
