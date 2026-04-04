package com.minegocio.backend.controladores;

import com.minegocio.backend.dto.SectorDTO;
import com.minegocio.backend.dto.StockPorSectorDTO;
import com.minegocio.backend.entidades.Sector;
import com.minegocio.backend.entidades.StockPorSector;
import com.minegocio.backend.entidades.Usuario;
import com.minegocio.backend.servicios.SectorService;
import com.minegocio.backend.servicios.StockSincronizacionService;
import com.minegocio.backend.repositorios.UsuarioRepository;
import com.minegocio.backend.repositorios.SectorRepository;
import com.minegocio.backend.seguridad.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.annotation.PostConstruct;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.entidades.Producto;
import com.minegocio.backend.repositorios.ProductoRepository;
import com.minegocio.backend.repositorios.StockPorSectorRepository;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Date;
import java.util.ArrayList;
import java.util.Set;
import java.util.Comparator;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import java.io.ByteArrayOutputStream;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

@RestController
@RequestMapping("/api/empresas/{empresaId}/sectores")
@CrossOrigin(origins = {"http://localhost:5173", "http://*.localhost:5173", "https://*.localhost:5173", "https://negocio360-frontend.onrender.com", "https://www.negocio360.org", "https://negocio360-backend.onrender.com", "https://minegocio-backend-production.up.railway.app"}, allowedHeaders = "*")
public class SectorController {
    
    @PostConstruct
    public void init() {
        System.out.println("🚀 SectorController inicializado");
        System.out.println("🚀 Mapeo de rutas: /api/empresas/{empresaId}/sectores");
    }
    
    @Autowired
    private SectorService sectorService;
    
    @Autowired
    private EmpresaRepository empresaRepository;
    
    @Autowired
    private ProductoRepository productoRepository;
    
    @Autowired
    private SectorRepository sectorRepository;
    
    @Autowired
    private StockPorSectorRepository stockPorSectorRepository;
    
    @Autowired
    private StockSincronizacionService stockSincronizacionService;
    
    @Autowired
    private UsuarioRepository usuarioRepository;
    
    @Autowired
    private JwtUtils jwtUtil;
    
    // Métodos de conversión
    private SectorDTO convertirASectorDTO(Sector sector) {
        return new SectorDTO(
            sector.getId(),
            sector.getNombre(),
            sector.getDescripcion(),
            sector.getUbicacion(),
            sector.getActivo(),
            sector.getFechaCreacion(),
            sector.getFechaActualizacion()
        );
    }
    
    private StockPorSectorDTO convertirAStockPorSectorDTO(StockPorSector stockPorSector) {
        try {
            return new StockPorSectorDTO(
                stockPorSector.getId(),
                new StockPorSectorDTO.ProductoSimpleDTO(
                    stockPorSector.getProducto().getId(),
                    stockPorSector.getProducto().getNombre(),
                    stockPorSector.getProducto().getCodigoPersonalizado()
                ),
                new StockPorSectorDTO.SectorSimpleDTO(
                    stockPorSector.getSector().getId(),
                    stockPorSector.getSector().getNombre()
                ),
                stockPorSector.getCantidad(),
                stockPorSector.getFechaActualizacion()
            );
        } catch (Exception e) {
            System.err.println("Error al convertir StockPorSector a DTO: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error al convertir datos del sector", e);
        }
    }
    
    /**
     * Crear un nuevo sector
     */
    @PostMapping
    public ResponseEntity<?> crearSector(
            @PathVariable Long empresaId,
            @RequestBody Map<String, String> request) {
        try {
            String nombre = request.get("nombre");
            String descripcion = request.get("descripcion");
            String ubicacion = request.get("ubicacion");
            
            if (nombre == null || nombre.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "El nombre del sector es obligatorio"
                ));
            }
            
