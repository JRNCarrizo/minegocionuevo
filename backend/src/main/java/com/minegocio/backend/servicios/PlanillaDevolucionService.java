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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
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

        // Si se proporciona un número de planilla específico, usarlo
        if (dto.getNumeroPlanilla() != null && !dto.getNumeroPlanilla().isEmpty()) {
            planilla.setNumeroPlanilla(dto.getNumeroPlanilla());
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
                            System.out.println("✅ [DEVOLUCION] Sumando al stock (BUEN_ESTADO):");
                            System.out.println("   Producto: " + producto.getNombre());
                            System.out.println("   Cantidad: " + detalleDTO.getCantidad());
                        } else {
                            System.out.println("❌ [DEVOLUCION] NO sumando al stock (estado: " + detalle.getEstadoProducto().name() + "):");
                            System.out.println("   Producto: " + producto.getNombre());
                            System.out.println("   Cantidad: " + detalleDTO.getCantidad());
                        }
                    }
                }

                detallePlanillaDevolucionRepository.save(detalle);
            }
        }

        return planillaDevolucionRepository.save(planilla);
    }

    /**
     * SUMAR cantidad al stock de un producto (para devoluciones)
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
            
            producto.setStock(nuevoStock);
            productoRepository.save(producto);
            
            System.out.println("✅ [DEVOLUCION] Stock actualizado exitosamente");
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
                planilla.getFechaPlanilla(),
                planilla.getTotalProductos(),
                planilla.getFechaCreacion(),
                planilla.getFechaActualizacion(),
                detallesDTO
            );
        }).collect(Collectors.toList());
        
        System.out.println("🔍 [DEVOLUCION] Total DTOs retornados: " + result.size());
        return result;
    }

    /**
     * Obtener planilla de devolución por ID
     */
    public Optional<PlanillaDevolucion> obtenerPlanillaDevolucionPorId(Long id) {
        return planillaDevolucionRepository.findById(id);
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
     * RESTAR cantidad del stock de un producto (para revertir devoluciones)
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
            
            producto.setStock(nuevoStock);
            productoRepository.save(producto);
            
            System.out.println("✅ [DEVOLUCION] Stock revertido exitosamente");
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

            // Autoajustar columnas
            for (int i = 0; i < 5; i++) {
                sheet.autoSizeColumn(i);
            }

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
}
