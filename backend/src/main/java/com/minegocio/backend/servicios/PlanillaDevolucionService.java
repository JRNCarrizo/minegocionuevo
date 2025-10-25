package com.minegocio.backend.servicios;

import com.minegocio.backend.dto.DetallePlanillaDevolucionDTO;
import com.minegocio.backend.dto.DetallePlanillaDevolucionResponseDTO;
import com.minegocio.backend.dto.PlanillaDevolucionDTO;
import com.minegocio.backend.dto.PlanillaDevolucionResponseDTO;
import com.minegocio.backend.entidades.*;
import com.minegocio.backend.repositorios.DetallePlanillaDevolucionRepository;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.PlanillaDevolucionRepository;
import com.minegocio.backend.repositorios.ProductoRepository;
import com.minegocio.backend.repositorios.UsuarioRepository;
import com.minegocio.backend.servicios.StockSincronizacionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.io.IOException;
import java.io.ByteArrayOutputStream;

// Imports para Excel
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.ss.util.CellRangeAddress;

@Service
@Transactional
public class PlanillaDevolucionService {

    @Autowired
    private PlanillaDevolucionRepository planillaDevolucionRepository;

    @Autowired
    private DetallePlanillaDevolucionRepository detallePlanillaDevolucionRepository;

    @Autowired
    private EmpresaRepository empresaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ProductoRepository productoRepository;
    
    @Autowired
    private StockSincronizacionService stockSincronizacionService;

    /**
     * Crear una nueva planilla de devolución y SUMAR al stock
     */
    public PlanillaDevolucion crearPlanillaDevolucion(PlanillaDevolucionDTO dto, Long empresaId, Long usuarioId) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        System.out.println("🔄 [DEVOLUCION] Creando planilla de devolución...");
        System.out.println("🔄 [DEVOLUCION] Fecha recibida en DTO: " + dto.getFechaPlanilla());
        System.out.println("🔄 [DEVOLUCION] Zona horaria del usuario: " + dto.getZonaHoraria());
        
        // Guardar la fecha exacta que envía el usuario (sin convertir a UTC)
        LocalDateTime fechaPlanilla = dto.getFechaPlanilla();
        if (fechaPlanilla == null) {
            fechaPlanilla = LocalDateTime.now();
            System.out.println("🔄 [DEVOLUCION] Fecha nula, usando fecha actual: " + fechaPlanilla);
        } else {
            System.out.println("🔄 [DEVOLUCION] Guardando fecha exacta del usuario (sin conversión UTC): " + fechaPlanilla);
        }
        
        PlanillaDevolucion planilla = new PlanillaDevolucion(empresa, usuario, fechaPlanilla);
        planilla.setObservaciones(dto.getObservaciones());
        planilla.setTransporte(dto.getTransporte());

        // Si se proporciona un número de planilla específico, usarlo
        if (dto.getNumeroPlanilla() != null && !dto.getNumeroPlanilla().isEmpty()) {
            planilla.setNumeroPlanilla(dto.getNumeroPlanilla());
        } else {
            // Temporal: generar un valor por defecto para evitar el error de NOT NULL
            // Usar la fecha del usuario para generar el número, no la hora del servidor
            String numeroPlanillaDefault = "DEV" + (fechaPlanilla.getHour() * 100 + fechaPlanilla.getMinute());
            planilla.setNumeroPlanilla(numeroPlanillaDefault);
            System.out.println("🔄 [DEVOLUCION] Usando número de planilla por defecto: " + numeroPlanillaDefault);
        }

        planilla = planillaDevolucionRepository.save(planilla);

        // Calcular el total de productos basándose en los detalles del DTO
        int totalProductos = 0;
        if (dto.getDetalles() != null && !dto.getDetalles().isEmpty()) {
            totalProductos = dto.getDetalles().stream()
                    .mapToInt(DetallePlanillaDevolucionDTO::getCantidad)
                    .sum();
        }
        planilla.setTotalProductos(totalProductos);

