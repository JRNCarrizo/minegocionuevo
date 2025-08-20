package com.minegocio.backend.servicios;

import com.minegocio.backend.dto.DetallePlanillaPedidoDTO;
import com.minegocio.backend.dto.DetallePlanillaPedidoResponseDTO;
import com.minegocio.backend.dto.PlanillaPedidoDTO;
import com.minegocio.backend.dto.PlanillaPedidoResponseDTO;
import com.minegocio.backend.entidades.*;
import com.minegocio.backend.repositorios.DetallePlanillaPedidoRepository;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.PlanillaPedidoRepository;
import com.minegocio.backend.repositorios.ProductoRepository;
import com.minegocio.backend.repositorios.UsuarioRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class PlanillaPedidoService {

    @Autowired
    private PlanillaPedidoRepository planillaPedidoRepository;

    @Autowired
    private DetallePlanillaPedidoRepository detallePlanillaPedidoRepository;

    @Autowired
    private EmpresaRepository empresaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ProductoRepository productoRepository;

    /**
     * Crear una nueva planilla de pedido y descontar del stock
     */
    public PlanillaPedido crearPlanillaPedido(PlanillaPedidoDTO dto, Long empresaId, Long usuarioId) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrada"));

        System.out.println("📋 [SERVICE] Fecha recibida en DTO: " + dto.getFechaPlanilla());
        System.out.println("📋 [SERVICE] Fecha actual del servidor: " + java.time.LocalDate.now());
        System.out.println("📋 [SERVICE] Zona horaria del servidor: " + java.time.ZoneId.systemDefault());
        System.out.println("📋 [SERVICE] Comparación de fechas:");
        System.out.println("   - Fecha DTO: " + dto.getFechaPlanilla());
        System.out.println("   - Fecha actual: " + java.time.LocalDate.now());
        System.out.println("   - Son iguales: " + dto.getFechaPlanilla().equals(java.time.LocalDate.now()));
        
        PlanillaPedido planilla = new PlanillaPedido(empresa, usuario, dto.getFechaPlanilla());
        planilla.setObservaciones(dto.getObservaciones());

        // Si se proporciona un número de planilla específico, usarlo
        if (dto.getNumeroPlanilla() != null && !dto.getNumeroPlanilla().isEmpty()) {
            planilla.setNumeroPlanilla(dto.getNumeroPlanilla());
        }

        planilla = planillaPedidoRepository.save(planilla);

        // Calcular el total de productos basándose en los detalles del DTO
        int totalProductos = 0;
        if (dto.getDetalles() != null && !dto.getDetalles().isEmpty()) {
            totalProductos = dto.getDetalles().stream()
                    .mapToInt(DetallePlanillaPedidoDTO::getCantidad)
                    .sum();
        }
        planilla.setTotalProductos(totalProductos);

        // Agregar detalles si se proporcionan y descontar del stock
        if (dto.getDetalles() != null && !dto.getDetalles().isEmpty()) {
            for (DetallePlanillaPedidoDTO detalleDTO : dto.getDetalles()) {
                DetallePlanillaPedido detalle = new DetallePlanillaPedido(planilla, detalleDTO.getDescripcion(), detalleDTO.getCantidad());
                detalle.setNumeroPersonalizado(detalleDTO.getNumeroPersonalizado());
                detalle.setObservaciones(detalleDTO.getObservaciones());

                // Si se especifica un producto, asociarlo y descontar del stock
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
                        
                        // Descontar del stock del producto
                        descontarDelStock(producto, detalleDTO.getCantidad());
                    }
                }

                detallePlanillaPedidoRepository.save(detalle);
            }
        }

        return planillaPedidoRepository.save(planilla);
    }

    /**
     * Obtener todas las planillas de una empresa
     */
    public List<PlanillaPedidoResponseDTO> obtenerPlanillasPorEmpresa(Long empresaId) {
        List<PlanillaPedido> planillas = planillaPedidoRepository.findByEmpresaIdOrderByFechaPlanillaDesc(empresaId);
        
        return planillas.stream().map(planilla -> {
            // Cargar los detalles para cada planilla
            List<DetallePlanillaPedido> detalles = detallePlanillaPedidoRepository.findByPlanillaPedidoIdOrderByFechaCreacionAsc(planilla.getId());
            
            // Convertir detalles a DTOs
            List<DetallePlanillaPedidoResponseDTO> detallesDTO = detalles.stream()
                .map(detalle -> new DetallePlanillaPedidoResponseDTO(
                    detalle.getId(),
                    detalle.getNumeroPersonalizado(),
                    detalle.getDescripcion(),
                    detalle.getCantidad(),
                    detalle.getObservaciones(),
                    detalle.getFechaCreacion()
                ))
                .collect(Collectors.toList());
            
            return new PlanillaPedidoResponseDTO(
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
    }

    /**
     * Obtener planillas por empresa y fecha
     */
    public List<PlanillaPedido> obtenerPlanillasPorEmpresaYFecha(Long empresaId, LocalDate fecha) {
        return planillaPedidoRepository.findByEmpresaIdAndFechaPlanillaOrderByFechaCreacionDesc(empresaId, fecha);
    }

    /**
     * Obtener planillas por empresa y rango de fechas
     */
    public List<PlanillaPedido> obtenerPlanillasPorEmpresaYRangoFechas(Long empresaId, LocalDate fechaInicio, LocalDate fechaFin) {
        return planillaPedidoRepository.findByEmpresaIdAndFechaPlanillaBetweenOrderByFechaPlanillaDesc(empresaId, fechaInicio, fechaFin);
    }

    /**
     * Obtener planilla por ID
     */
    public Optional<PlanillaPedido> obtenerPlanillaPorId(Long id) {
        return planillaPedidoRepository.findById(id);
    }

    /**
     * Obtener planilla por número de planilla
     */
    public Optional<PlanillaPedido> obtenerPlanillaPorNumero(String numeroPlanilla) {
        return planillaPedidoRepository.findByNumeroPlanilla(numeroPlanilla);
    }

    /**
     * Actualizar planilla de pedido
     */
    public PlanillaPedido actualizarPlanillaPedido(Long id, PlanillaPedidoDTO dto) {
        PlanillaPedido planilla = planillaPedidoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Planilla no encontrada"));

        if (dto.getObservaciones() != null) {
            planilla.setObservaciones(dto.getObservaciones());
        }

        if (dto.getFechaPlanilla() != null) {
            planilla.setFechaPlanilla(dto.getFechaPlanilla());
        }

        return planillaPedidoRepository.save(planilla);
    }

    /**
     * Eliminar planilla de pedido y restaurar el stock
     */
    public void eliminarPlanillaPedido(Long id) {
        PlanillaPedido planilla = planillaPedidoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Planilla no encontrada"));

        // Obtener detalles antes de eliminarlos para restaurar el stock
        List<DetallePlanillaPedido> detalles = detallePlanillaPedidoRepository.findByPlanillaPedidoIdOrderByFechaCreacionAsc(id);
        
        // Restaurar el stock de cada producto
        for (DetallePlanillaPedido detalle : detalles) {
            if (detalle.getProducto() != null) {
                restaurarStock(detalle.getProducto(), detalle.getCantidad());
            }
        }

        // Eliminar detalles primero
        detallePlanillaPedidoRepository.deleteByPlanillaPedidoId(id);
        
        // Eliminar planilla
        planillaPedidoRepository.delete(planilla);
    }

    /**
     * Agregar detalle a una planilla y descontar del stock
     */
    public DetallePlanillaPedido agregarDetalle(Long planillaId, DetallePlanillaPedidoDTO dto) {
        PlanillaPedido planilla = planillaPedidoRepository.findById(planillaId)
                .orElseThrow(() -> new RuntimeException("Planilla no encontrada"));

        DetallePlanillaPedido detalle = new DetallePlanillaPedido(planilla, dto.getDescripcion(), dto.getCantidad());
        detalle.setNumeroPersonalizado(dto.getNumeroPersonalizado());
        detalle.setObservaciones(dto.getObservaciones());

        // Si se especifica un producto, asociarlo y descontar del stock
        if (dto.getProductoId() != null) {
            Producto producto = productoRepository.findById(dto.getProductoId())
                    .orElse(null);
            if (producto != null) {
                detalle.setProducto(producto);
                if (detalle.getNumeroPersonalizado() == null) {
                    detalle.setNumeroPersonalizado(producto.getCodigoPersonalizado());
                }
                if (detalle.getDescripcion() == null) {
                    detalle.setDescripcion(producto.getNombre());
                }
                
                // Descontar del stock del producto
                descontarDelStock(producto, dto.getCantidad());
            }
        }

        detalle = detallePlanillaPedidoRepository.save(detalle);
        
        // Recalcular total sumando la nueva cantidad
        int nuevoTotal = planilla.getTotalProductos() + dto.getCantidad();
        planilla.setTotalProductos(nuevoTotal);
        planillaPedidoRepository.save(planilla);

        return detalle;
    }

    /**
     * Obtener detalles de una planilla
     */
    public List<DetallePlanillaPedido> obtenerDetallesPorPlanilla(Long planillaId) {
        return detallePlanillaPedidoRepository.findByPlanillaPedidoIdOrderByFechaCreacionAsc(planillaId);
    }

    /**
     * Eliminar detalle de una planilla y restaurar el stock
     */
    public void eliminarDetalle(Long detalleId) {
        DetallePlanillaPedido detalle = detallePlanillaPedidoRepository.findById(detalleId)
                .orElseThrow(() -> new RuntimeException("Detalle no encontrado"));

        PlanillaPedido planilla = detalle.getPlanillaPedido();
        
        // Restaurar el stock si el detalle tiene un producto asociado
        if (detalle.getProducto() != null) {
            restaurarStock(detalle.getProducto(), detalle.getCantidad());
        }
        
        int cantidadEliminada = detalle.getCantidad();
        detallePlanillaPedidoRepository.delete(detalle);
        
        // Recalcular total restando la cantidad eliminada
        int nuevoTotal = planilla.getTotalProductos() - cantidadEliminada;
        planilla.setTotalProductos(Math.max(0, nuevoTotal)); // No permitir total negativo
        planillaPedidoRepository.save(planilla);
    }

    /**
     * Contar planillas por empresa
     */
    public long contarPlanillasPorEmpresa(Long empresaId) {
        return planillaPedidoRepository.countByEmpresaId(empresaId);
    }

    /**
     * Contar planillas por empresa y fecha
     */
    public long contarPlanillasPorEmpresaYFecha(Long empresaId, LocalDate fecha) {
        return planillaPedidoRepository.countByEmpresaIdAndFechaPlanilla(empresaId, fecha);
    }

    /**
     * Descontar cantidad del stock de un producto
     */
    private void descontarDelStock(Producto producto, Integer cantidad) {
        if (producto.getStock() != null && cantidad != null) {
            int nuevoStock = producto.getStock() - cantidad;
            if (nuevoStock < 0) {
                throw new RuntimeException("Stock insuficiente para el producto: " + producto.getNombre() + 
                    ". Stock disponible: " + producto.getStock() + ", Cantidad solicitada: " + cantidad);
            }
            producto.setStock(nuevoStock);
            productoRepository.save(producto);
        }
    }

    /**
     * Restaurar cantidad al stock de un producto
     */
    private void restaurarStock(Producto producto, Integer cantidad) {
        if (producto.getStock() != null && cantidad != null) {
            int nuevoStock = producto.getStock() + cantidad;
            producto.setStock(nuevoStock);
            productoRepository.save(producto);
        }
    }

    /**
     * Exportar planilla de pedido a Excel
     */
    public byte[] exportarPlanillaAExcel(Long planillaId, Long empresaId) throws IOException {
        // Verificar que la planilla pertenece a la empresa
        PlanillaPedido planilla = planillaPedidoRepository.findByIdAndEmpresaId(planillaId, empresaId)
                .orElseThrow(() -> new RuntimeException("Planilla no encontrada o no pertenece a la empresa"));

        // Obtener los detalles de la planilla
        List<DetallePlanillaPedido> detalles = detallePlanillaPedidoRepository
                .findByPlanillaPedidoIdOrderByFechaCreacionAsc(planillaId);

        // Crear el workbook de Excel
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Planilla de Pedido");

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
            titleCell.setCellValue("PLANILLA DE PEDIDO");
            titleCell.setCellStyle(headerStyle);
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 0, 3));

            // Información de la planilla
            rowNum++;
            Row infoRow1 = sheet.createRow(rowNum++);
            infoRow1.createCell(0).setCellValue("Empresa:");
            infoRow1.createCell(1).setCellValue(planilla.getEmpresa().getNombre());
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowNum-1, rowNum-1, 1, 3));

            Row infoRow2 = sheet.createRow(rowNum++);
            infoRow2.createCell(0).setCellValue("Número de Planilla:");
            infoRow2.createCell(1).setCellValue(planilla.getNumeroPlanilla());
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowNum-1, rowNum-1, 1, 3));

            if (planilla.getObservaciones() != null && !planilla.getObservaciones().isEmpty()) {
                rowNum++;
                Row obsRow = sheet.createRow(rowNum++);
                obsRow.createCell(0).setCellValue("Observaciones:");
                obsRow.createCell(1).setCellValue(planilla.getObservaciones());
                sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowNum-1, rowNum-1, 1, 3));
            }

            Row infoRow3 = sheet.createRow(rowNum++);
            infoRow3.createCell(0).setCellValue("Fecha:");
            infoRow3.createCell(1).setCellValue(planilla.getFechaPlanilla().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
            sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowNum-1, rowNum-1, 1, 3));

            // Calcular cantidad de productos únicos y total de unidades
            int cantidadProductosUnicos = detalles.size();
            int cantidadTotalUnidades = detalles.stream().mapToInt(DetallePlanillaPedido::getCantidad).sum();

            Row infoRow4 = sheet.createRow(rowNum++);
            infoRow4.createCell(0).setCellValue("Cantidad de Productos:");
            infoRow4.createCell(1).setCellValue(cantidadProductosUnicos);
            infoRow4.createCell(2).setCellValue("");
            infoRow4.createCell(3).setCellValue("");

            Row infoRow5 = sheet.createRow(rowNum++);
            infoRow5.createCell(0).setCellValue("Cantidad Total de Unidades:");
            infoRow5.createCell(1).setCellValue(cantidadTotalUnidades);
            infoRow5.createCell(2).setCellValue("");
            infoRow5.createCell(3).setCellValue("");

            // Línea en blanco
            rowNum++;

            // Encabezados de la tabla de productos
            Row headerRow = sheet.createRow(rowNum++);
            String[] headers = {"#", "Código Interno", "Nombre del Producto", "Cantidad"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            // Datos de los productos
            for (int i = 0; i < detalles.size(); i++) {
                DetallePlanillaPedido detalle = detalles.get(i);
                Row dataRow = sheet.createRow(rowNum++);
                
                dataRow.createCell(0).setCellValue(i + 1);
                
                // Código personalizado (del producto si existe, sino del detalle)
                String codigoPersonalizado = "";
                if (detalle.getProducto() != null && detalle.getProducto().getCodigoPersonalizado() != null) {
                    codigoPersonalizado = detalle.getProducto().getCodigoPersonalizado();
                } else if (detalle.getNumeroPersonalizado() != null) {
                    codigoPersonalizado = detalle.getNumeroPersonalizado();
                }
                dataRow.createCell(1).setCellValue(codigoPersonalizado);
                
                // Nombre del producto (del producto si existe, sino descripción del detalle)
                String nombreProducto = "";
                if (detalle.getProducto() != null && detalle.getProducto().getNombre() != null) {
                    nombreProducto = detalle.getProducto().getNombre();
                } else {
                    nombreProducto = detalle.getDescripcion();
                }
                dataRow.createCell(2).setCellValue(nombreProducto);
                
                dataRow.createCell(3).setCellValue(detalle.getCantidad());
                
                // Aplicar estilo a todas las celdas
                for (int j = 0; j < 4; j++) {
                    dataRow.getCell(j).setCellStyle(dataStyle);
                }
            }

            // Ajustar ancho de columnas
            sheet.setColumnWidth(0, 1000);  // #
            sheet.setColumnWidth(1, 6000);  // Código Interno
            sheet.setColumnWidth(2, 20000); // Nombre del Producto
            sheet.setColumnWidth(3, 4000);  // Cantidad

            // Convertir a bytes
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        }
    }

    /**
     * Convierte una entidad PlanillaPedido a PlanillaPedidoResponseDTO
     */
    public PlanillaPedidoResponseDTO convertirADTO(PlanillaPedido planilla) {
        PlanillaPedidoResponseDTO dto = new PlanillaPedidoResponseDTO();
        dto.setId(planilla.getId());
        dto.setNumeroPlanilla(planilla.getNumeroPlanilla());
        dto.setFechaPlanilla(planilla.getFechaPlanilla());
        dto.setObservaciones(planilla.getObservaciones());
        dto.setTotalProductos(planilla.getTotalProductos());
        dto.setFechaCreacion(planilla.getFechaCreacion());
        dto.setFechaActualizacion(planilla.getFechaActualizacion());
        
        // Convertir detalles
        if (planilla.getDetalles() != null) {
            List<DetallePlanillaPedidoResponseDTO> detallesDTO = planilla.getDetalles().stream()
                    .map(this::convertirDetalleADTO)
                    .collect(Collectors.toList());
            dto.setDetalles(detallesDTO);
        }
        
        return dto;
    }

    /**
     * Convierte una entidad DetallePlanillaPedido a DetallePlanillaPedidoResponseDTO
     */
    private DetallePlanillaPedidoResponseDTO convertirDetalleADTO(DetallePlanillaPedido detalle) {
        DetallePlanillaPedidoResponseDTO dto = new DetallePlanillaPedidoResponseDTO();
        dto.setId(detalle.getId());
        dto.setDescripcion(detalle.getDescripcion());
        dto.setCantidad(detalle.getCantidad());
        dto.setNumeroPersonalizado(detalle.getNumeroPersonalizado());
        dto.setObservaciones(detalle.getObservaciones());
        dto.setFechaCreacion(detalle.getFechaCreacion());
        
        return dto;
    }
}