            Sector sector = sectorService.crearSector(nombre, descripcion, ubicacion, empresaId);
            SectorDTO sectorDTO = convertirASectorDTO(sector);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Sector creado exitosamente",
                "data", sectorDTO
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage()
            ));
        }
    }
    
    /**
     * Obtener todos los sectores activos
     */
    @GetMapping
    public ResponseEntity<?> obtenerSectores(@PathVariable Long empresaId) {
        System.out.println("=== DEBUG SECTOR CONTROLLER ===");
        System.out.println("EmpresaId recibido: " + empresaId);
        try {
            List<Sector> sectores = sectorService.obtenerSectoresActivos(empresaId);
            System.out.println("Sectores encontrados: " + sectores.size());
            
            List<SectorDTO> sectoresDTO = sectores.stream()
                .map(this::convertirASectorDTO)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Sectores obtenidos exitosamente",
                "data", sectoresDTO
            ));
        } catch (Exception e) {
            System.out.println("Error al obtener sectores: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Error al obtener sectores: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Obtener todos los sectores (activos e inactivos)
     */
    @GetMapping("/todos")
    public ResponseEntity<?> obtenerTodosLosSectores(@PathVariable Long empresaId) {
        try {
            List<Sector> sectores = sectorService.obtenerTodosLosSectores(empresaId);
            
            List<SectorDTO> sectoresDTO = sectores.stream()
                .map(this::convertirASectorDTO)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Sectores obtenidos exitosamente",
                "data", sectoresDTO
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Error al obtener sectores: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Actualizar un sector
     */
    @PutMapping("/{sectorId}")
    public ResponseEntity<?> actualizarSector(
            @PathVariable Long empresaId,
            @PathVariable Long sectorId,
            @RequestBody Map<String, String> request) {
        try {
            String nombre = request.get("nombre");
            String descripcion = request.get("descripcion");
            String ubicacion = request.get("ubicacion");
            
            if (nombre == null || nombre.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "El nombre del sector es obligatorio"
                ));
            }
            
            Sector sector = sectorService.actualizarSector(sectorId, nombre, descripcion, ubicacion);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Sector actualizado exitosamente",
                "data", sector
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage()
            ));
        }
    }
    
    /**
     * Cambiar estado de un sector
     */
    @PatchMapping("/{sectorId}/estado")
    public ResponseEntity<?> cambiarEstadoSector(
            @PathVariable Long empresaId,
            @PathVariable Long sectorId,
            @RequestBody Map<String, Boolean> request) {
        try {
            Boolean activo = request.get("activo");
            
            if (activo == null) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "El estado es obligatorio"
                ));
            }
            
            Sector sector = sectorService.cambiarEstadoSector(sectorId, activo);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Estado del sector actualizado exitosamente",
                "data", sector
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage()
            ));
        }
    }
    
    /**
     * Asignar stock a un sector
     */
    @PostMapping("/{sectorId}/productos/{productoId}/stock")
    public ResponseEntity<?> asignarStock(
            @PathVariable Long empresaId,
            @PathVariable Long sectorId,
            @PathVariable Long productoId,
            @RequestBody Map<String, Integer> request) {
        try {
            Integer cantidad = request.get("cantidad");
            
            if (cantidad == null || cantidad < 0) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "La cantidad debe ser mayor o igual a 0"
                ));
            }
            
            StockPorSector stockPorSector = sectorService.asignarStock(productoId, sectorId, cantidad);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Stock asignado exitosamente",
                "data", stockPorSector
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage()
            ));
        }
    }
    
    /**
     * Mover stock entre sectores
     */
    @PostMapping("/mover-stock")
    public ResponseEntity<?> moverStock(
            @PathVariable Long empresaId,
            @RequestBody Map<String, Object> request) {
        try {
            Long productoId = Long.valueOf(request.get("productoId").toString());
            Long sectorOrigenId = Long.valueOf(request.get("sectorOrigenId").toString());
            Long sectorDestinoId = Long.valueOf(request.get("sectorDestinoId").toString());
            Integer cantidad = Integer.valueOf(request.get("cantidad").toString());
            
            if (cantidad <= 0) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "La cantidad debe ser mayor a 0"
                ));
            }
            
            sectorService.moverStock(productoId, sectorOrigenId, sectorDestinoId, cantidad);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Stock movido exitosamente"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", e.getMessage()
            ));
        }
    }
    
    /**
     * Obtener stock de un producto por sectores
     */
    @GetMapping("/productos/{productoId}/stock")
    public ResponseEntity<?> obtenerStockPorSectores(
            @PathVariable Long empresaId,
            @PathVariable Long productoId) {
        try {
            List<StockPorSector> stockPorSectores = sectorService.obtenerStockPorSectores(productoId);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Stock por sectores obtenido exitosamente",
                "data", stockPorSectores
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Error al obtener stock por sectores: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Obtener productos en un sector
     */
    @GetMapping("/{sectorId}/productos")
    public ResponseEntity<?> obtenerProductosEnSector(
            @PathVariable Long empresaId,
            @PathVariable Long sectorId) {
        try {
            List<StockPorSector> productosEnSector = sectorService.obtenerProductosEnSector(sectorId, empresaId);
            
            List<StockPorSectorDTO> productosDTO = productosEnSector.stream()
                .map(this::convertirAStockPorSectorDTO)
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Productos en sector obtenidos exitosamente",
                "data", productosDTO
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Error al obtener productos en sector: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Obtener estadísticas de sectores
     */
    @GetMapping("/estadisticas")
    public ResponseEntity<?> obtenerEstadisticas(@PathVariable Long empresaId) {
        try {
            Map<String, Object> estadisticas = sectorService.obtenerEstadisticasSectores(empresaId);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Estadísticas obtenidas exitosamente",
                "data", estadisticas
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Error al obtener estadísticas: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Exportar productos del sector a Excel
     */
    @GetMapping("/{sectorId}/productos/exportar-excel")
    public ResponseEntity<byte[]> exportarProductosSectorExcel(
            @PathVariable Long empresaId,
            @PathVariable Long sectorId) {
        try {
            // Configurar sistema para modo headless (sin interfaz gráfica)
            System.setProperty("java.awt.headless", "true");
            
            System.out.println("🔍 [CONTROLLER] Exportando productos del sector a Excel: " + sectorId);
            System.out.println("🔍 [CONTROLLER] Empresa ID: " + empresaId);
            
            // Obtener productos del sector
            List<StockPorSector> productosEnSector = sectorService.obtenerProductosEnSector(sectorId, empresaId);
            System.out.println("🔍 [CONTROLLER] Productos encontrados: " + productosEnSector.size());
            
            // Obtener información del sector
            Sector sector = sectorService.obtenerSectorPorId(sectorId);
            if (sector == null) {
                System.err.println("❌ [CONTROLLER] Sector no encontrado: " + sectorId);
                return ResponseEntity.notFound().build();
            }
            
            if (!sector.getEmpresa().getId().equals(empresaId)) {
                System.err.println("❌ [CONTROLLER] El sector no pertenece a la empresa. Sector empresa: " + sector.getEmpresa().getId() + ", Empresa solicitada: " + empresaId);
                return ResponseEntity.badRequest().build();
            }
            
            System.out.println("🔍 [CONTROLLER] Sector encontrado: " + sector.getNombre());
            
            // Crear el workbook de Excel
            try (XSSFWorkbook workbook = new XSSFWorkbook()) {
                Sheet sheet = workbook.createSheet("Productos del Sector");
                
                // Crear estilos
                CellStyle titleStyle = workbook.createCellStyle();
                Font titleFont = workbook.createFont();
                titleFont.setBold(true);
                titleFont.setFontHeightInPoints((short) 16);
                titleStyle.setFont(titleFont);
                titleStyle.setAlignment(HorizontalAlignment.CENTER);
                
                CellStyle headerStyle = workbook.createCellStyle();
                Font headerFont = workbook.createFont();
                headerFont.setBold(true);
                headerFont.setFontHeightInPoints((short) 12);
                headerStyle.setFont(headerFont);
                headerStyle.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
                headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
                headerStyle.setBorderBottom(BorderStyle.THIN);
                headerStyle.setBorderTop(BorderStyle.THIN);
                headerStyle.setBorderRight(BorderStyle.THIN);
                headerStyle.setBorderLeft(BorderStyle.THIN);
                
                // Crear título del sector
                Row titleRow = sheet.createRow(0);
                Cell titleCell = titleRow.createCell(0);
                titleCell.setCellValue("PRODUCTOS DEL SECTOR: " + sector.getNombre().toUpperCase());
                titleCell.setCellStyle(titleStyle);
                sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 2));
                
                // Crear encabezados
                Row headerRow = sheet.createRow(1);
                String[] headers = {"Código", "Producto", "Cantidad"};
                for (int i = 0; i < headers.length; i++) {
                    Cell cell = headerRow.createCell(i);
                    cell.setCellValue(headers[i]);
                    cell.setCellStyle(headerStyle);
                }
                
                // Llenar datos
                int rowNum = 2;
                for (StockPorSector stock : productosEnSector) {
                    Row row = sheet.createRow(rowNum++);
                    row.createCell(0).setCellValue(stock.getProducto().getCodigoPersonalizado() != null ? 
                        stock.getProducto().getCodigoPersonalizado() : "-");
                    row.createCell(1).setCellValue(stock.getProducto().getNombre());
                    row.createCell(2).setCellValue(stock.getCantidad());
                }
                
                // Configurar anchos de columnas fijos (evita problemas con autoSizeColumn en headless)
                sheet.setColumnWidth(0, 15 * 256); // Código - 15 caracteres
                sheet.setColumnWidth(1, 50 * 256); // Producto - 50 caracteres  
                sheet.setColumnWidth(2, 12 * 256); // Cantidad - 12 caracteres
                
                // Convertir a bytes
                ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
                workbook.write(outputStream);
                byte[] excelBytes = outputStream.toByteArray();
                
                String nombreArchivo = "productos_sector_" + sector.getNombre() + ".xlsx";
                
                HttpHeaders responseHeaders = new HttpHeaders();
                responseHeaders.setContentType(MediaType.APPLICATION_OCTET_STREAM);
                responseHeaders.setContentDispositionFormData("attachment", nombreArchivo);
                responseHeaders.setContentLength(excelBytes.length);
                
                System.out.println("✅ [CONTROLLER] Excel exportado exitosamente. Tamaño: " + excelBytes.length + " bytes");
                
                return ResponseEntity.ok()
                        .headers(responseHeaders)
                        .body(excelBytes);
            }
            
        } catch (Exception e) {
            System.err.println("❌ [CONTROLLER] Error al exportar productos del sector a Excel: " + e.getMessage());
            System.err.println("❌ [CONTROLLER] Stack trace completo:");
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "error", "Error interno del servidor: " + e.getMessage(),
                "details", e.getClass().getSimpleName()
            ).toString().getBytes());
        }
    }
    
    /**
     * MIGRACIÓN: Migrar sectores existentes
     * Este endpoint se ejecuta una sola vez
     */
    @PostMapping("/migrar")
    public ResponseEntity<?> migrarSectoresExistentes(@PathVariable Long empresaId) {
        try {
            sectorService.migrarSectoresExistentes(empresaId);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Migración de sectores completada exitosamente"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Error en la migración: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Obtener stock general de la empresa
     * Incluye productos con sector asignado y sin sector asignado
     */
    @GetMapping("/stock-general")
    public ResponseEntity<?> obtenerStockGeneral(@PathVariable Long empresaId) {
        try {
            // System.out.println("🔍 STOCK GENERAL - Endpoint llamado para empresa: " + empresaId);
            // System.out.println("🔍 STOCK GENERAL - Iniciando proceso...");
            // System.out.println("🔍 STOCK GENERAL - Timestamp: " + new java.util.Date());
            
            // Verificar que la empresa existe
            // System.out.println("🔍 STOCK GENERAL - Verificando empresa...");
            if (!empresaRepository.existsById(empresaId)) {
                System.err.println("🔍 STOCK GENERAL - Empresa no encontrada: " + empresaId);
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Empresa no encontrada con ID: " + empresaId
                ));
            }
            // System.out.println("🔍 STOCK GENERAL - Empresa encontrada: " + empresaId);
            
            List<Map<String, Object>> stockGeneral = sectorService.obtenerStockGeneral(empresaId);
            // System.out.println("🔍 STOCK GENERAL - Datos obtenidos: " + stockGeneral.size() + " items");
            
            // Log de los primeros 3 items para debug
            for (int i = 0; i < Math.min(3, stockGeneral.size()); i++) {
                // System.out.println("🔍 STOCK GENERAL - Item " + i + ": " + stockGeneral.get(i));
            }
            
            // System.out.println("🔍 STOCK GENERAL - Proceso completado exitosamente");
            return ResponseEntity.ok(Map.of(
                "mensaje", "Stock general obtenido exitosamente",
                "data", stockGeneral
            ));
        } catch (Exception e) {
            System.err.println("🔍 STOCK GENERAL - Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Error al obtener stock general: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Obtener stock detallado de la empresa
     * Incluye productos con sus ubicaciones y cantidades
     */
    @GetMapping("/stock/detallado")
    public ResponseEntity<?> obtenerStockDetallado(@PathVariable Long empresaId) {
        try {
            // System.out.println("🔍 STOCK DETALLADO - Endpoint llamado para empresa: " + empresaId);
            // System.out.println("🔍 STOCK DETALLADO - Iniciando proceso...");
            // System.out.println("🔍 STOCK DETALLADO - Timestamp: " + new java.util.Date());
            
            // Verificar que la empresa existe
            // System.out.println("🔍 STOCK DETALLADO - Verificando empresa...");
            if (!empresaRepository.existsById(empresaId)) {
                System.err.println("🔍 STOCK DETALLADO - Empresa no encontrada: " + empresaId);
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Empresa no encontrada con ID: " + empresaId
                ));
            }
            // System.out.println("🔍 STOCK DETALLADO - Empresa encontrada: " + empresaId);
            
            List<Map<String, Object>> stockDetallado = sectorService.obtenerStockDetallado(empresaId);
            // System.out.println("🔍 STOCK DETALLADO - Datos obtenidos: " + stockDetallado.size() + " items");
            
            // Log de los primeros 3 items para debug
            for (int i = 0; i < Math.min(3, stockDetallado.size()); i++) {
                // System.out.println("🔍 STOCK DETALLADO - Item " + i + ": " + stockDetallado.get(i));
            }
            
            // System.out.println("🔍 STOCK DETALLADO - Proceso completado exitosamente");
            return ResponseEntity.ok(stockDetallado);
        } catch (Exception e) {
            System.err.println("🔍 STOCK DETALLADO - Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Error al obtener stock detallado: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Asignar productos a un sector
     */
    @PostMapping("/{sectorId}/asignar-productos")
    public ResponseEntity<?> asignarProductosASector(
            @PathVariable Long empresaId,
            @PathVariable Long sectorId,
            @RequestBody Map<String, Object> request) {
        try {
            // System.out.println("🔍 ASIGNAR PRODUCTOS - Endpoint llamado");
            // System.out.println("🔍 ASIGNAR PRODUCTOS - Empresa: " + empresaId);
            // System.out.println("🔍 ASIGNAR PRODUCTOS - Sector: " + sectorId);
            // System.out.println("🔍 ASIGNAR PRODUCTOS - Request completo: " + request);
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> asignaciones = (List<Map<String, Object>>) request.get("asignaciones");
            
            if (asignaciones == null || asignaciones.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "No se proporcionaron asignaciones"
                ));
            }
            
            // System.out.println("🔍 ASIGNAR PRODUCTOS - Asignaciones recibidas: " + asignaciones.size());
            
            sectorService.asignarProductosASector(sectorId, empresaId, asignaciones);
            
            // System.out.println("🔍 ASIGNAR PRODUCTOS - Asignación completada, devolviendo respuesta");
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Productos asignados exitosamente al sector",
                "sectorId", sectorId,
                "asignacionesProcesadas", asignaciones.size()
            ));
        } catch (Exception e) {
            System.err.println("🔍 ASIGNAR PRODUCTOS - Error: " + e.getMessage());
            e.printStackTrace();
            
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Error al asignar productos: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Recibir productos en un sector
     */
    @PostMapping("/{sectorId}/recibir-productos")
    public ResponseEntity<?> recibirProductosEnSector(
            @PathVariable Long empresaId,
            @PathVariable Long sectorId,
            @RequestBody Map<String, Object> request,
            @RequestHeader("Authorization") String token) {
        try {
            // System.out.println("🔍 RECIBIR PRODUCTOS - Endpoint llamado");
            // System.out.println("🔍 RECIBIR PRODUCTOS - Empresa: " + empresaId);
            // System.out.println("🔍 RECIBIR PRODUCTOS - Sector: " + sectorId);
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> recepciones = (List<Map<String, Object>>) request.get("recepciones");
            
            if (recepciones == null || recepciones.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "No se proporcionaron recepciones"
                ));
            }
            
            // Obtener el usuario del token
            // Limpiar el token removiendo el prefijo "Bearer " si existe
            String cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;
            String email = jwtUtil.extractUsername(cleanToken);
            Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            
            // System.out.println("🔍 RECIBIR PRODUCTOS - Recepciones recibidas: " + recepciones.size());
            
            sectorService.recibirProductosEnSector(sectorId, empresaId, recepciones, usuario);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Productos recibidos exitosamente en el sector",
                "sectorId", sectorId,
                "recepcionesProcesadas", recepciones.size()
            ));
        } catch (Exception e) {
            System.err.println("🔍 RECIBIR PRODUCTOS - Error: " + e.getMessage());
            e.printStackTrace();
            
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Error al recibir productos: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Quitar un producto de un sector
     */
    @DeleteMapping("/{sectorId}/quitar-producto/{stockId}")
    public ResponseEntity<?> quitarProductoDeSector(
            @PathVariable Long empresaId,
            @PathVariable Long sectorId,
            @PathVariable Long stockId,
            @RequestHeader("Authorization") String token) {
        try {
            // System.out.println("🔍 QUITAR PRODUCTO - Endpoint llamado");
            // System.out.println("🔍 QUITAR PRODUCTO - Empresa: " + empresaId);
            // System.out.println("🔍 QUITAR PRODUCTO - Sector: " + sectorId);
            // System.out.println("🔍 QUITAR PRODUCTO - Stock ID: " + stockId);
            
            // Obtener el usuario del token
            // Limpiar el token removiendo el prefijo "Bearer " si existe
            String cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;
            String email = jwtUtil.extractUsername(cleanToken);
            Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            
            Map<String, Object> resultado = sectorService.quitarProductoDeSector(sectorId, empresaId, stockId, usuario);
            
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            System.err.println("🔍 QUITAR PRODUCTO - Error: " + e.getMessage());
            e.printStackTrace();
            
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Error al quitar producto: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Transferir stock entre sectores
     */
    @PostMapping("/transferir-stock")
    public ResponseEntity<?> transferirStockEntreSectores(
            @PathVariable Long empresaId,
            @RequestBody Map<String, Object> request,
            @RequestHeader("Authorization") String token) {
        try {
            // System.out.println("🔍 TRANSFERIR STOCK - Endpoint llamado");
            // System.out.println("🔍 TRANSFERIR STOCK - Empresa: " + empresaId);
            
            Long productoId = Long.valueOf(request.get("productoId").toString());
            Long sectorOrigenId = Long.valueOf(request.get("sectorOrigenId").toString());
            Long sectorDestinoId = Long.valueOf(request.get("sectorDestinoId").toString());
            Integer cantidad = Integer.valueOf(request.get("cantidad").toString());
            
            // Obtener el usuario del token
            // Limpiar el token removiendo el prefijo "Bearer " si existe
            String cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;
            String email = jwtUtil.extractUsername(cleanToken);
            Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            
            // System.out.println("🔍 TRANSFERIR STOCK - Producto: " + productoId);
            // System.out.println("🔍 TRANSFERIR STOCK - Sector Origen: " + sectorOrigenId);
            // System.out.println("🔍 TRANSFERIR STOCK - Sector Destino: " + sectorDestinoId);
            // System.out.println("🔍 TRANSFERIR STOCK - Cantidad: " + cantidad);
            
            sectorService.transferirStockEntreSectores(empresaId, productoId, sectorOrigenId, sectorDestinoId, cantidad, usuario);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Stock transferido exitosamente entre sectores",
                "productoId", productoId,
                "sectorOrigenId", sectorOrigenId,
                "sectorDestinoId", sectorDestinoId,
                "cantidad", cantidad
            ));
        } catch (Exception e) {
            System.err.println("🔍 TRANSFERIR STOCK - Error: " + e.getMessage());
            e.printStackTrace();
            
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Error al transferir stock: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Asignar producto desde Stock General a un sector
     */
    @PostMapping("/asignar-producto")
    public ResponseEntity<?> asignarProductoASector(
            @PathVariable Long empresaId,
            @RequestBody Map<String, Object> request,
            @RequestHeader("Authorization") String token) {
        try {
            Long productoId = Long.valueOf(request.get("productoId").toString());
            Long sectorId = Long.valueOf(request.get("sectorId").toString());
            Integer cantidad = Integer.valueOf(request.get("cantidad").toString());
            
            // Obtener el usuario del token
            // Limpiar el token removiendo el prefijo "Bearer " si existe
            String cleanToken = token.startsWith("Bearer ") ? token.substring(7) : token;
            String email = jwtUtil.extractUsername(cleanToken);
            Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
            
            sectorService.asignarProductoASector(empresaId, productoId, sectorId, cantidad, usuario);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Producto asignado exitosamente al sector",
                "productoId", productoId,
                "sectorId", sectorId,
                "cantidad", cantidad
            ));
        } catch (Exception e) {
            System.err.println("🔍 ASIGNAR PRODUCTO - Error: " + e.getMessage());
            e.printStackTrace();
            
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Error al asignar producto: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Limpiar duplicaciones de stock por sector
     * Endpoint temporal para corregir datos existentes
     */
    @PostMapping("/limpiar-duplicaciones")
    public ResponseEntity<?> limpiarDuplicacionesStock(@PathVariable Long empresaId) {
        try {
            // System.out.println("🔍 LIMPIAR DUPLICACIONES - Endpoint llamado para empresa: " + empresaId);
            
            sectorService.limpiarDuplicacionesStock(empresaId);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Duplicaciones de stock limpiadas exitosamente",
                "empresaId", empresaId
            ));
        } catch (Exception e) {
            System.err.println("🔍 LIMPIAR DUPLICACIONES - Error: " + e.getMessage());
            e.printStackTrace();
            
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Error al limpiar duplicaciones: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Endpoint para limpiar automáticamente productos con stock 0 en todos los sectores
     * Este endpoint elimina registros de StockPorSector donde la cantidad sea 0
     */
    @PostMapping("/limpiar-stock-cero")
    public ResponseEntity<?> limpiarStockCero(@PathVariable Long empresaId) {
        try {
            // System.out.println("🔍 SECTOR CONTROLLER - Limpiando stock cero para empresa: " + empresaId);
            
            sectorService.limpiarStockCero(empresaId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Productos con stock 0 eliminados correctamente",
                "timestamp", new Date()
            ));
        } catch (Exception e) {
            System.err.println("🔍 SECTOR CONTROLLER - Error limpiando stock cero: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "success", false,
                    "error", "Error limpiando stock cero: " + e.getMessage(),
                    "timestamp", new Date()
                ));
        }
    }
    
    /**
     * Endpoint para limpiar registros de stock cero de un producto específico
     * Útil para corregir inconsistencias después de cargas de planilla
     */
    @PostMapping("/limpiar-stock-cero-producto/{productoId}")
    public ResponseEntity<?> limpiarStockCeroProducto(@PathVariable Long empresaId, @PathVariable Long productoId) {
        try {
            // System.out.println("🔍 SECTOR CONTROLLER - Limpiando stock cero para producto: " + productoId + " en empresa: " + empresaId);
            
            // Verificar que el producto existe y pertenece a la empresa
            if (!productoRepository.findByIdAndEmpresaId(productoId, empresaId).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Producto no encontrado o no pertenece a la empresa"
                ));
            }
            
            // Obtener todos los registros de StockPorSector para este producto
            List<StockPorSector> registrosStock = stockPorSectorRepository.findByProductoIdAndSectorEmpresaId(productoId, empresaId);
            
            int registrosEliminados = 0;
            for (StockPorSector stock : registrosStock) {
                if (stock.getCantidad() == null || stock.getCantidad() <= 0) {
                    stockPorSectorRepository.delete(stock);
                    registrosEliminados++;
                    System.out.println("🗑️ SECTOR CONTROLLER - Eliminado registro con stock 0 en sector: " + stock.getSector().getNombre());
                }
            }
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Limpieza de stock cero completada para el producto",
                "productoId", productoId,
                "registrosEliminados", registrosEliminados,
                "timestamp", new Date()
            ));
        } catch (Exception e) {
            System.err.println("🔍 SECTOR CONTROLLER - Error limpiando stock cero del producto: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "success", false,
                    "error", "Error limpiando stock cero del producto: " + e.getMessage(),
                    "timestamp", new Date()
                ));
        }
    }
    
    /**
     * Endpoint para sincronizar el campo sectorAlmacenamiento de todos los productos
     * Este endpoint asegura que Producto.sectorAlmacenamiento coincida con el sector donde tiene más stock
     */
    @PostMapping("/sincronizar-sector-almacenamiento")
    public ResponseEntity<?> sincronizarSectorAlmacenamiento(@PathVariable Long empresaId) {
        try {
            System.out.println("🔄 SECTOR CONTROLLER - Sincronizando sectorAlmacenamiento para empresa: " + empresaId);
            
            sectorService.sincronizarSectorAlmacenamiento(empresaId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Campo sectorAlmacenamiento sincronizado correctamente",
                "timestamp", new Date()
            ));
        } catch (Exception e) {
            System.err.println("🔄 SECTOR CONTROLLER - Error sincronizando sectorAlmacenamiento: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "success", false,
                    "error", "Error sincronizando sectorAlmacenamiento: " + e.getMessage(),
                    "timestamp", new Date()
                ));
        }
    }
    
    /**
     * Endpoint para limpiar sectores eliminados de los filtros de productos
     * Este endpoint elimina referencias a sectores que ya no existen
     */
    @PostMapping("/limpiar-filtros-productos")
    public ResponseEntity<?> limpiarFiltrosProductos(@PathVariable Long empresaId) {
        try {
            System.out.println("🧹 SECTOR CONTROLLER - Limpiando filtros de productos para empresa: " + empresaId);
            
            // Obtener todos los sectores activos de la empresa
            List<Sector> sectoresActivos = sectorService.obtenerSectoresActivos(empresaId);
            List<String> nombresSectoresActivos = sectoresActivos.stream()
                .map(Sector::getNombre)
                .collect(Collectors.toList());
            
            // Limpiar productos con sectores eliminados
            sectorService.limpiarProductosConSectoresEliminados(empresaId);
            
            // Sincronizar sectorAlmacenamiento (esto limpiará sectores eliminados)
            sectorService.sincronizarSectorAlmacenamiento(empresaId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Filtros de productos limpiados correctamente",
                "sectoresActivos", nombresSectoresActivos,
                "timestamp", new Date()
            ));
        } catch (Exception e) {
            System.err.println("🧹 SECTOR CONTROLLER - Error limpiando filtros de productos: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "success", false,
                    "error", "Error limpiando filtros de productos: " + e.getMessage(),
                    "timestamp", new Date()
                ));
        }
    }
    
    /**
     * DEBUG: Obtener información de debug sobre stock por sector
     */
    @GetMapping("/debug-stock")
    public ResponseEntity<?> obtenerDebugStock(@PathVariable Long empresaId) {
        try {
            // System.out.println("🔍 DEBUG STOCK - Endpoint llamado para empresa: " + empresaId);
            
            // Verificar que la empresa existe
            if (!empresaRepository.existsById(empresaId)) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Empresa no encontrada con ID: " + empresaId
                ));
            }
            
            Map<String, Object> debugInfo = new HashMap<>();
            
            // Obtener todos los sectores
            List<Sector> sectores = sectorService.obtenerTodosLosSectores(empresaId);
            debugInfo.put("totalSectores", sectores.size());
            debugInfo.put("sectores", sectores.stream().map(s -> Map.of(
                "id", s.getId(),
                "nombre", s.getNombre(),
                "activo", s.getActivo()
            )).collect(Collectors.toList()));
            
            // Obtener todos los productos
            List<Producto> productos = productoRepository.findByEmpresaId(empresaId);
            debugInfo.put("totalProductos", productos.size());
            debugInfo.put("productos", productos.stream().map(p -> Map.of(
                "id", p.getId(),
                "nombre", p.getNombre(),
                "stock", p.getStock(),
                "activo", p.getActivo()
            )).collect(Collectors.toList()));
            
            // Obtener stock por sector
            List<StockPorSector> stockPorSectores = stockPorSectorRepository.findByEmpresaId(empresaId);
            debugInfo.put("totalStockPorSector", stockPorSectores.size());
            debugInfo.put("stockPorSectores", stockPorSectores.stream().map(sps -> Map.of(
                "id", sps.getId(),
                "productoId", sps.getProducto().getId(),
                "productoNombre", sps.getProducto().getNombre(),
                "sectorId", sps.getSector().getId(),
                "sectorNombre", sps.getSector().getNombre(),
                "cantidad", sps.getCantidad()
            )).collect(Collectors.toList()));
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Información de debug obtenida",
                "data", debugInfo
            ));
        } catch (Exception e) {
            System.err.println("🔍 DEBUG STOCK - Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Error al obtener información de debug: " + e.getMessage()
            ));
        }
    }
    
    /**
     * DEBUG: Obtener información específica del stock general
     */
    @GetMapping("/debug-stock-general")
    public ResponseEntity<?> obtenerDebugStockGeneral(@PathVariable Long empresaId) {
        try {
            // System.out.println("🔍 DEBUG STOCK GENERAL - Endpoint llamado para empresa: " + empresaId);
            
            // Verificar que la empresa existe
            if (!empresaRepository.existsById(empresaId)) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Empresa no encontrada con ID: " + empresaId
                ));
            }
            
            Map<String, Object> debugInfo = new HashMap<>();
            
            // Obtener stock por sector con detalles
            List<StockPorSector> stockPorSectores = stockPorSectorRepository.findByEmpresaId(empresaId);
            // System.out.println("🔍 DEBUG STOCK GENERAL - StockPorSectores encontrados: " + stockPorSectores.size());
            
            List<Map<String, Object>> stockDetallado = new ArrayList<>();
            for (StockPorSector stock : stockPorSectores) {
                Map<String, Object> item = new HashMap<>();
                item.put("id", stock.getId());
                item.put("productoId", stock.getProducto().getId());
                item.put("productoNombre", stock.getProducto().getNombre());
                item.put("sectorId", stock.getSector().getId());
                item.put("sectorNombre", stock.getSector().getNombre());
                item.put("cantidad", stock.getCantidad());
                item.put("cantidadNull", stock.getCantidad() == null);
                item.put("cantidadCero", stock.getCantidad() != null && stock.getCantidad() == 0);
                item.put("cantidadMayorCero", stock.getCantidad() != null && stock.getCantidad() > 0);
                stockDetallado.add(item);
            }
            
            debugInfo.put("totalStockPorSector", stockPorSectores.size());
            debugInfo.put("stockDetallado", stockDetallado);
            
            // Contar por tipo
            long stockConCantidadNull = stockPorSectores.stream().filter(s -> s.getCantidad() == null).count();
            long stockConCantidadCero = stockPorSectores.stream().filter(s -> s.getCantidad() != null && s.getCantidad() == 0).count();
            long stockConCantidadMayorCero = stockPorSectores.stream().filter(s -> s.getCantidad() != null && s.getCantidad() > 0).count();
            
            debugInfo.put("stockConCantidadNull", stockConCantidadNull);
            debugInfo.put("stockConCantidadCero", stockConCantidadCero);
            debugInfo.put("stockConCantidadMayorCero", stockConCantidadMayorCero);
            
            // Probar el método obtenerStockGeneral
            List<Map<String, Object>> stockGeneral = sectorService.obtenerStockGeneral(empresaId);
            debugInfo.put("stockGeneralResultado", stockGeneral.size());
            debugInfo.put("stockGeneralItems", stockGeneral);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Información de debug del stock general obtenida",
                "data", debugInfo
            ));
        } catch (Exception e) {
            System.err.println("🔍 DEBUG STOCK GENERAL - Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Error al obtener información de debug del stock general: " + e.getMessage()
            ));
        }
    }
    
    /**
     * Eliminar un sector completo
     * Este endpoint elimina el sector y todos sus registros de stock asociados
     */
    @DeleteMapping("/{sectorId}")
    public ResponseEntity<?> eliminarSector(
            @PathVariable Long empresaId,
            @PathVariable Long sectorId) {
        try {
            System.out.println("🗑️ SECTOR CONTROLLER - Eliminando sector: " + sectorId + " de empresa: " + empresaId);
            
            // Verificar que la empresa existe
            if (!empresaRepository.existsById(empresaId)) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Empresa no encontrada con ID: " + empresaId
                ));
            }
            
            // Verificar que el sector existe y pertenece a la empresa
            Sector sector = sectorService.obtenerSectorPorId(sectorId);
            if (sector == null) {
                return ResponseEntity.notFound().build();
            }
            
            if (!sector.getEmpresa().getId().equals(empresaId)) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "El sector no pertenece a la empresa especificada"
                ));
            }
            
            // Eliminar el sector (esto también eliminará los registros de stock asociados por CASCADE)
            sectorService.eliminarSector(sectorId);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Sector eliminado correctamente",
                "timestamp", new Date()
            ));
        } catch (Exception e) {
            System.err.println("🗑️ SECTOR CONTROLLER - Error eliminando sector: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "success", false,
                    "error", "Error eliminando sector: " + e.getMessage(),
                    "timestamp", new Date()
                ));
        }
    }
    
    /**
     * Endpoint de prueba para debuggear el descuento de stock
     */
    @PostMapping("/test-descuento-stock/{productoId}")
    public ResponseEntity<?> testDescuentoStock(@PathVariable Long empresaId, @PathVariable Long productoId, @RequestParam Integer cantidad) {
        try {
            System.out.println("🧪 TEST - Iniciando descuento de prueba para producto: " + productoId + ", cantidad: " + cantidad);
            
            // Verificar que el producto existe
            Producto producto = productoRepository.findByIdAndEmpresaId(productoId, empresaId)
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
            
            System.out.println("🧪 TEST - Producto encontrado: " + producto.getNombre());
            System.out.println("🧪 TEST - Stock actual del producto: " + producto.getStock());
            
            // Obtener stock en sectores
            List<StockPorSector> stockEnSectores = stockPorSectorRepository.findByProductoIdAndSectorEmpresaId(productoId, empresaId);
            System.out.println("🧪 TEST - Stock en sectores: " + stockEnSectores.size() + " registros");
            for (StockPorSector stock : stockEnSectores) {
                System.out.println("🧪 TEST - Sector: " + stock.getSector().getNombre() + " - Cantidad: " + stock.getCantidad());
            }
            
            // Ejecutar el descuento
            Map<String, Object> resultado = stockSincronizacionService.descontarStockInteligente(
                empresaId, 
                productoId, 
                cantidad, 
                "Test de descuento"
            );
            
            // Obtener estado final
            Producto productoFinal = productoRepository.findByIdAndEmpresaId(productoId, empresaId)
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
            
            List<StockPorSector> stockEnSectoresFinal = stockPorSectorRepository.findByProductoIdAndSectorEmpresaId(productoId, empresaId);
            
            return ResponseEntity.ok(Map.of(
                    "mensaje", "Test completado",
                    "productoId", productoId,
                    "cantidadDescontada", cantidad,
                    "resultado", resultado,
                    "estadoFinal", Map.of(
                            "stockProducto", productoFinal.getStock(),
                            "stockEnSectores", stockEnSectoresFinal.size(),
                            "sectores", stockEnSectoresFinal.stream()
                                    .map(stock -> Map.of(
                                            "sector", stock.getSector().getNombre(),
                                            "cantidad", stock.getCantidad()
                                    ))
                                    .collect(Collectors.toList())
                    )
            ));

        } catch (Exception e) {
            System.err.println("🧪 TEST - Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error en test: " + e.getMessage()));
        }
    }

    /**
     * Exportar stock general a Excel (misma lógica de datos que GET /stock-general: por sector + sin sectorizar).
     */
    @GetMapping("/exportar-stock-general-excel")
    public ResponseEntity<byte[]> exportarStockGeneralExcel(@PathVariable Long empresaId) {
        try {
            System.setProperty("java.awt.headless", "true");

            List<Map<String, Object>> stockGeneral = sectorService.obtenerStockGeneral(empresaId);
            List<Sector> sectores = sectorRepository.findByEmpresaIdOrderByNombre(empresaId);

            if (stockGeneral.isEmpty() && sectores.isEmpty()) {
                return ResponseEntity.notFound().build();
            }

            try (XSSFWorkbook workbook = new XSSFWorkbook()) {

                CellStyle headerStyle = workbook.createCellStyle();
                Font headerFont = workbook.createFont();
                headerFont.setBold(true);
                headerFont.setFontHeightInPoints((short) 12);
                headerStyle.setFont(headerFont);
                headerStyle.setFillForegroundColor(IndexedColors.LIGHT_BLUE.getIndex());
                headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
                headerStyle.setBorderBottom(BorderStyle.THIN);
                headerStyle.setBorderTop(BorderStyle.THIN);
                headerStyle.setBorderRight(BorderStyle.THIN);
                headerStyle.setBorderLeft(BorderStyle.THIN);

                CellStyle dataStyle = workbook.createCellStyle();
                dataStyle.setBorderBottom(BorderStyle.THIN);
                dataStyle.setBorderTop(BorderStyle.THIN);
                dataStyle.setBorderRight(BorderStyle.THIN);
                dataStyle.setBorderLeft(BorderStyle.THIN);

                CellStyle titleStyle = workbook.createCellStyle();
                Font titleFont = workbook.createFont();
                titleFont.setBold(true);
                titleFont.setFontHeightInPoints((short) 14);
                titleStyle.setFont(titleFont);
                titleStyle.setAlignment(HorizontalAlignment.CENTER);

                Set<String> nombresPestanasUsados = new HashSet<>();

                // 1) Pestaña "Stock": mismo formato que Importación de inventario (Producto=código, Descripción=nombre, Stock=cantidad total)
                String nombrePestanaStock = nombreUnicoPestanaExcel("Stock", nombresPestanasUsados);
                Sheet hojaStockImport = workbook.createSheet(nombrePestanaStock);
                Row headerStockImport = hojaStockImport.createRow(0);
                String[] headersImport = {"Producto", "Descripción", "Stock"};
                for (int i = 0; i < headersImport.length; i++) {
                    Cell c = headerStockImport.createCell(i);
                    c.setCellValue(headersImport[i]);
                    c.setCellStyle(headerStyle);
                }
                List<FilaStockImportacionInventario> filasImport = consolidarStockParaImportacionInventario(stockGeneral);
                int filaStock = 1;
                for (FilaStockImportacionInventario fila : filasImport) {
                    Row row = hojaStockImport.createRow(filaStock++);
                    row.createCell(0).setCellValue(fila.codigo);
                    row.createCell(1).setCellValue(fila.descripcion != null ? fila.descripcion : "");
                    row.createCell(2).setCellValue(fila.cantidadTotal);
                    for (int i = 0; i < 3; i++) {
                        row.getCell(i).setCellStyle(dataStyle);
                    }
                }
                hojaStockImport.setColumnWidth(0, 18 * 256);
                hojaStockImport.setColumnWidth(1, 50 * 256);
                hojaStockImport.setColumnWidth(2, 14 * 256);

                for (Sector sector : sectores) {
                    List<Map<String, Object>> items = stockGeneral.stream()
                            .filter(item -> {
                                @SuppressWarnings("unchecked")
                                Map<String, Object> sec = (Map<String, Object>) item.get("sector");
                                if (sec == null || sec.get("id") == null) {
                                    return false;
                                }
                                long idSector = ((Number) sec.get("id")).longValue();
                                return idSector == sector.getId();
                            })
                            .collect(Collectors.toList());

                    String nombrePestana = nombreUnicoPestanaExcel(sector.getNombre(), nombresPestanasUsados);
                    Sheet sheet = workbook.createSheet(nombrePestana);

                    Row titleRow = sheet.createRow(0);
                    Cell titleCell = titleRow.createCell(0);
                    titleCell.setCellValue("SECTOR: " + sector.getNombre().toUpperCase());
                    titleCell.setCellStyle(titleStyle);
                    sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 2));

                    if (items.isEmpty()) {
                        Row emptyRow = sheet.createRow(2);
                        Cell emptyCell = emptyRow.createCell(0);
                        emptyCell.setCellValue("No hay productos en este sector");
                        emptyCell.setCellStyle(dataStyle);
                        sheet.addMergedRegion(new CellRangeAddress(2, 2, 0, 2));
                    } else {
                        Row headerRow = sheet.createRow(2);
                        String[] headers = {"Código", "Nombre", "Cantidad"};
                        for (int i = 0; i < headers.length; i++) {
                            Cell cell = headerRow.createCell(i);
                            cell.setCellValue(headers[i]);
                            cell.setCellStyle(headerStyle);
                        }
                        int rowNum = 3;
                        for (Map<String, Object> item : items) {
                            Row row = sheet.createRow(rowNum++);
                            llenarFilaStockGeneralDesdeMap(row, item, dataStyle);
                        }
                    }

                    sheet.setColumnWidth(0, 15 * 256);
                    sheet.setColumnWidth(1, 50 * 256);
                    sheet.setColumnWidth(2, 12 * 256);
                }

                List<Map<String, Object>> sinSector = stockGeneral.stream()
                        .filter(item -> item.get("sector") == null)
                        .collect(Collectors.toList());

                if (!sinSector.isEmpty()) {
                    String pestanaSin = nombreUnicoPestanaExcel("Sin sectorizar", nombresPestanasUsados);
                    Sheet sheetSin = workbook.createSheet(pestanaSin);

                    Row titleRow = sheetSin.createRow(0);
                    Cell titleCell = titleRow.createCell(0);
                    titleCell.setCellValue("STOCK SIN SECTORIZAR (misma vista que pantalla Stock general)");
                    titleCell.setCellStyle(titleStyle);
                    sheetSin.addMergedRegion(new CellRangeAddress(0, 0, 0, 2));

                    Row headerRow = sheetSin.createRow(2);
                    String[] headers = {"Código", "Nombre", "Cantidad"};
                    for (int i = 0; i < headers.length; i++) {
                        Cell cell = headerRow.createCell(i);
                        cell.setCellValue(headers[i]);
                        cell.setCellStyle(headerStyle);
                    }
                    int rowNum = 3;
                    for (Map<String, Object> item : sinSector) {
                        Row row = sheetSin.createRow(rowNum++);
                        llenarFilaStockGeneralDesdeMap(row, item, dataStyle);
                    }
                    sheetSin.setColumnWidth(0, 15 * 256);
                    sheetSin.setColumnWidth(1, 50 * 256);
                    sheetSin.setColumnWidth(2, 12 * 256);
                }

                if (workbook.getNumberOfSheets() == 0) {
                    Sheet sheet = workbook.createSheet("Stock");
                    Row r = sheet.createRow(0);
                    r.createCell(0).setCellValue("No hay datos de stock para exportar");
                }

                ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
                workbook.write(outputStream);
                byte[] excelBytes = outputStream.toByteArray();

                HttpHeaders responseHeaders = new HttpHeaders();
                responseHeaders.setContentType(MediaType.APPLICATION_OCTET_STREAM);
                responseHeaders.setContentDispositionFormData("attachment", "stock_general_por_sectores.xlsx");
                responseHeaders.setContentLength(excelBytes.length);

                return ResponseEntity.ok()
                        .headers(responseHeaders)
                        .body(excelBytes);
            }

        } catch (Exception e) {
            System.err.println("❌ [CONTROLLER] Error al exportar stock general a Excel: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    private static final class FilaStockImportacionInventario {
        final String codigo;
        final String descripcion;
        final int cantidadTotal;

        FilaStockImportacionInventario(String codigo, String descripcion, int cantidadTotal) {
            this.codigo = codigo;
            this.descripcion = descripcion;
            this.cantidadTotal = cantidadTotal;
        }
    }

    /**
     * Una fila por producto: suma cantidades de todos los sectores + sin sectorizar (coherente con actualizar stock global en importación).
     */
    private static List<FilaStockImportacionInventario> consolidarStockParaImportacionInventario(
            List<Map<String, Object>> stockGeneral) {
        Map<Long, Integer> sumaPorProducto = new HashMap<>();
        Map<Long, String> codigoPorProducto = new HashMap<>();
        Map<Long, String> nombrePorProducto = new HashMap<>();

        for (Map<String, Object> item : stockGeneral) {
            @SuppressWarnings("unchecked")
            Map<String, Object> prod = (Map<String, Object>) item.get("producto");
            if (prod == null || prod.get("id") == null) {
                continue;
            }
            long pid = ((Number) prod.get("id")).longValue();
            int cant = 0;
            Object cObj = item.get("cantidad");
            if (cObj instanceof Number) {
                cant = ((Number) cObj).intValue();
            }
            sumaPorProducto.merge(pid, cant, Integer::sum);

            String cod = "";
            if (prod.get("codigoPersonalizado") != null) {
                cod = String.valueOf(prod.get("codigoPersonalizado")).trim();
            }
            if (!cod.isEmpty()) {
                codigoPorProducto.putIfAbsent(pid, cod);
            }
            String nom = prod.get("nombre") != null ? String.valueOf(prod.get("nombre")).trim() : "";
            if (!nom.isEmpty()) {
                nombrePorProducto.putIfAbsent(pid, nom);
            }
        }

        List<FilaStockImportacionInventario> filas = new ArrayList<>();
        for (Map.Entry<Long, Integer> e : sumaPorProducto.entrySet()) {
            Long pid = e.getKey();
            String codigo = codigoPorProducto.get(pid);
            if (codigo == null || codigo.isEmpty()) {
                continue;
            }
            String descripcion = nombrePorProducto.getOrDefault(pid, "");
            filas.add(new FilaStockImportacionInventario(codigo, descripcion, e.getValue()));
        }
        filas.sort(Comparator.comparing(f -> f.codigo.toLowerCase(Locale.ROOT)));
        return filas;
    }

    private static String nombreUnicoPestanaExcel(String base, Set<String> usados) {
        String limpio = base == null ? "Hoja" : base.replaceAll("[\\\\/*?:\\[\\]]", "_");
        if (limpio.isBlank()) {
            limpio = "Hoja";
        }
        if (limpio.length() > 31) {
            limpio = limpio.substring(0, 31);
        }
        String candidato = limpio;
        int i = 2;
        while (usados.contains(candidato)) {
            String sufijo = " (" + i + ")";
            int maxPref = Math.max(1, 31 - sufijo.length());
            String pref = limpio.length() > maxPref ? limpio.substring(0, maxPref) : limpio;
            candidato = pref + sufijo;
            i++;
        }
        usados.add(candidato);
        return candidato;
    }

    @SuppressWarnings("unchecked")
    private static void llenarFilaStockGeneralDesdeMap(Row row, Map<String, Object> item, CellStyle dataStyle) {
        Map<String, Object> prod = (Map<String, Object>) item.get("producto");
        String codigo = "-";
        if (prod != null && prod.get("codigoPersonalizado") != null) {
            String c = String.valueOf(prod.get("codigoPersonalizado")).trim();
            if (!c.isEmpty()) {
                codigo = c;
            }
        }
        String nombre = (prod != null && prod.get("nombre") != null) ? String.valueOf(prod.get("nombre")) : "-";
        int cantidad = 0;
        Object cObj = item.get("cantidad");
        if (cObj instanceof Number) {
            cantidad = ((Number) cObj).intValue();
        }

        row.createCell(0).setCellValue(codigo);
        row.createCell(1).setCellValue(nombre);
        row.createCell(2).setCellValue(cantidad);
        for (int i = 0; i < 3; i++) {
            row.getCell(i).setCellStyle(dataStyle);
        }
    }
}
