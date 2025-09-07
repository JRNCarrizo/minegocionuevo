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
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
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
    
    @Autowired
    private StockSincronizacionService stockSincronizacionService;

    /**
     * Crear una nueva planilla de pedido y descontar del stock
     */
    public PlanillaPedido crearPlanillaPedido(PlanillaPedidoDTO dto, Long empresaId, Long usuarioId) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrada"));

        System.out.println("📋 [SERVICE] Fecha recibida en DTO: " + dto.getFechaPlanilla());
        System.out.println("📋 [SERVICE] Zona horaria del usuario: " + dto.getZonaHoraria());
        System.out.println("📋 [SERVICE] Fecha actual del servidor: " + java.time.LocalDateTime.now());
        System.out.println("📋 [SERVICE] Zona horaria del servidor: " + java.time.ZoneId.systemDefault());
        
        // Guardar la fecha exacta que envía el usuario (sin convertir a UTC)
        LocalDateTime fechaPlanilla;
        if (dto.getFechaPlanilla() != null) {
            // Parsear la fecha ISO string a LocalDateTime
            String fechaString = dto.getFechaPlanilla();
            System.out.println("📋 [SERVICE] Fecha string original: " + fechaString);
            
            if (fechaString.endsWith("Z")) {
                fechaString = fechaString.substring(0, fechaString.length() - 1);
                System.out.println("📋 [SERVICE] Fecha string después de remover Z: " + fechaString);
            }
            
            fechaPlanilla = LocalDateTime.parse(fechaString, DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"));
            System.out.println("📋 [SERVICE] Fecha parseada como LocalDateTime: " + fechaPlanilla);
            System.out.println("📋 [SERVICE] Guardando fecha exacta del usuario (sin conversión UTC)");
        } else {
            fechaPlanilla = LocalDateTime.now();
            System.out.println("📋 [SERVICE] Fecha nula, usando fecha actual: " + fechaPlanilla);
        }
        
        PlanillaPedido planilla = new PlanillaPedido(empresa, usuario, fechaPlanilla);
        planilla.setObservaciones(dto.getObservaciones());
        planilla.setTransporte(dto.getTransporte());

        // Generar número de planilla automáticamente si no se proporciona uno
        if (dto.getNumeroPlanilla() != null && !dto.getNumeroPlanilla().isEmpty()) {
            planilla.setNumeroPlanilla(dto.getNumeroPlanilla());
        } else {
            // Generar número de planilla automático único
            String numeroPlanillaAuto = generarNumeroPlanillaUnico(empresaId);
            planilla.setNumeroPlanilla(numeroPlanillaAuto);
            System.out.println("📋 [PEDIDO] Generando número de planilla automático: " + numeroPlanillaAuto);
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
     * Generar un número de planilla único para una empresa
     */
    private String generarNumeroPlanillaUnico(Long empresaId) {
        int maxIntentos = 20;
        int intento = 0;
        
        while (intento < maxIntentos) {
            // Generar número basado en timestamp + empresaId + intento
            long timestamp = System.currentTimeMillis();
            String numero = String.format("PED%06d%02d", 
                (timestamp % 1000000), // Últimos 6 dígitos del timestamp
                (intento % 100)); // 2 dígitos del intento
            
            // Verificar si el número ya existe
            if (!planillaPedidoRepository.existsByNumeroPlanilla(numero)) {
                return numero;
            }
            
            intento++;
            // Pequeña pausa para evitar colisiones en sistemas muy rápidos
            try {
                Thread.sleep(1);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
        
        // Si después de 20 intentos no se encuentra un número único, usar timestamp completo
        return "PED" + System.currentTimeMillis();
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
                planilla.getTransporte(),
                planilla.getFechaPlanilla().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")),
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
            try {
                LocalDateTime fechaPlanilla = LocalDateTime.parse(dto.getFechaPlanilla(), DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss"));
                planilla.setFechaPlanilla(fechaPlanilla);
            } catch (Exception e) {
                throw new RuntimeException("Error al parsear la fecha de la planilla: " + dto.getFechaPlanilla(), e);
            }
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
     * Descontar cantidad del stock de un producto usando sincronización inteligente
     * Este método utiliza el StockSincronizacionService para descontar stock de manera inteligente
     * priorizando productos sin sector, luego sectores con menos stock, y finalmente sectores con más stock
     */
    private void descontarDelStock(Producto producto, Integer cantidad) {
        if (producto.getStock() != null && cantidad != null && cantidad > 0) {
            try {
                System.out.println("🔄 PLANILLA PEDIDO - Iniciando descuento inteligente de stock");
                System.out.println("🔄 PLANILLA PEDIDO - Producto: " + producto.getNombre() + " (ID: " + producto.getId() + ")");
                System.out.println("🔄 PLANILLA PEDIDO - Cantidad a descontar: " + cantidad);
                System.out.println("🔄 PLANILLA PEDIDO - Stock actual: " + producto.getStock());
                System.out.println("🔄 PLANILLA PEDIDO - Empresa: " + producto.getEmpresa().getId());
                
                // Usar el sistema de sincronización inteligente
                Map<String, Object> resultado = stockSincronizacionService.descontarStockInteligente(
                    producto.getEmpresa().getId(),
                    producto.getId(),
                    cantidad,
                    "Carga de planilla de pedido"
                );
                
                System.out.println("✅ PLANILLA PEDIDO - Descuento inteligente completado exitosamente");
                System.out.println("✅ PLANILLA PEDIDO - Resultado: " + resultado);
                
            } catch (Exception e) {
                System.err.println("❌ PLANILLA PEDIDO - Error en descuento inteligente: " + e.getMessage());
                e.printStackTrace();
                
                // Fallback: Si hay error en la sincronización inteligente, usar el método tradicional
                System.out.println("⚠️ PLANILLA PEDIDO - Usando método tradicional como fallback");
                int nuevoStock = producto.getStock() - cantidad;
                if (nuevoStock < 0) {
                    throw new RuntimeException("Stock insuficiente para el producto: " + producto.getNombre() + 
                        ". Stock disponible: " + producto.getStock() + ", Cantidad solicitada: " + cantidad);
                }
                producto.setStock(nuevoStock);
                productoRepository.save(producto);
                System.out.println("⚠️ PLANILLA PEDIDO - Stock actualizado usando método tradicional: " + nuevoStock);
            }
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

            if (planilla.getTransporte() != null && !planilla.getTransporte().isEmpty()) {
                rowNum++;
                Row transRow = sheet.createRow(rowNum++);
                transRow.createCell(0).setCellValue("Transporte:");
                transRow.createCell(1).setCellValue(planilla.getTransporte());
                sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowNum-1, rowNum-1, 1, 3));
                
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
                                        sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(rowNum-1, rowNum-1, 1, 3));
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
        dto.setFechaPlanilla(planilla.getFechaPlanilla().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")));
        dto.setObservaciones(planilla.getObservaciones());
        dto.setTransporte(planilla.getTransporte());
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
    
    /**
     * Convierte una fecha de la zona horaria del usuario a UTC
     */
    private LocalDateTime convertirFechaUsuarioAUTC(LocalDateTime fechaUsuario, String zonaHorariaUsuario) {
        if (fechaUsuario == null || zonaHorariaUsuario == null) {
            System.out.println("⚠️ [DEBUG] Fecha o zona horaria nula en convertirFechaUsuarioAUTC");
            return fechaUsuario;
        }
        
        try {
            ZoneId zonaUsuario = ZoneId.of(zonaHorariaUsuario);
            ZonedDateTime fechaZonada = fechaUsuario.atZone(zonaUsuario);
            ZonedDateTime fechaUTC = fechaZonada.withZoneSameInstant(ZoneId.of("UTC"));
            LocalDateTime resultado = fechaUTC.toLocalDateTime();
            
            System.out.println("🔍 [DEBUG] convertirFechaUsuarioAUTC:");
            System.out.println("  - fechaUsuario: " + fechaUsuario);
            System.out.println("  - zonaHorariaUsuario: " + zonaHorariaUsuario);
            System.out.println("  - zonaUsuario: " + zonaUsuario);
            System.out.println("  - fechaZonada: " + fechaZonada);
            System.out.println("  - fechaUTC: " + fechaUTC);
            System.out.println("  - resultado: " + resultado);
            
            return resultado;
        } catch (Exception e) {
            System.out.println("⚠️ Error convirtiendo fecha de usuario a UTC: " + e.getMessage());
            return fechaUsuario;
        }
    }
    
    /**
     * Convierte una fecha UTC a la zona horaria del usuario
     */
    private LocalDateTime convertirFechaUTCAUsuario(LocalDateTime fechaUTC, String zonaHorariaUsuario) {
        if (fechaUTC == null || zonaHorariaUsuario == null) {
            return fechaUTC;
        }
        
        try {
            ZoneId zonaUsuario = ZoneId.of(zonaHorariaUsuario);
            ZonedDateTime fechaZonadaUTC = fechaUTC.atZone(ZoneId.of("UTC"));
            ZonedDateTime fechaUsuario = fechaZonadaUTC.withZoneSameInstant(zonaUsuario);
            return fechaUsuario.toLocalDateTime();
        } catch (Exception e) {
            System.out.println("⚠️ Error convirtiendo fecha UTC a usuario: " + e.getMessage());
            return fechaUTC;
        }
    }
}

