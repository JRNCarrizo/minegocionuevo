package com.minegocio.backend.servicios;

import com.minegocio.backend.dto.RoturaPerdidaDTO;
import com.minegocio.backend.dto.RoturaPerdidaResponseDTO;
import com.minegocio.backend.entidades.*;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.ProductoRepository;
import com.minegocio.backend.repositorios.RoturaPerdidaRepository;
import com.minegocio.backend.repositorios.UsuarioRepository;
import com.minegocio.backend.servicios.StockSincronizacionService;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class RoturaPerdidaService {

    @Autowired
    private RoturaPerdidaRepository roturaPerdidaRepository;

    @Autowired
    private EmpresaRepository empresaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ProductoRepository productoRepository;
    
    @Autowired
    private StockSincronizacionService stockSincronizacionService;

    /**
     * Crear una nueva rotura o pérdida
     */
    @Transactional
    public RoturaPerdida crearRoturaPerdida(RoturaPerdidaDTO dto, Long empresaId, Long usuarioId) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));



        // Parsear la fecha string a LocalDateTime y guardar la fecha exacta del usuario
        LocalDateTime fechaPlanilla;
        if (dto.getFecha() != null) {
            // Parsear la fecha ISO string a LocalDateTime
            String fechaString = dto.getFecha();
            System.out.println("📋 [SERVICE] Fecha string original: " + fechaString);
            
            if (fechaString.endsWith("Z")) {
                fechaString = fechaString.substring(0, fechaString.length() - 1);
                System.out.println("📋 [SERVICE] Fecha string después de remover Z: " + fechaString);
            }
            
            // Intentar parsear con diferentes formatos
            try {
                fechaPlanilla = LocalDateTime.parse(fechaString, DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"));
            } catch (Exception e1) {
                try {
                    // Intentar con formato que incluye milisegundos
                    fechaPlanilla = LocalDateTime.parse(fechaString, DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS"));
                } catch (Exception e2) {
                    // Intentar con formato ISO estándar
                    fechaPlanilla = LocalDateTime.parse(fechaString);
                }
            }
            System.out.println("📋 [SERVICE] Fecha parseada como LocalDateTime: " + fechaPlanilla);
            System.out.println("📋 [SERVICE] Guardando fecha exacta del usuario (sin conversión UTC)");
        } else {
            fechaPlanilla = LocalDateTime.now();
            System.out.println("📋 [SERVICE] Fecha nula, usando fecha actual: " + fechaPlanilla);
        }
        RoturaPerdida roturaPerdida = new RoturaPerdida(empresa, usuario, fechaPlanilla, dto.getCantidad());
        roturaPerdida.setObservaciones(dto.getObservaciones());
        roturaPerdida.setTransporte(dto.getTransporte());

        // Si se especifica un producto, asociarlo y descontar del stock
        if (dto.getProductoId() != null) {
            Producto producto = productoRepository.findById(dto.getProductoId())
                    .orElse(null);
            if (producto != null) {
                // Validar que hay suficiente stock total disponible (incluyendo sectores)
                Integer stockTotalDisponible = stockSincronizacionService.obtenerStockTotalDisponible(
                    producto.getEmpresa().getId(), 
                    producto.getId()
                );
                
                if (stockTotalDisponible < dto.getCantidad()) {
                    throw new RuntimeException("Stock insuficiente. Disponible: " + stockTotalDisponible + " unidades");
                }
                
                // Validar que la cantidad sea positiva
                if (dto.getCantidad() <= 0) {
                    throw new RuntimeException("La cantidad debe ser mayor a 0");
                }
                
                // Descontar del stock usando la estrategia híbrida inteligente directamente
                stockSincronizacionService.descontarStockInteligente(
                    producto.getEmpresa().getId(),
                    producto.getId(),
                    dto.getCantidad(),
                    "Rotura/Pérdida desde planilla"
                );
                
                roturaPerdida.setProducto(producto);
                if (dto.getCodigoPersonalizado() == null) {
                    roturaPerdida.setCodigoPersonalizado(producto.getCodigoPersonalizado());
                }
                if (dto.getDescripcionProducto() == null) {
                    roturaPerdida.setDescripcionProducto(producto.getNombre());
                }
            }
        } else {
            // Producto no registrado
            roturaPerdida.setDescripcionProducto(dto.getDescripcionProducto());
            roturaPerdida.setCodigoPersonalizado(dto.getCodigoPersonalizado());
        }

        return roturaPerdidaRepository.save(roturaPerdida);
    }

    /**
     * Obtener todas las roturas y pérdidas de una empresa
     */
    public List<RoturaPerdidaResponseDTO> obtenerRoturasPerdidasPorEmpresa(Long empresaId) {
        List<RoturaPerdida> roturasPerdidas = roturaPerdidaRepository.findByEmpresaIdOrderByFechaDesc(empresaId);
        
        return roturasPerdidas.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtener roturas y pérdidas por empresa y fecha
     */
    public List<RoturaPerdidaResponseDTO> obtenerRoturasPerdidasPorEmpresaYFecha(Long empresaId, LocalDate fecha) {
        List<RoturaPerdida> roturasPerdidas = roturaPerdidaRepository.findByEmpresaIdAndFechaOrderByFechaCreacionDesc(empresaId, fecha);
        
        return roturasPerdidas.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtener roturas y pérdidas por empresa y rango de fechas
     */
    public List<RoturaPerdidaResponseDTO> obtenerRoturasPerdidasPorEmpresaYRangoFechas(Long empresaId, LocalDate fechaInicio, LocalDate fechaFin) {
        // Convertir LocalDate a LocalDateTime para la consulta
        LocalDateTime fechaInicioDateTime = fechaInicio.atStartOfDay();
        LocalDateTime fechaFinDateTime = fechaFin.atTime(23, 59, 59);
        
        List<RoturaPerdida> roturasPerdidas = roturaPerdidaRepository.findByEmpresaIdAndFechaBetweenOrderByFechaDesc(empresaId, fechaInicioDateTime, fechaFinDateTime);
        
        return roturasPerdidas.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }

    /**
     * Obtener rotura/pérdida por ID
     */
    public Optional<RoturaPerdida> obtenerRoturaPerdidaPorId(Long id) {
        return roturaPerdidaRepository.findById(id);
    }

    /**
     * Actualizar rotura/pérdida
     */
    public RoturaPerdida actualizarRoturaPerdida(Long id, RoturaPerdidaDTO dto) {
        RoturaPerdida roturaPerdida = roturaPerdidaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rotura/Pérdida no encontrada"));

        // Parsear la fecha string a LocalDateTime
        LocalDateTime fechaPlanilla;
        if (dto.getFecha() != null) {
            String fechaString = dto.getFecha();
            if (fechaString.endsWith("Z")) {
                fechaString = fechaString.substring(0, fechaString.length() - 1);
            }
            // Intentar parsear con diferentes formatos
            try {
                fechaPlanilla = LocalDateTime.parse(fechaString, DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"));
            } catch (Exception e1) {
                try {
                    // Intentar con formato que incluye milisegundos
                    fechaPlanilla = LocalDateTime.parse(fechaString, DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS"));
                } catch (Exception e2) {
                    // Intentar con formato ISO estándar
                    fechaPlanilla = LocalDateTime.parse(fechaString);
                }
            }
        } else {
            fechaPlanilla = LocalDateTime.now();
        }
        roturaPerdida.setFecha(fechaPlanilla);
        roturaPerdida.setCantidad(dto.getCantidad());
        roturaPerdida.setObservaciones(dto.getObservaciones());

        // Actualizar información del producto
        if (dto.getProductoId() != null) {
            Producto producto = productoRepository.findById(dto.getProductoId())
                    .orElse(null);
            if (producto != null) {
                roturaPerdida.setProducto(producto);
                if (dto.getCodigoPersonalizado() == null) {
                    roturaPerdida.setCodigoPersonalizado(producto.getCodigoPersonalizado());
                }
                if (dto.getDescripcionProducto() == null) {
                    roturaPerdida.setDescripcionProducto(producto.getNombre());
                }
            }
        } else {
            roturaPerdida.setProducto(null);
            roturaPerdida.setDescripcionProducto(dto.getDescripcionProducto());
            roturaPerdida.setCodigoPersonalizado(dto.getCodigoPersonalizado());
        }

        return roturaPerdidaRepository.save(roturaPerdida);
    }

    /**
     * Eliminar rotura/pérdida
     */
    @Transactional
    public void eliminarRoturaPerdida(Long id) {
        RoturaPerdida roturaPerdida = roturaPerdidaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Rotura/Pérdida no encontrada"));
        
        // Si tiene un producto asociado, restaurar el stock usando sincronización automática
        if (roturaPerdida.getProducto() != null) {
            Producto producto = roturaPerdida.getProducto();
            Integer stockAnterior = producto.getStock();
            Integer nuevoStock = stockAnterior + roturaPerdida.getCantidad();
            
            // Usar la sincronización automática que actualiza tanto el producto como los sectores
            stockSincronizacionService.sincronizarStockConSectores(
                producto.getEmpresa().getId(),
                producto.getId(),
                nuevoStock,
                "Revertir rotura/pérdida desde planilla"
            );
        }
        
        roturaPerdidaRepository.deleteById(id);
    }

    /**
     * Contar roturas y pérdidas por empresa
     */
    public long contarRoturasPerdidasPorEmpresa(Long empresaId) {
        return roturaPerdidaRepository.countByEmpresaId(empresaId);
    }

    /**
     * Contar roturas y pérdidas por empresa y fecha
     */
    public long contarRoturasPerdidasPorEmpresaYFecha(Long empresaId, LocalDate fecha) {
        return roturaPerdidaRepository.countByEmpresaIdAndFecha(empresaId, fecha);
    }

    /**
     * Obtener total de unidades perdidas por empresa y fecha
     */
    public Integer obtenerTotalUnidadesPerdidasPorEmpresaYFecha(Long empresaId, LocalDate fecha) {
        return roturaPerdidaRepository.sumCantidadByEmpresaIdAndFecha(empresaId, fecha);
    }

    /**
     * Obtener total de unidades perdidas por empresa y rango de fechas
     */
    public Integer obtenerTotalUnidadesPerdidasPorEmpresaYRangoFechas(Long empresaId, LocalDate fechaInicio, LocalDate fechaFin) {
        // Convertir LocalDate a LocalDateTime para la consulta
        LocalDateTime fechaInicioDateTime = fechaInicio.atStartOfDay();
        LocalDateTime fechaFinDateTime = fechaFin.atTime(23, 59, 59);
        return roturaPerdidaRepository.sumCantidadByEmpresaIdAndFechaBetween(empresaId, fechaInicioDateTime, fechaFinDateTime);
    }

    /**
     * Exportar roturas y pérdidas a Excel
     */
    public byte[] exportarRoturasPerdidasAExcel(Long empresaId, LocalDate fechaInicio, LocalDate fechaFin) throws IOException {
        // Convertir LocalDate a LocalDateTime para la consulta
        LocalDateTime fechaInicioDateTime = fechaInicio.atStartOfDay();
        LocalDateTime fechaFinDateTime = fechaFin.atTime(23, 59, 59);
        
        List<RoturaPerdida> roturasPerdidas = roturaPerdidaRepository.findByEmpresaIdAndFechaBetweenOrderByFechaDesc(empresaId, fechaInicioDateTime, fechaFinDateTime);
        
        if (roturasPerdidas.isEmpty()) {
            throw new RuntimeException("No hay datos para exportar en el rango de fechas especificado");
        }

        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        // Crear el workbook de Excel
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Roturas y Pérdidas");

            // Crear estilos
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.RED.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBorderLeft(BorderStyle.THIN);
            dataStyle.setBorderRight(BorderStyle.THIN);

            // Crear encabezado de información
            int rowNum = 0;
            
            // Título principal
            Row titleRow = sheet.createRow(rowNum++);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("REPORTE DE ROTURAS Y PÉRDIDAS");
            titleCell.setCellStyle(headerStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 0, 4));

            // Información del reporte
            rowNum++;
            Row infoRow1 = sheet.createRow(rowNum++);
            infoRow1.createCell(0).setCellValue("Empresa:");
            infoRow1.createCell(1).setCellValue(empresa.getNombre());
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowNum-1, rowNum-1, 1, 4));

            Row infoRow2 = sheet.createRow(rowNum++);
            infoRow2.createCell(0).setCellValue("Período:");
            infoRow2.createCell(1).setCellValue("Del " + fechaInicio.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) + 
                                               " al " + fechaFin.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowNum-1, rowNum-1, 1, 4));

            // Estadísticas (en la misma columna que empresa y período)
            int totalProductos = roturasPerdidas.size();
            int totalUnidades = roturaPerdidaRepository.sumCantidadByEmpresaIdAndFechaBetween(empresaId, fechaInicioDateTime, fechaFinDateTime);

            Row infoRow3 = sheet.createRow(rowNum++);
            Cell cell3 = infoRow3.createCell(0);
            cell3.setCellValue("Total de Productos Afectados:");
            Cell cell3Value = infoRow3.createCell(1);
            cell3Value.setCellValue(totalProductos);
            CellStyle leftAlignStyle = workbook.createCellStyle();
            leftAlignStyle.setAlignment(HorizontalAlignment.LEFT);
            cell3Value.setCellStyle(leftAlignStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowNum-1, rowNum-1, 1, 4));

            Row infoRow4 = sheet.createRow(rowNum++);
            Cell cell4 = infoRow4.createCell(0);
            cell4.setCellValue("Total de Unidades Perdidas:");
            Cell cell4Value = infoRow4.createCell(1);
            cell4Value.setCellValue(totalUnidades);
            cell4Value.setCellStyle(leftAlignStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowNum-1, rowNum-1, 1, 4));

            // Línea en blanco
            rowNum++;

            // Encabezados de la tabla
            Row headerRow = sheet.createRow(rowNum++);
            String[] headers = {"#", "Fecha", "Código Interno", "Nombre del Producto", "Cantidad", "Observaciones"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Datos de las roturas y pérdidas
            for (int i = 0; i < roturasPerdidas.size(); i++) {
                RoturaPerdida roturaPerdida = roturasPerdidas.get(i);
                Row dataRow = sheet.createRow(rowNum++);
                
                dataRow.createCell(0).setCellValue(i + 1);
                dataRow.createCell(1).setCellValue(roturaPerdida.getFecha().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
                dataRow.createCell(2).setCellValue(roturaPerdida.getCodigoCompleto());
                dataRow.createCell(3).setCellValue(roturaPerdida.getDescripcionCompleta());
                dataRow.createCell(4).setCellValue(roturaPerdida.getCantidad());
                dataRow.createCell(5).setCellValue(roturaPerdida.getObservaciones() != null ? roturaPerdida.getObservaciones() : "");
                
                // Aplicar estilo a todas las celdas
                for (int j = 0; j < 6; j++) {
                    dataRow.getCell(j).setCellStyle(dataStyle);
                }
            }

            // Ajustar ancho de columnas
            sheet.setColumnWidth(0, 1000);  // #
            sheet.setColumnWidth(1, 4000);  // Fecha
            sheet.setColumnWidth(2, 6000);  // Código Interno
            sheet.setColumnWidth(3, 20000); // Nombre del Producto
            sheet.setColumnWidth(4, 4000);  // Cantidad
            sheet.setColumnWidth(5, 12000); // Observaciones

            // Convertir a bytes
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        }
    }

    /**
     * Exportar roturas y pérdidas del día actual a Excel
     */
    public byte[] exportarRoturasPerdidasDelDiaAExcel(Long empresaId, LocalDate fecha) throws IOException {
        List<RoturaPerdida> roturasPerdidas = roturaPerdidaRepository.findByEmpresaIdAndFechaOrderByFechaCreacionDesc(empresaId, fecha);
        
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        // Crear el workbook de Excel
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Roturas y Pérdidas del Día");

            // Crear estilos
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.RED.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);

            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBorderLeft(BorderStyle.THIN);
            dataStyle.setBorderRight(BorderStyle.THIN);

            // Crear encabezado de información
            int rowNum = 0;
            
            // Título principal
            Row titleRow = sheet.createRow(rowNum++);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("REPORTE DE ROTURAS Y PÉRDIDAS DEL DÍA");
            titleCell.setCellStyle(headerStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 0, 5));

            // Información del reporte
            rowNum++;
            Row infoRow1 = sheet.createRow(rowNum++);
            infoRow1.createCell(0).setCellValue("Empresa:");
            infoRow1.createCell(1).setCellValue(empresa.getNombre());
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowNum-1, rowNum-1, 1, 5));

            Row infoRow2 = sheet.createRow(rowNum++);
            infoRow2.createCell(0).setCellValue("Fecha:");
            infoRow2.createCell(1).setCellValue(fecha.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowNum-1, rowNum-1, 1, 5));

            // Estadísticas (en la misma columna que empresa y fecha)
            int totalProductos = roturasPerdidas.size();
            int totalUnidades = roturaPerdidaRepository.sumCantidadByEmpresaIdAndFecha(empresaId, fecha);

            Row infoRow3 = sheet.createRow(rowNum++);
            Cell cell3 = infoRow3.createCell(0);
            cell3.setCellValue("Total de Productos Afectados:");
            Cell cell3Value = infoRow3.createCell(1);
            cell3Value.setCellValue(totalProductos);
            CellStyle leftAlignStyle = workbook.createCellStyle();
            leftAlignStyle.setAlignment(HorizontalAlignment.LEFT);
            cell3Value.setCellStyle(leftAlignStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowNum-1, rowNum-1, 1, 5));

            Row infoRow4 = sheet.createRow(rowNum++);
            Cell cell4 = infoRow4.createCell(0);
            cell4.setCellValue("Total de Unidades Perdidas:");
            Cell cell4Value = infoRow4.createCell(1);
            cell4Value.setCellValue(totalUnidades);
            cell4Value.setCellStyle(leftAlignStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowNum-1, rowNum-1, 1, 5));

            // Línea en blanco
            rowNum++;

            // Encabezados de la tabla
            Row headerRow = sheet.createRow(rowNum++);
            String[] headers = {"#", "Hora", "Código Interno", "Nombre del Producto", "Cantidad", "Observaciones"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Datos de las roturas y pérdidas
            for (int i = 0; i < roturasPerdidas.size(); i++) {
                RoturaPerdida roturaPerdida = roturasPerdidas.get(i);
                Row dataRow = sheet.createRow(rowNum++);
                
                dataRow.createCell(0).setCellValue(i + 1);
                dataRow.createCell(1).setCellValue(roturaPerdida.getFechaCreacion().format(DateTimeFormatter.ofPattern("HH:mm:ss")));
                dataRow.createCell(2).setCellValue(roturaPerdida.getCodigoCompleto());
                dataRow.createCell(3).setCellValue(roturaPerdida.getDescripcionCompleta());
                dataRow.createCell(4).setCellValue(roturaPerdida.getCantidad());
                dataRow.createCell(5).setCellValue(roturaPerdida.getObservaciones() != null ? roturaPerdida.getObservaciones() : "");
                
                // Aplicar estilo a todas las celdas
                for (int j = 0; j < 6; j++) {
                    dataRow.getCell(j).setCellStyle(dataStyle);
                }
            }

            // Ajustar ancho de columnas
            sheet.setColumnWidth(0, 1000);  // #
            sheet.setColumnWidth(1, 4000);  // Hora
            sheet.setColumnWidth(2, 6000);  // Código Interno
            sheet.setColumnWidth(3, 20000); // Nombre del Producto
            sheet.setColumnWidth(4, 4000);  // Cantidad
            sheet.setColumnWidth(5, 12000); // Observaciones

            // Convertir a bytes
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        }
    }

    /**
     * Convertir entidad a DTO de respuesta
     */
    public RoturaPerdidaResponseDTO convertirADTO(RoturaPerdida roturaPerdida) {
        RoturaPerdidaResponseDTO dto = new RoturaPerdidaResponseDTO();
        dto.setId(roturaPerdida.getId());
        dto.setFecha(roturaPerdida.getFecha().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")));
        dto.setCantidad(roturaPerdida.getCantidad());
        dto.setObservaciones(roturaPerdida.getObservaciones());
        dto.setTransporte(roturaPerdida.getTransporte());
        dto.setDescripcionProducto(roturaPerdida.getDescripcionProducto());
        dto.setCodigoPersonalizado(roturaPerdida.getCodigoPersonalizado());
        dto.setNombreUsuario(roturaPerdida.getUsuario().getNombre());
        dto.setFechaCreacion(roturaPerdida.getFechaCreacion());
        dto.setFechaActualizacion(roturaPerdida.getFechaActualizacion());

        // Información del producto si está asociado
        if (roturaPerdida.getProducto() != null) {
            dto.setProductoId(roturaPerdida.getProducto().getId());
            dto.setNombreProducto(roturaPerdida.getProducto().getNombre());
            dto.setCodigoProducto(roturaPerdida.getProducto().getCodigoPersonalizado());
        }

        return dto;
    }

    /**
     * Convertir fecha de la zona horaria del usuario a UTC
     */
    private LocalDateTime convertirFechaUsuarioAUTC(LocalDateTime fechaUsuario, String zonaHorariaUsuario) {
        try {
            // Si no se especifica zona horaria, usar UTC
            if (zonaHorariaUsuario == null || zonaHorariaUsuario.trim().isEmpty()) {
                return fechaUsuario;
            }

            // Crear ZonedDateTime en la zona horaria del usuario
            ZoneId zonaUsuario = ZoneId.of(zonaHorariaUsuario);
            ZonedDateTime fechaZonada = fechaUsuario.atZone(zonaUsuario);

            // Convertir a UTC
            ZonedDateTime fechaUTC = fechaZonada.withZoneSameInstant(ZoneId.of("UTC"));

            // Retornar como LocalDateTime
            return fechaUTC.toLocalDateTime();
        } catch (Exception e) {
            // Si hay error en la conversión, usar la fecha original
            System.out.println("⚠️ Error al convertir zona horaria '" + zonaHorariaUsuario + "': " + e.getMessage());
            return fechaUsuario;
        }
    }

    /**
     * Convertir fecha UTC a la zona horaria del usuario
     */
    private LocalDateTime convertirFechaUTCAUsuario(LocalDateTime fechaUTC, String zonaHorariaUsuario) {
        try {
            // Si no se especifica zona horaria, usar UTC
            if (zonaHorariaUsuario == null || zonaHorariaUsuario.trim().isEmpty()) {
                return fechaUTC;
            }

            // Crear ZonedDateTime en UTC
            ZonedDateTime fechaZonadaUTC = fechaUTC.atZone(ZoneId.of("UTC"));

            // Convertir a la zona horaria del usuario
            ZoneId zonaUsuario = ZoneId.of(zonaHorariaUsuario);
            ZonedDateTime fechaUsuario = fechaZonadaUTC.withZoneSameInstant(zonaUsuario);

            // Retornar como LocalDateTime
            return fechaUsuario.toLocalDateTime();
        } catch (Exception e) {
            // Si hay error en la conversión, usar la fecha original
            System.out.println("⚠️ Error al convertir zona horaria '" + zonaHorariaUsuario + "': " + e.getMessage());
            return fechaUTC;
        }
    }
}