        // Agregar detalles si se proporcionan y SUMAR al stock
        if (dto.getDetalles() != null && !dto.getDetalles().isEmpty()) {
            for (DetallePlanillaDevolucionDTO detalleDTO : dto.getDetalles()) {
                DetallePlanillaDevolucion detalle = new DetallePlanillaDevolucion(planilla, detalleDTO.getDescripcion(), detalleDTO.getCantidad());
                detalle.setNumeroPersonalizado(detalleDTO.getNumeroPersonalizado());
                detalle.setObservaciones(detalleDTO.getObservaciones());

                // Establecer el estado del producto
                if (detalleDTO.getEstadoProducto() != null) {
                    try {
                        DetallePlanillaDevolucion.EstadoProducto estado = DetallePlanillaDevolucion.EstadoProducto.valueOf(detalleDTO.getEstadoProducto());
                        detalle.setEstadoProducto(estado);
                        System.out.println("✅ [DEVOLUCION] Estado del producto establecido: " + estado.name());
                    } catch (IllegalArgumentException e) {
                        // Si el estado no es válido, usar BUEN_ESTADO por defecto
                        detalle.setEstadoProducto(DetallePlanillaDevolucion.EstadoProducto.BUEN_ESTADO);
                        System.out.println("⚠️ [DEVOLUCION] Estado inválido, usando BUEN_ESTADO por defecto");
                    } catch (Exception e) {
                        // Si la columna no existe en la base de datos, usar BUEN_ESTADO por defecto
                        System.out.println("⚠️ [DEVOLUCION] Columna estado_producto no disponible, usando BUEN_ESTADO por defecto");
                    }
                } else {
                    detalle.setEstadoProducto(DetallePlanillaDevolucion.EstadoProducto.BUEN_ESTADO);
                    System.out.println("⚠️ [DEVOLUCION] No se especificó estado, usando BUEN_ESTADO por defecto");
                }

                // Si se especifica un producto, asociarlo y SUMAR al stock SOLO si está en buen estado
                if (detalleDTO.getProductoId() != null) {
                    Producto producto = productoRepository.findById(detalleDTO.getProductoId())
                            .orElse(null);
                    if (producto != null) {
                        detalle.setProducto(producto);
                        if (detalle.getNumeroPersonalizado() == null) {
                            detalle.setNumeroPersonalizado(producto.getCodigoPersonalizado());
                        }
                        if (detalle.getDescripcion() == null) {
                            detalle.setDescripcion(producto.getNombre());
                        }
                        
                        // SUMAR al stock SOLO si está en buen estado
                        if (detalle.getEstadoProducto() == DetallePlanillaDevolucion.EstadoProducto.BUEN_ESTADO) {
                            sumarAlStock(producto, detalleDTO.getCantidad());
                            // Guardar la cantidad original que se sumó al stock
                            detalle.setCantidadOriginalStock(detalleDTO.getCantidad());
                            System.out.println("✅ [DEVOLUCION] Sumando al stock (BUEN_ESTADO):");
                            System.out.println("   Producto: " + producto.getNombre());
                            System.out.println("   Cantidad: " + detalleDTO.getCantidad());
                            System.out.println("   Cantidad original guardada: " + detalleDTO.getCantidad());
                        } else {
                            // No se suma al stock, pero guardamos 0 como cantidad original
                            detalle.setCantidadOriginalStock(0);
                            System.out.println("❌ [DEVOLUCION] NO sumando al stock (estado: " + detalle.getEstadoProducto().name() + "):");
                            System.out.println("   Producto: " + producto.getNombre());
                            System.out.println("   Cantidad: " + detalleDTO.getCantidad());
                            System.out.println("   Cantidad original guardada: 0");
                        }
                    }
                } else {
                    // No hay producto asociado, no se suma al stock
                    detalle.setCantidadOriginalStock(0);
                    System.out.println("⚠️ [DEVOLUCION] Producto sin asociar, no se suma al stock:");
                    System.out.println("   Descripción: " + detalle.getDescripcion());
                    System.out.println("   Cantidad: " + detalleDTO.getCantidad());
                    System.out.println("   Cantidad original guardada: 0");
                }

                detallePlanillaDevolucionRepository.save(detalle);
            }
        }

