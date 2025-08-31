package com.minegocio.backend.servicios;

import com.minegocio.backend.dto.DetalleRemitoIngresoDTO;
import com.minegocio.backend.dto.RemitoIngresoDTO;
import com.minegocio.backend.entidades.DetalleRemitoIngreso;
import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Producto;
import com.minegocio.backend.entidades.RemitoIngreso;
import com.minegocio.backend.entidades.Usuario;
import com.minegocio.backend.repositorios.DetalleRemitoIngresoRepository;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.ProductoRepository;
import com.minegocio.backend.repositorios.RemitoIngresoRepository;
import com.minegocio.backend.repositorios.UsuarioRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class RemitoIngresoService {
    
    @Autowired
    private RemitoIngresoRepository remitoIngresoRepository;
    
    @Autowired
    private DetalleRemitoIngresoRepository detalleRemitoIngresoRepository;
    
    @Autowired
    private EmpresaRepository empresaRepository;
    
    @Autowired
    private ProductoRepository productoRepository;
    
    @Autowired
    private UsuarioRepository usuarioRepository;
    
    // Obtener todos los remitos de una empresa
    public List<RemitoIngresoDTO> obtenerRemitosPorEmpresa(Long empresaId) {
        System.out.println("=== DEBUG RemitoIngresoService.obtenerRemitosPorEmpresa ===");
        System.out.println("Buscando remitos para empresa ID: " + empresaId);
        
        List<RemitoIngreso> remitos = remitoIngresoRepository.findByEmpresaIdOrderByFechaCreacionDesc(empresaId);
        System.out.println("Remitos encontrados en BD: " + remitos.size());
        
        List<RemitoIngresoDTO> remitosDTO = remitos.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
        
        System.out.println("Remitos convertidos a DTO: " + remitosDTO.size());
        if (!remitosDTO.isEmpty()) {
            System.out.println("Primer remito: " + remitosDTO.get(0));
        }
        
        return remitosDTO;
    }
    
    // Obtener un remito por ID
    public Optional<RemitoIngresoDTO> obtenerRemitoPorId(Long id, Long empresaId) {
        Optional<RemitoIngreso> remito = remitoIngresoRepository.findById(id);
        if (remito.isPresent() && remito.get().getEmpresa().getId().equals(empresaId)) {
            return Optional.of(convertirADTO(remito.get()));
        }
        return Optional.empty();
    }
    
    // Crear un nuevo remito
    @Transactional
    public RemitoIngresoDTO crearRemito(RemitoIngresoDTO remitoDTO) {
        System.out.println("=== DEBUG RemitoIngresoService.crearRemito ===");
        System.out.println("RemitoDTO recibido: " + remitoDTO);
        
        // Validaciones básicas
        if (remitoDTO == null) {
            throw new RuntimeException("Los datos del remito no pueden ser nulos");
        }
        
        if (remitoDTO.getEmpresaId() == null) {
            throw new RuntimeException("El ID de empresa es obligatorio");
        }
        
        if (remitoDTO.getUsuarioId() == null) {
            throw new RuntimeException("El ID de usuario es obligatorio");
        }
        
        if (remitoDTO.getFechaRemito() == null) {
            throw new RuntimeException("La fecha del remito es obligatoria");
        }
        
        System.out.println("📋 [SERVICE] Fecha remito recibida: " + remitoDTO.getFechaRemito());
        System.out.println("📋 [SERVICE] Zona horaria del usuario: " + remitoDTO.getZonaHoraria());
        System.out.println("📋 [SERVICE] Fecha actual del servidor: " + java.time.LocalDateTime.now());
        System.out.println("📋 [SERVICE] Zona horaria del servidor: " + java.time.ZoneId.systemDefault());
        
        // Validar que la empresa existe
        Optional<Empresa> empresa = empresaRepository.findById(remitoDTO.getEmpresaId());
        if (!empresa.isPresent()) {
            throw new RuntimeException("Empresa no encontrada con ID: " + remitoDTO.getEmpresaId());
        }
        
        // Validar que el usuario existe
        Optional<Usuario> usuario = usuarioRepository.findById(remitoDTO.getUsuarioId());
        if (!usuario.isPresent()) {
            throw new RuntimeException("Usuario no encontrado con ID: " + remitoDTO.getUsuarioId());
        }
        
        // Validar que el usuario pertenece a la empresa
        if (usuario.get().getEmpresa() == null || !usuario.get().getEmpresa().getId().equals(remitoDTO.getEmpresaId())) {
            throw new RuntimeException("El usuario no pertenece a la empresa especificada");
        }
        
        // Validar que el número de remito no existe para esta empresa
        if (remitoDTO.getNumeroRemito() != null && !remitoDTO.getNumeroRemito().trim().isEmpty()) {
            if (remitoIngresoRepository.existsByNumeroRemitoAndEmpresaId(remitoDTO.getNumeroRemito().trim(), remitoDTO.getEmpresaId())) {
                throw new RuntimeException("Ya existe un remito con el número '" + remitoDTO.getNumeroRemito() + "' para esta empresa");
            }
        } else {
            throw new RuntimeException("El número de remito es obligatorio");
        }
        
        // Crear el remito
        RemitoIngreso remito = new RemitoIngreso();
        remito.setNumeroRemito(remitoDTO.getNumeroRemito());
        
        // Parsear la fecha string a LocalDateTime
        LocalDateTime fechaRemito;
        if (remitoDTO.getFechaRemito() != null) {
            String fechaString = remitoDTO.getFechaRemito();
            System.out.println("📋 [SERVICE] Fecha string original: " + fechaString);
            
            if (fechaString.endsWith("Z")) {
                fechaString = fechaString.substring(0, fechaString.length() - 1);
                System.out.println("📋 [SERVICE] Fecha string después de remover Z: " + fechaString);
            }
            
            fechaRemito = LocalDateTime.parse(fechaString);
            System.out.println("📋 [SERVICE] Fecha parseada como LocalDateTime: " + fechaRemito);
            System.out.println("📋 [SERVICE] Guardando fecha exacta del usuario (sin conversión UTC)");
        } else {
            fechaRemito = LocalDateTime.now();
            System.out.println("📋 [SERVICE] Fecha nula, usando fecha actual: " + fechaRemito);
        }
        
        remito.setFechaRemito(fechaRemito);
        remito.setObservaciones(remitoDTO.getObservaciones());
        remito.setTotalProductos(remitoDTO.getTotalProductos());
        remito.setEmpresa(empresa.get());
        remito.setUsuario(usuario.get());
        
        // Establecer fechaCreacion manualmente usando la hora local del usuario
        // en lugar de dejar que @CreationTimestamp use la hora del servidor
        if (remitoDTO.getZonaHoraria() != null && !remitoDTO.getZonaHoraria().trim().isEmpty()) {
            try {
                // Usar la zona horaria del usuario para crear la fecha de creación
                java.time.ZoneId zonaUsuario = java.time.ZoneId.of(remitoDTO.getZonaHoraria());
                java.time.ZonedDateTime fechaCreacionUsuario = java.time.ZonedDateTime.now(zonaUsuario);
                LocalDateTime fechaCreacionLocal = fechaCreacionUsuario.toLocalDateTime();
                remito.setFechaCreacion(fechaCreacionLocal);
                System.out.println("📋 [SERVICE] Fecha creación establecida manualmente: " + fechaCreacionLocal);
            } catch (Exception e) {
                System.out.println("⚠️ [SERVICE] Error al establecer fecha creación manual, usando fecha del servidor: " + e.getMessage());
                // Si hay error, usar la fecha del servidor (comportamiento por defecto)
            }
        } else {
            System.out.println("⚠️ [SERVICE] No se especificó zona horaria, usando fecha del servidor");
        }
        
        remito = remitoIngresoRepository.save(remito);
        
        // Crear los detalles
        if (remitoDTO.getDetalles() != null && !remitoDTO.getDetalles().isEmpty()) {
            for (DetalleRemitoIngresoDTO detalleDTO : remitoDTO.getDetalles()) {
                // Validar datos del detalle
                if (detalleDTO.getDescripcion() == null || detalleDTO.getDescripcion().trim().isEmpty()) {
                    throw new RuntimeException("La descripción del detalle es obligatoria");
                }
                
                if (detalleDTO.getCantidad() == null || detalleDTO.getCantidad() <= 0) {
                    throw new RuntimeException("La cantidad del detalle debe ser mayor a 0");
                }
                
                DetalleRemitoIngreso detalle = new DetalleRemitoIngreso();
                detalle.setRemitoIngreso(remito);
                detalle.setDescripcion(detalleDTO.getDescripcion().trim());
                detalle.setCantidad(detalleDTO.getCantidad());
                detalle.setObservaciones(detalleDTO.getObservaciones() != null ? detalleDTO.getObservaciones().trim() : null);
                detalle.setCodigoPersonalizado(detalleDTO.getCodigoPersonalizado() != null ? detalleDTO.getCodigoPersonalizado().trim() : null);
                
                // Asociar el producto si existe
                if (detalleDTO.getProductoId() != null) {
                    Optional<Producto> producto = productoRepository.findById(detalleDTO.getProductoId());
                    if (producto.isPresent()) {
                        // Validar que el producto pertenece a la empresa
                        if (!producto.get().getEmpresa().getId().equals(remitoDTO.getEmpresaId())) {
                            throw new RuntimeException("El producto con ID " + detalleDTO.getProductoId() + " no pertenece a la empresa");
                        }
                        
                        detalle.setProducto(producto.get());
                        detalle.setNombreProducto(producto.get().getNombre());
                        detalle.setDescripcionProducto(producto.get().getDescripcion());
                        detalle.setCategoriaProducto(producto.get().getCategoria());
                        detalle.setMarcaProducto(producto.get().getMarca());
                        
                        // Actualizar el stock del producto
                        Producto productoActualizado = producto.get();
                        productoActualizado.setStock(productoActualizado.getStock() + detalleDTO.getCantidad());
                        productoRepository.save(productoActualizado);
                    } else {
                        throw new RuntimeException("Producto no encontrado con ID: " + detalleDTO.getProductoId());
                    }
                } else {
                    // Si no hay producto, usar la descripción como nombre del producto
                    detalle.setNombreProducto(detalleDTO.getDescripcion().trim());
                }
                
                detalleRemitoIngresoRepository.save(detalle);
            }
        }
        
        System.out.println("=== DEBUG RemitoIngresoService.crearRemito - FINALIZADO ===");
        System.out.println("Remito creado con ID: " + remito.getId());
        
        return convertirADTO(remito);
    }
    
    // Eliminar un remito
    @Transactional
    public void eliminarRemito(Long id, Long empresaId) {
        Optional<RemitoIngreso> remito = remitoIngresoRepository.findById(id);
        if (remito.isPresent() && remito.get().getEmpresa().getId().equals(empresaId)) {
            // Restaurar el stock de los productos
            List<DetalleRemitoIngreso> detalles = detalleRemitoIngresoRepository.findByRemitoIngresoIdOrderByFechaCreacionAsc(id);
            for (DetalleRemitoIngreso detalle : detalles) {
                if (detalle.getProducto() != null) {
                    Producto producto = detalle.getProducto();
                    producto.setStock(producto.getStock() - detalle.getCantidad());
                    productoRepository.save(producto);
                }
            }
            
            remitoIngresoRepository.deleteById(id);
        } else {
            throw new RuntimeException("Remito no encontrado");
        }
    }
    
    // Buscar remitos por fecha
    public List<RemitoIngresoDTO> buscarPorFecha(LocalDateTime fecha, Long empresaId) {
        List<RemitoIngreso> remitos = remitoIngresoRepository.findByFechaRemitoAndEmpresaId(fecha, empresaId);
        return remitos.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }
    
    // Buscar remitos por rango de fechas
    public List<RemitoIngresoDTO> buscarPorRangoFechas(LocalDateTime fechaInicio, LocalDateTime fechaFin, Long empresaId) {
        List<RemitoIngreso> remitos = remitoIngresoRepository.findByRangoFechasAndEmpresaId(fechaInicio, fechaFin, empresaId);
        return remitos.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }
    
    // Buscar remitos por texto
    public List<RemitoIngresoDTO> buscarPorTexto(String busqueda, Long empresaId) {
        List<RemitoIngreso> remitos = remitoIngresoRepository.findByBusquedaAndEmpresaId(busqueda, empresaId);
        return remitos.stream()
                .map(this::convertirADTO)
                .collect(Collectors.toList());
    }
    
    // Exportar remito a Excel
    public byte[] exportarRemitoAExcel(Long remitoId, Long empresaId) throws IOException {
        Optional<RemitoIngreso> remitoOpt = remitoIngresoRepository.findById(remitoId);
        if (!remitoOpt.isPresent() || !remitoOpt.get().getEmpresa().getId().equals(empresaId)) {
            throw new RuntimeException("Remito no encontrado");
        }
        
        RemitoIngreso remito = remitoOpt.get();
        List<DetalleRemitoIngreso> detalles = detalleRemitoIngresoRepository.findByRemitoIngresoIdOrderByFechaCreacionAsc(remitoId);
        
        try (Workbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Remito de Ingreso");
            
            // Estilos
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);
            
            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleStyle.setFont(titleFont);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);
            
            CellStyle borderStyle = workbook.createCellStyle();
            borderStyle.setBorderTop(BorderStyle.THIN);
            borderStyle.setBorderBottom(BorderStyle.THIN);
            borderStyle.setBorderLeft(BorderStyle.THIN);
            borderStyle.setBorderRight(BorderStyle.THIN);
            
            // Título
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("REMITO DE INGRESO");
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 5));
            
            // Información del remito
            int rowNum = 2;
            
            Row infoRow1 = sheet.createRow(rowNum++);
            infoRow1.createCell(0).setCellValue("Número de Remito:");
            infoRow1.createCell(1).setCellValue(remito.getNumeroRemito());
            infoRow1.createCell(2).setCellValue("Fecha:");
            infoRow1.createCell(3).setCellValue(remito.getFechaRemito().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")));
            
            Row infoRow2 = sheet.createRow(rowNum++);
            infoRow2.createCell(0).setCellValue("Empresa:");
            infoRow2.createCell(1).setCellValue(remito.getEmpresa().getNombre());
            infoRow2.createCell(2).setCellValue("Cantidad de Productos:");
            infoRow2.createCell(3).setCellValue(detalles.size());
            
            Row infoRow3 = sheet.createRow(rowNum++);
            infoRow3.createCell(0).setCellValue("Total de Unidades:");
            infoRow3.createCell(1).setCellValue(remito.getTotalProductos());
            
            if (remito.getObservaciones() != null && !remito.getObservaciones().isEmpty()) {
                Row obsRow = sheet.createRow(rowNum++);
                obsRow.createCell(0).setCellValue("Observaciones:");
                obsRow.createCell(1).setCellValue(remito.getObservaciones());
                sheet.addMergedRegion(new CellRangeAddress(rowNum-1, rowNum-1, 1, 5));
            }
            
            rowNum++; // Espacio
            
            // Encabezados de la tabla
            Row headerRow = sheet.createRow(rowNum++);
            String[] headers = {"#", "Código", "Descripción", "Cantidad", "Observaciones"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }
            
            // Datos de los productos
            int itemNum = 1;
            for (DetalleRemitoIngreso detalle : detalles) {
                Row dataRow = sheet.createRow(rowNum++);
                
                dataRow.createCell(0).setCellValue(itemNum++);
                dataRow.createCell(1).setCellValue(detalle.getCodigoPersonalizado() != null ? detalle.getCodigoPersonalizado() : "");
                dataRow.createCell(2).setCellValue(detalle.getDescripcion());
                dataRow.createCell(3).setCellValue(detalle.getCantidad());
                dataRow.createCell(4).setCellValue(detalle.getObservaciones() != null ? detalle.getObservaciones() : "");
                
                // Aplicar bordes
                for (int i = 0; i < 5; i++) {
                    dataRow.getCell(i).setCellStyle(borderStyle);
                }
            }
            
            // Ajustar ancho de columnas
            sheet.setColumnWidth(0, 1000);  // #
            sheet.setColumnWidth(1, 4000);  // Código
            sheet.setColumnWidth(2, 15000); // Descripción
            sheet.setColumnWidth(3, 3000);  // Cantidad
            sheet.setColumnWidth(4, 8000);  // Observaciones
            
            // Generar el archivo
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            workbook.write(outputStream);
            return outputStream.toByteArray();
        }
    }
    
    // Métodos de conversión
    private RemitoIngresoDTO convertirADTO(RemitoIngreso remito) {
        System.out.println("=== DEBUG convertirADTO ===");
        System.out.println("Convirtiendo remito ID: " + remito.getId());
        System.out.println("Número remito: " + remito.getNumeroRemito());
        System.out.println("Fecha remito: " + remito.getFechaRemito());
        
        List<DetalleRemitoIngresoDTO> detallesDTO = detalleRemitoIngresoRepository
                .findByRemitoIngresoIdOrderByFechaCreacionAsc(remito.getId())
                .stream()
                .map(this::convertirDetalleADTO)
                .collect(Collectors.toList());
        
        System.out.println("Detalles encontrados: " + detallesDTO.size());
        
        RemitoIngresoDTO dto = new RemitoIngresoDTO(
                remito.getId(),
                remito.getNumeroRemito(),
                remito.getFechaRemito().format(DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss")),
                remito.getObservaciones(),
                remito.getTotalProductos(),
                remito.getFechaCreacion(),
                remito.getFechaActualizacion(),
                remito.getEmpresa().getId(),
                remito.getUsuario().getId(),
                detallesDTO,
                null // zonaHoraria no está disponible en la entidad, se establece desde el frontend
        );
        
        System.out.println("DTO creado: " + dto);
        return dto;
    }
    
    private DetalleRemitoIngresoDTO convertirDetalleADTO(DetalleRemitoIngreso detalle) {
        return new DetalleRemitoIngresoDTO(
                detalle.getId(),
                detalle.getRemitoIngreso().getId(),
                detalle.getProducto() != null ? detalle.getProducto().getId() : null,
                detalle.getCodigoPersonalizado(),
                detalle.getDescripcion(),
                detalle.getCantidad(),
                detalle.getObservaciones(),
                detalle.getFechaCreacion()
        );
    }
}