        return planillaDevolucionRepository.save(planilla);
    }

    /**
     * SUMAR cantidad al stock de un producto (para devoluciones) directamente
     */
    private void sumarAlStock(Producto producto, Integer cantidad) {
        if (producto.getStock() != null && cantidad != null) {
            int stockAnterior = producto.getStock();
            int nuevoStock = producto.getStock() + cantidad;
            
            System.out.println("🔄 [DEVOLUCION] Sumando al stock:");
            System.out.println("   Producto: " + producto.getNombre());
            System.out.println("   Stock anterior: " + stockAnterior);
            System.out.println("   Cantidad a sumar: " + cantidad);
            System.out.println("   Nuevo stock: " + nuevoStock);
            
            // Sumar directamente al stock del producto (sin afectar sectores)
            producto.setStock(nuevoStock);
            productoRepository.save(producto);
            
            System.out.println("✅ [DEVOLUCION] Stock actualizado exitosamente: " + stockAnterior + " + " + cantidad + " = " + nuevoStock);
        }
    }

    /**
     * Obtener todas las planillas de devolución de una empresa
     */
    public List<PlanillaDevolucionResponseDTO> obtenerPlanillasDevolucionPorEmpresa(Long empresaId) {
        System.out.println("🔍 [DEVOLUCION] Buscando planillas para empresa ID: " + empresaId);
        List<PlanillaDevolucion> planillas = planillaDevolucionRepository.findByEmpresaIdOrderByFechaPlanillaDesc(empresaId);
        System.out.println("🔍 [DEVOLUCION] Planillas encontradas: " + planillas.size());
        
        List<PlanillaDevolucionResponseDTO> result = planillas.stream().map(planilla -> {
            System.out.println("🔍 [DEVOLUCION] Procesando planilla ID: " + planilla.getId());
            // Cargar los detalles para cada planilla
            List<DetallePlanillaDevolucion> detalles = detallePlanillaDevolucionRepository.findByPlanillaDevolucionIdOrderByFechaCreacionAsc(planilla.getId());
            System.out.println("🔍 [DEVOLUCION] Detalles encontrados para planilla " + planilla.getId() + ": " + detalles.size());
            
            // Convertir detalles a DTOs
            List<DetallePlanillaDevolucionResponseDTO> detallesDTO = detalles.stream()
                .map(detalle -> {
                    String estadoProducto = "BUEN_ESTADO"; // Valor por defecto
                    try {
                        estadoProducto = detalle.getEstadoProducto().name();
                    } catch (Exception e) {
                        // Si la columna no existe en la base de datos, usar valor por defecto
                        System.out.println("⚠️ [DEVOLUCION] Columna estado_producto no disponible, usando valor por defecto");
                    }
                    
                    return new DetallePlanillaDevolucionResponseDTO(
                        detalle.getId(),
                        detalle.getNumeroPersonalizado(),
                        detalle.getDescripcion(),
                        detalle.getCantidad(),
                        detalle.getObservaciones(),
                        estadoProducto,
                        detalle.getFechaCreacion()
                    );
                })
                .collect(Collectors.toList());
            
            return new PlanillaDevolucionResponseDTO(
                planilla.getId(),
                planilla.getNumeroPlanilla(),
                planilla.getObservaciones(),
                planilla.getTransporte(),
                planilla.getFechaPlanilla(),
                planilla.getTotalProductos(),
                planilla.getFechaCreacion(),
                planilla.getFechaActualizacion(),
                detallesDTO,
                planilla.getEstado() != null ? planilla.getEstado().name() : "PENDIENTE_VERIFICACION",
                planilla.getUsuarioVerificacion() != null ? planilla.getUsuarioVerificacion().getNombre() : null,
                planilla.getFechaVerificacion()
            );
        }).collect(Collectors.toList());
        
        System.out.println("🔍 [DEVOLUCION] Total DTOs retornados: " + result.size());
        return result;
    }

    /**
     * Obtener planilla de devolución por ID
     */
    public Optional<PlanillaDevolucion> obtenerPlanillaDevolucionPorId(Long id) {
        Optional<PlanillaDevolucion> planillaOpt = planillaDevolucionRepository.findById(id);
        
        if (planillaOpt.isPresent()) {
            PlanillaDevolucion planilla = planillaOpt.get();
            // Cargar los detalles de la planilla
            List<DetallePlanillaDevolucion> detalles = detallePlanillaDevolucionRepository
                .findByPlanillaDevolucionIdOrderByFechaCreacionAsc(planilla.getId());
            planilla.setDetalles(detalles);
            
            System.out.println("🔍 [DEVOLUCION] Planilla ID " + id + " cargada con " + detalles.size() + " detalles");
        }
        
        return planillaOpt;
    }

    /**
     * Eliminar planilla de devolución y RESTAR del stock
     */
    public void eliminarPlanillaDevolucion(Long id) {
        PlanillaDevolucion planilla = planillaDevolucionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Planilla de devolución no encontrada"));

        // Restar del stock antes de eliminar
        List<DetallePlanillaDevolucion> detalles = detallePlanillaDevolucionRepository.findByPlanillaDevolucionIdOrderByFechaCreacionAsc(id);
        
        for (DetallePlanillaDevolucion detalle : detalles) {
            if (detalle.getProducto() != null) {
                // Restar del stock SOLO si estaba en buen estado
                try {
                    if (detalle.getEstadoProducto() == DetallePlanillaDevolucion.EstadoProducto.BUEN_ESTADO) {
                        restarDelStock(detalle.getProducto(), detalle.getCantidad());
                        System.out.println("✅ [DEVOLUCION] Revertiendo devolución (BUEN_ESTADO):");
                        System.out.println("   Producto: " + detalle.getProducto().getNombre());
                        System.out.println("   Cantidad: " + detalle.getCantidad());
                    } else {
                        System.out.println("❌ [DEVOLUCION] NO revertiendo devolución (estado: " + detalle.getEstadoProducto().name() + "):");
                        System.out.println("   Producto: " + detalle.getProducto().getNombre());
                        System.out.println("   Cantidad: " + detalle.getCantidad());
                    }
                } catch (Exception e) {
                    // Si la columna no existe, restar todos (comportamiento anterior)
                    restarDelStock(detalle.getProducto(), detalle.getCantidad());
                    System.out.println("⚠️ [DEVOLUCION] Revertiendo devolución (columna no disponible):");
                    System.out.println("   Producto: " + detalle.getProducto().getNombre());
                    System.out.println("   Cantidad: " + detalle.getCantidad());
                }
            }
        }

        // Eliminar detalles primero
        detallePlanillaDevolucionRepository.deleteByPlanillaDevolucionId(id);
        
        // Eliminar la planilla
        planillaDevolucionRepository.delete(planilla);
    }

    /**
     * RESTAR cantidad del stock de un producto (para revertir devoluciones) directamente
     */
    private void restarDelStock(Producto producto, Integer cantidad) {
        if (producto.getStock() != null && cantidad != null) {
            int stockAnterior = producto.getStock();
            int nuevoStock = producto.getStock() - cantidad;
            
            if (nuevoStock < 0) {
                throw new RuntimeException("No se puede restar más stock del disponible para el producto: " + producto.getNombre() + 
                    ". Stock disponible: " + producto.getStock() + ", Cantidad a restar: " + cantidad);
            }
            
            System.out.println("🔄 [DEVOLUCION] Revertiendo devolución - Restando del stock:");
            System.out.println("   Producto: " + producto.getNombre());
            System.out.println("   Stock anterior: " + stockAnterior);
            System.out.println("   Cantidad a restar: " + cantidad);
            System.out.println("   Nuevo stock: " + nuevoStock);
            
            // Restar directamente del stock del producto (sin afectar sectores)
            producto.setStock(nuevoStock);
            productoRepository.save(producto);
            
            System.out.println("✅ [DEVOLUCION] Stock revertido exitosamente: " + stockAnterior + " - " + cantidad + " = " + nuevoStock);
        }
    }

    /**
     * Exportar planilla de devolución a Excel
     */
    public byte[] exportarPlanillaAExcel(Long planillaId, Long empresaId) throws IOException {
        // Verificar que la planilla pertenece a la empresa
        PlanillaDevolucion planilla = planillaDevolucionRepository.findByIdAndEmpresaId(planillaId, empresaId)
                .orElseThrow(() -> new RuntimeException("Planilla no encontrada o no pertenece a la empresa"));

        // Obtener los detalles de la planilla
        List<DetallePlanillaDevolucion> detalles = detallePlanillaDevolucionRepository
                .findByPlanillaDevolucionIdOrderByFechaCreacionAsc(planillaId);

        // Crear el workbook de Excel
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Planilla de Devolución");

            // Crear estilos
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.BLUE.getIndex());
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

            // Crear encabezado de información de la planilla
            int rowNum = 0;
            
            // Título principal
            Row titleRow = sheet.createRow(rowNum++);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("PLANILLA DE DEVOLUCIÓN");
            titleCell.setCellStyle(headerStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 4));

            // Información de la planilla
            rowNum++;
            Row infoRow1 = sheet.createRow(rowNum++);
            infoRow1.createCell(0).setCellValue("Empresa:");
            infoRow1.createCell(1).setCellValue(planilla.getEmpresa().getNombre());
            sheet.addMergedRegion(new CellRangeAddress(rowNum-1, rowNum-1, 1, 4));

            Row infoRow2 = sheet.createRow(rowNum++);
            infoRow2.createCell(0).setCellValue("Número de Planilla:");
            infoRow2.createCell(1).setCellValue(planilla.getNumeroPlanilla() != null ? planilla.getNumeroPlanilla() : "Sin número");
            sheet.addMergedRegion(new CellRangeAddress(rowNum-1, rowNum-1, 1, 4));

            if (planilla.getObservaciones() != null && !planilla.getObservaciones().isEmpty()) {
                rowNum++;
                Row obsRow = sheet.createRow(rowNum++);
                obsRow.createCell(0).setCellValue("Observaciones:");
                obsRow.createCell(1).setCellValue(planilla.getObservaciones());
                sheet.addMergedRegion(new CellRangeAddress(rowNum-1, rowNum-1, 1, 4));
            }

            if (planilla.getTransporte() != null && !planilla.getTransporte().isEmpty()) {
                rowNum++;
                Row transRow = sheet.createRow(rowNum++);
                transRow.createCell(0).setCellValue("Transporte:");
                transRow.createCell(1).setCellValue(planilla.getTransporte());
                sheet.addMergedRegion(new CellRangeAddress(rowNum-1, rowNum-1, 1, 4));
                
                // Extraer y mostrar patente por separado si está disponible
                String transporte = planilla.getTransporte();
                if (transporte.contains(" - ") && transporte.contains("(") && transporte.contains(")")) {
                    try {
                        // Buscar patente en el formato: "texto (modelo - patente)"
                        String[] partes = transporte.split("\\(");
                        if (partes.length > 1) {
                            String parteInterna = partes[1].replace(")", "");
                            if (parteInterna.contains(" - ")) {
                                String[] subPartes = parteInterna.split(" - ");
                                if (subPartes.length > 1) {
                                    String patente = subPartes[1].trim();
                                    if (!patente.isEmpty()) {
                                        rowNum++;
                                        Row patenteRow = sheet.createRow(rowNum++);
                                        patenteRow.createCell(0).setCellValue("Patente:");
                                        patenteRow.createCell(1).setCellValue(patente);
                                        sheet.addMergedRegion(new CellRangeAddress(rowNum-1, rowNum-1, 1, 4));
                                    }
                                }
                            }
                        }
                    } catch (Exception e) {
                        // Si hay error al extraer patente, continuar sin mostrar error
                        System.out.println("⚠️ Error al extraer patente del transporte: " + e.getMessage());
                    }
                }
            }

            Row infoRow3 = sheet.createRow(rowNum++);
            infoRow3.createCell(0).setCellValue("Fecha:");
            infoRow3.createCell(1).setCellValue(planilla.getFechaPlanilla().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
            sheet.addMergedRegion(new CellRangeAddress(rowNum-1, rowNum-1, 1, 4));

            // Calcular cantidad de productos únicos y total de unidades
            int cantidadProductosUnicos = detalles.size();
            int cantidadTotalUnidades = detalles.stream().mapToInt(DetallePlanillaDevolucion::getCantidad).sum();

            Row infoRow4 = sheet.createRow(rowNum++);
            infoRow4.createCell(0).setCellValue("Cantidad de Productos:");
            infoRow4.createCell(1).setCellValue(cantidadProductosUnicos);
            infoRow4.createCell(2).setCellValue("");
            infoRow4.createCell(3).setCellValue("");
            infoRow4.createCell(4).setCellValue("");

            Row infoRow5 = sheet.createRow(rowNum++);
            infoRow5.createCell(0).setCellValue("Cantidad Total de Unidades:");
            infoRow5.createCell(1).setCellValue(cantidadTotalUnidades);
            infoRow5.createCell(2).setCellValue("");
            infoRow5.createCell(3).setCellValue("");
            infoRow5.createCell(4).setCellValue("");

            // Línea en blanco
            rowNum++;

            // Encabezados de la tabla de productos
            Row headerRow = sheet.createRow(rowNum++);
            String[] headers = {"#", "Código Interno", "Nombre del Producto", "Cantidad", "Estado"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Datos de los productos
            for (int i = 0; i < detalles.size(); i++) {
                DetallePlanillaDevolucion detalle = detalles.get(i);
                Row dataRow = sheet.createRow(rowNum++);
                
                dataRow.createCell(0).setCellValue(i + 1);
                dataRow.createCell(1).setCellValue(detalle.getNumeroPersonalizado() != null ? detalle.getNumeroPersonalizado() : "");
                dataRow.createCell(2).setCellValue(detalle.getDescripcion());
                dataRow.createCell(3).setCellValue(detalle.getCantidad());
                
                // Estado del producto
                String estado = "BUEN_ESTADO";
                try {
                    if (detalle.getEstadoProducto() != null) {
                        estado = detalle.getEstadoProducto().name();
                    }
                } catch (Exception e) {
                    // Si la columna no existe, usar valor por defecto
                    estado = "BUEN_ESTADO";
                }
                dataRow.createCell(4).setCellValue(estado);
                
                // Aplicar estilo a todas las celdas
                for (int j = 0; j < 5; j++) {
                    dataRow.getCell(j).setCellStyle(dataStyle);
                }
            }

            // Establecer anchos de columna fijos (evita errores de fuentes en entornos headless)
            establecerAnchosColumnas(sheet, 15, 20, 15, 15, 20);

            // Escribir el workbook a un ByteArrayOutputStream
            try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
                workbook.write(outputStream);
                return outputStream.toByteArray();
            }
        }
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

    /**
     * Establece anchos de columna fijos en lugar de autoSizeColumn
     * Evita errores de fuentes en entornos headless
     */
    private void establecerAnchosColumnas(Sheet sheet, int... anchos) {
        try {
            for (int i = 0; i < anchos.length; i++) {
                sheet.setColumnWidth(i, anchos[i] * 256); // POI usa unidades de 1/256 de carácter
            }
        } catch (Exception e) {
            System.err.println("⚠️ [PLANILLA DEVOLUCION] Error estableciendo anchos de columna: " + e.getMessage());
        }
    }

    /**
     * Obtener planillas pendientes de verificación
     */
    public List<PlanillaDevolucionResponseDTO> obtenerPlanillasPendientesVerificacion(Long empresaId) {
        System.out.println("🔍 [VERIFICACION] Buscando planillas pendientes para empresa ID: " + empresaId);
        List<PlanillaDevolucion> planillas = planillaDevolucionRepository
                .findByEmpresaIdAndEstadoOrderByFechaCreacionDesc(empresaId, PlanillaDevolucion.EstadoPlanilla.PENDIENTE_VERIFICACION);
        System.out.println("🔍 [VERIFICACION] Planillas pendientes encontradas: " + planillas.size());
        
        List<PlanillaDevolucionResponseDTO> result = planillas.stream().map(planilla -> {
            System.out.println("🔍 [VERIFICACION] Procesando planilla ID: " + planilla.getId());
            // Cargar los detalles para cada planilla
            List<DetallePlanillaDevolucion> detalles = detallePlanillaDevolucionRepository.findByPlanillaDevolucionIdOrderByFechaCreacionAsc(planilla.getId());
            System.out.println("🔍 [VERIFICACION] Detalles encontrados para planilla " + planilla.getId() + ": " + detalles.size());

            // Convertir detalles a DTOs
            List<DetallePlanillaDevolucionResponseDTO> detallesDTO = detalles.stream()
                .map(detalle -> {
                    String estadoProducto = "BUEN_ESTADO"; // Valor por defecto
                    try {
                        if (detalle.getEstadoProducto() != null) {
                            estadoProducto = detalle.getEstadoProducto().name();
                        }
                    } catch (Exception e) {
                        System.out.println("⚠️ [VERIFICACION] Error obteniendo estado del producto: " + e.getMessage());
                    }
                    
                    return new DetallePlanillaDevolucionResponseDTO(
                        detalle.getId(),
                        detalle.getNumeroPersonalizado(),
                        detalle.getDescripcion(),
                        detalle.getCantidad(),
                        detalle.getObservaciones(),
                        estadoProducto,
                        detalle.getFechaCreacion()
                    );
                })
                .collect(Collectors.toList());
            
            return new PlanillaDevolucionResponseDTO(
                planilla.getId(),
                planilla.getNumeroPlanilla(),
                planilla.getObservaciones(),
                planilla.getTransporte(),
                planilla.getFechaPlanilla(),
                planilla.getTotalProductos(),
                planilla.getFechaCreacion(),
                planilla.getFechaActualizacion(),
                detallesDTO,
                planilla.getEstado() != null ? planilla.getEstado().name() : "PENDIENTE_VERIFICACION",
                planilla.getUsuarioVerificacion() != null ? planilla.getUsuarioVerificacion().getNombre() : null,
                planilla.getFechaVerificacion()
            );
        }).collect(Collectors.toList());
        
        System.out.println("🔍 [VERIFICACION] Total DTOs creados: " + result.size());
        return result;
    }

    /**
     * Editar detalles de una planilla de devolución (solo si está pendiente de verificación)
     */
    public PlanillaDevolucion editarDetallesPlanilla(Long planillaId, PlanillaDevolucionDTO dto, Long empresaId) {
        // Verificar que la planilla existe y pertenece a la empresa
        PlanillaDevolucion planilla = planillaDevolucionRepository.findByIdAndEmpresaId(planillaId, empresaId)
                .orElseThrow(() -> new RuntimeException("Planilla no encontrada o no pertenece a la empresa"));

        // Verificar que está pendiente de verificación
        if (planilla.getEstado() != PlanillaDevolucion.EstadoPlanilla.PENDIENTE_VERIFICACION) {
            throw new RuntimeException("Solo se pueden editar planillas pendientes de verificación");
        }

        // Actualizar campos básicos
        if (dto.getObservaciones() != null) {
            planilla.setObservaciones(dto.getObservaciones());
        }
        if (dto.getTransporte() != null) {
            planilla.setTransporte(dto.getTransporte());
        }

        // Crear un mapa de detalles existentes para preservar cantidadOriginalStock
        Map<String, Integer> cantidadOriginalStockMap = new HashMap<>();
        for (DetallePlanillaDevolucion detalleExistente : planilla.getDetalles()) {
            String key = detalleExistente.getNumeroPersonalizado() != null ? 
                        detalleExistente.getNumeroPersonalizado() : 
                        detalleExistente.getDescripcion();
            cantidadOriginalStockMap.put(key, detalleExistente.getCantidadOriginalStock() != null ? 
                                         detalleExistente.getCantidadOriginalStock() : 0);
        }

        // Eliminar detalles existentes y REVERTIR el stock que se había sumado
        List<DetallePlanillaDevolucion> detallesExistentes = new ArrayList<>(planilla.getDetalles());
        for (DetallePlanillaDevolucion detalle : detallesExistentes) {
            // REVERTIR el stock que se había sumado para este detalle
            if (detalle.getProducto() != null && detalle.getCantidadOriginalStock() != null && detalle.getCantidadOriginalStock() > 0) {
                System.out.println("🔄 [EDICION] Revirtiendo stock de detalle eliminado:");
                System.out.println("   Producto: " + detalle.getProducto().getNombre());
                System.out.println("   Cantidad a revertir: " + detalle.getCantidadOriginalStock());
                
                descontarDelStock(detalle.getProducto(), detalle.getCantidadOriginalStock());
                System.out.println("✅ [EDICION] Stock revertido exitosamente");
            }
            
            detallePlanillaDevolucionRepository.delete(detalle);
        }
        planilla.getDetalles().clear();

        // Agregar nuevos detalles preservando cantidadOriginalStock
        if (dto.getDetalles() != null && !dto.getDetalles().isEmpty()) {
            for (DetallePlanillaDevolucionDTO detalleDTO : dto.getDetalles()) {
                DetallePlanillaDevolucion detalle = new DetallePlanillaDevolucion();
                detalle.setDescripcion(detalleDTO.getDescripcion());
                detalle.setCantidad(detalleDTO.getCantidad());
                detalle.setNumeroPersonalizado(detalleDTO.getNumeroPersonalizado());
                detalle.setObservaciones(detalleDTO.getObservaciones());
                
                // Establecer estado del producto
                if (detalleDTO.getEstadoProducto() != null) {
                    detalle.setEstadoProducto(DetallePlanillaDevolucion.EstadoProducto.valueOf(detalleDTO.getEstadoProducto()));
                } else {
                    detalle.setEstadoProducto(DetallePlanillaDevolucion.EstadoProducto.BUEN_ESTADO);
                }

                System.out.println("🔄 [EDICION] Procesando detalle: " + detalleDTO.getDescripcion() + 
                                 " - ProductoId: " + detalleDTO.getProductoId() + 
                                 " - NumeroPersonalizado: " + detalleDTO.getNumeroPersonalizado());
                
                // Buscar producto por ID si está disponible, sino por número personalizado
                if (detalleDTO.getProductoId() != null) {
                    // Usar el ID del producto enviado desde el frontend
                    Producto producto = productoRepository.findById(detalleDTO.getProductoId()).orElse(null);
                    if (producto != null && producto.getEmpresa().getId().equals(empresaId)) {
                        detalle.setProducto(producto);
                        System.out.println("✅ [EDICION] Producto encontrado por ID: " + producto.getNombre() + " (ID: " + producto.getId() + ")");
                    } else {
                        System.out.println("❌ [EDICION] Producto con ID " + detalleDTO.getProductoId() + " no encontrado o no pertenece a la empresa");
                    }
                } else if (detalleDTO.getNumeroPersonalizado() != null && !detalleDTO.getNumeroPersonalizado().trim().isEmpty()) {
                    // Fallback: buscar por número personalizado
                    List<Producto> productos = productoRepository.findByEmpresaIdAndCodigoPersonalizadoAndActivo(
                            empresaId, detalleDTO.getNumeroPersonalizado(), true);
                    if (!productos.isEmpty()) {
                        detalle.setProducto(productos.get(0));
                        System.out.println("✅ [EDICION] Producto encontrado por código: " + productos.get(0).getNombre() + " (ID: " + productos.get(0).getId() + ")");
                    } else {
                        System.out.println("❌ [EDICION] No se encontró producto con código: " + detalleDTO.getNumeroPersonalizado());
                    }
                } else {
                    System.out.println("⚠️ [EDICION] Detalle sin productoId ni numeroPersonalizado: " + detalleDTO.getDescripcion());
                }

                // Preservar la cantidad original que se sumó al stock
                String key = detalleDTO.getNumeroPersonalizado() != null ? 
                           detalleDTO.getNumeroPersonalizado() : 
                           detalleDTO.getDescripcion();
                Integer cantidadOriginal = cantidadOriginalStockMap.get(key);
                if (cantidadOriginal != null) {
                    detalle.setCantidadOriginalStock(cantidadOriginal);
                    System.out.println("🔄 [EDICION] Preservando cantidad original para " + key + ": " + cantidadOriginal);
                } else {
                    // Si no se encuentra, es un producto nuevo agregado en la verificación
                    detalle.setCantidadOriginalStock(0);
                    System.out.println("🆕 [EDICION] Producto nuevo agregado en verificación: " + key + 
                                     " - Estado: " + detalle.getEstadoProducto().name() + 
                                     " - Cantidad: " + detalleDTO.getCantidad() +
                                     " - CantidadOriginalStock: 0");
                }
                
                // SUMAR AL STOCK si el producto está en buen estado
                // Tanto productos originales como nuevos deben sumarse al stock
                if (detalle.getProducto() != null && detalle.getEstadoProducto() == DetallePlanillaDevolucion.EstadoProducto.BUEN_ESTADO) {
                    System.out.println("✅ [EDICION] Sumando al stock (BUEN_ESTADO):");
                    System.out.println("   Producto: " + detalle.getProducto().getNombre());
                    System.out.println("   Cantidad: " + detalleDTO.getCantidad());
                    System.out.println("   Estado: " + detalle.getEstadoProducto().name());
                    System.out.println("   Cantidad original: " + cantidadOriginal);
                    
                    sumarAlStock(detalle.getProducto(), detalleDTO.getCantidad());
                    System.out.println("✅ [EDICION] Stock actualizado exitosamente");
                } else if (detalle.getProducto() != null) {
                    System.out.println("⚠️ [EDICION] Producto NO sumado al stock (estado: " + detalle.getEstadoProducto().name() + "):");
                    System.out.println("   Producto: " + detalle.getProducto().getNombre());
                    System.out.println("   Cantidad: " + detalleDTO.getCantidad());
                }

                detalle.setPlanillaDevolucion(planilla);
                planilla.agregarDetalle(detalle);
            }
        }

        // Recalcular total de productos
        planilla.calcularTotalProductos();

        return planillaDevolucionRepository.save(planilla);
    }

    /**
     * Finalizar verificación de una planilla de devolución
     */
    public PlanillaDevolucion finalizarVerificacion(Long planillaId, Long empresaId, Long usuarioId) {
        System.out.println("🔍 [FINALIZAR_VERIFICACION] Iniciando verificación para planilla ID: " + planillaId);
        
        // Verificar que la planilla existe y pertenece a la empresa
        PlanillaDevolucion planilla = planillaDevolucionRepository.findByIdAndEmpresaId(planillaId, empresaId)
                .orElseThrow(() -> new RuntimeException("Planilla no encontrada o no pertenece a la empresa"));

        // Verificar que está pendiente de verificación
        if (planilla.getEstado() != PlanillaDevolucion.EstadoPlanilla.PENDIENTE_VERIFICACION) {
            throw new RuntimeException("Solo se pueden verificar planillas pendientes de verificación");
        }

        // Obtener usuario que verifica
        Usuario usuarioVerificacion = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        System.out.println("🔍 [FINALIZAR_VERIFICACION] Planilla encontrada: " + planilla.getId());
        System.out.println("🔍 [FINALIZAR_VERIFICACION] Detalles en la planilla: " + planilla.getDetalles().size());
        
        // Mostrar todos los detalles antes de aplicar correcciones
        for (DetallePlanillaDevolucion detalle : planilla.getDetalles()) {
            System.out.println("🔍 [FINALIZAR_VERIFICACION] Detalle: " + detalle.getDescripcion() + 
                             " - Producto ID: " + (detalle.getProducto() != null ? detalle.getProducto().getId() : "null") +
                             " - Cantidad: " + detalle.getCantidad() + 
                             " - Estado: " + detalle.getEstadoProducto().name() +
                             " - Cantidad Original: " + detalle.getCantidadOriginalStock());
        }

        // Actualizar estado y datos de verificación
        planilla.setEstado(PlanillaDevolucion.EstadoPlanilla.VERIFICADO);
        planilla.setUsuarioVerificacion(usuarioVerificacion);
        planilla.setFechaVerificacion(LocalDateTime.now());

        // Aplicar correcciones al stock basadas en el estado de los productos
        aplicarCorreccionesStock(planilla, empresaId);

        return planillaDevolucionRepository.save(planilla);
    }

    /**
     * Aplicar correcciones al stock basadas en el estado de los productos verificados
     */
    private void aplicarCorreccionesStock(PlanillaDevolucion planilla, Long empresaId) {
        System.out.println("🔍 [VERIFICACION] Aplicando correcciones al stock para planilla: " + planilla.getId());
        
        // AGRUPAR DETALLES POR PRODUCTO Y PROCESAR CORRECTAMENTE
        // Esto permite manejar correctamente el mismo producto con múltiples registros
        
        Map<Long, List<DetallePlanillaDevolucion>> detallesPorProducto = new HashMap<>();
        
        for (DetallePlanillaDevolucion detalle : planilla.getDetalles()) {
            System.out.println("🔍 [VERIFICACION] Procesando detalle: " + detalle.getDescripcion() + 
                             " - Producto: " + (detalle.getProducto() != null ? detalle.getProducto().getNombre() + " (ID: " + detalle.getProducto().getId() + ")" : "NULL"));
            
            if (detalle.getProducto() != null) {
                Long productoId = detalle.getProducto().getId();
                detallesPorProducto.computeIfAbsent(productoId, k -> new ArrayList<>()).add(detalle);
                System.out.println("   ✅ Agregado al grupo del producto ID: " + productoId);
            } else {
                // Producto sin asociar - solo registrar
                System.out.println("⚠️ [VERIFICACION] Producto sin asociar: " + detalle.getDescripcion() + 
                                 " - Estado: " + detalle.getEstadoProducto().name() + 
                                 " - Cantidad: " + detalle.getCantidad());
            }
        }
        
        System.out.println("🔍 [VERIFICACION] Total de grupos de productos: " + detallesPorProducto.size());
        for (Map.Entry<Long, List<DetallePlanillaDevolucion>> entry : detallesPorProducto.entrySet()) {
            System.out.println("   Grupo Producto ID " + entry.getKey() + ": " + entry.getValue().size() + " detalles");
        }
        
        // Procesar cada producto agrupado
        for (Map.Entry<Long, List<DetallePlanillaDevolucion>> entry : detallesPorProducto.entrySet()) {
            Long productoId = entry.getKey();
            List<DetallePlanillaDevolucion> detalles = entry.getValue();
            
            if (detalles.isEmpty()) continue;
            
            Producto producto = detalles.get(0).getProducto();
            System.out.println("🔍 [VERIFICACION] Procesando producto: " + producto.getNombre() + " (ID: " + productoId + ")");
            System.out.println("   Detalles encontrados: " + detalles.size());
            
            // Calcular totales por estado para TODOS los detalles del mismo producto
            int totalCantidadOriginal = 0;
            int totalCantidadBuenEstado = 0;
            int totalCantidadMalEstado = 0;
            
            for (DetallePlanillaDevolucion detalle : detalles) {
                Integer cantidadOriginal = detalle.getCantidadOriginalStock() != null ? detalle.getCantidadOriginalStock() : 0;
                totalCantidadOriginal += cantidadOriginal;
                
                System.out.println("   - Detalle: " + detalle.getDescripcion() + 
                                 " - Cantidad: " + detalle.getCantidad() + 
                                 " - Original: " + cantidadOriginal + 
                                 " - Estado: " + detalle.getEstadoProducto().name());
                
                if (detalle.getEstadoProducto() == DetallePlanillaDevolucion.EstadoProducto.BUEN_ESTADO) {
                    totalCantidadBuenEstado += detalle.getCantidad();
                } else {
                    totalCantidadMalEstado += detalle.getCantidad();
                }
            }
            
            System.out.println("   📊 Totales AGREGADOS para el producto:");
            System.out.println("   - Cantidad original total en stock: " + totalCantidadOriginal);
            System.out.println("   - Cantidad final total en buen estado: " + totalCantidadBuenEstado);
            System.out.println("   - Cantidad total en mal estado: " + totalCantidadMalEstado);
            System.out.println("   - Stock actual del producto: " + producto.getStock());
            
            // LÓGICA CORREGIDA: Recalcular el stock total basándose en la cantidad final verificada
            // El stock debe reflejar exactamente la cantidad total verificada en buen estado
            int stockAnterior = producto.getStock();
            int cantidadFinalEnStock = totalCantidadBuenEstado;
            
            System.out.println("   🧮 Cálculo CORREGIDO para producto agrupado:");
            System.out.println("   - Stock anterior: " + stockAnterior);
            System.out.println("   - Cantidad original total sumada: " + totalCantidadOriginal);
            System.out.println("   - Cantidad final total verificada en buen estado: " + cantidadFinalEnStock);
            
            // LÓGICA CORREGIDA: Solo ajustar por la diferencia real
            // Los productos nuevos ya se sumaron durante la edición, no hay que revertir y sumar de nuevo
            
            System.out.println("   🔧 Aplicando corrección de stock...");
            
            // Calcular la diferencia real: cuánto más o menos debe estar en stock
            int diferenciaReal = cantidadFinalEnStock - totalCantidadOriginal;
            
            System.out.println("   - Diferencia real a aplicar: " + diferenciaReal);
            
            // Solo aplicar la diferencia si es necesaria
            // IMPORTANTE: Si totalCantidadOriginal = 0, significa que es un producto nuevo
            // Los productos nuevos ya se sumaron durante la edición, no hay que sumar de nuevo
            if (diferenciaReal > 0 && totalCantidadOriginal > 0) {
                // Sumar la diferencia (productos que cambiaron de mal estado a buen estado)
                // Solo si el producto tenía cantidad original (no es un producto nuevo)
                System.out.println("   ➕ Sumando diferencia: " + diferenciaReal);
                sumarAlStock(producto, diferenciaReal);
            } else if (diferenciaReal < 0) {
                // Descontar la diferencia (productos que cambiaron de buen estado a mal estado)
                System.out.println("   ➖ Descontando diferencia: " + Math.abs(diferenciaReal));
                descontarDelStock(producto, Math.abs(diferenciaReal));
            } else if (totalCantidadOriginal == 0) {
                System.out.println("   ⚖️ Producto nuevo - ya se sumó durante la edición, no hay cambios adicionales");
            } else {
                System.out.println("   ⚖️ No hay cambios en el stock");
            }
            
            System.out.println("   ✅ Stock corregido: " + stockAnterior + " → " + producto.getStock());
        }
    }

    /**
     * DESCONTAR cantidad del stock de un producto (para correcciones de verificación)
     */
    private void descontarDelStock(Producto producto, Integer cantidad) {
        if (producto.getStock() != null && cantidad != null) {
            int stockAnterior = producto.getStock();
            int nuevoStock = Math.max(0, producto.getStock() - cantidad); // No permitir stock negativo
            
            System.out.println("🔄 [VERIFICACION] Descontando del stock:");
            System.out.println("   Producto: " + producto.getNombre());
            System.out.println("   Stock anterior: " + stockAnterior);
            System.out.println("   Cantidad a descontar: " + cantidad);
            System.out.println("   Nuevo stock: " + nuevoStock);
            
            // Actualizar el stock del producto
            producto.setStock(nuevoStock);
            productoRepository.save(producto);
            
            // TODO: Registrar en el historial de movimientos cuando esté disponible
            System.out.println("✅ [VERIFICACION] Stock actualizado - Pendiente registro en historial");
        }
    }
}
