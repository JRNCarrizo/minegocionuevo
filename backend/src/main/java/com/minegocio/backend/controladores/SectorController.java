package com.minegocio.backend.controladores;

import com.minegocio.backend.dto.SectorDTO;
import com.minegocio.backend.dto.StockPorSectorDTO;
import com.minegocio.backend.entidades.Sector;
import com.minegocio.backend.entidades.StockPorSector;
import com.minegocio.backend.servicios.SectorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.Authentication;
import com.minegocio.backend.seguridad.UsuarioPrincipal;
import jakarta.annotation.PostConstruct;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.minegocio.backend.repositorios.EmpresaRepository;

@RestController
@RequestMapping("/api/empresas/{empresaId}/sectores")
@CrossOrigin(origins = {"http://localhost:5173", "http://*.localhost:5173", "https://*.localhost:5173", "https://negocio360-frontend.onrender.com", "https://www.negocio360.org"}, allowedHeaders = "*")
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
            System.out.println("🔍 STOCK GENERAL - Endpoint llamado para empresa: " + empresaId);
            System.out.println("🔍 STOCK GENERAL - Iniciando proceso...");
            System.out.println("🔍 STOCK GENERAL - Timestamp: " + new java.util.Date());
            
            // Verificar que la empresa existe
            System.out.println("🔍 STOCK GENERAL - Verificando empresa...");
            if (!empresaRepository.existsById(empresaId)) {
                System.err.println("🔍 STOCK GENERAL - Empresa no encontrada: " + empresaId);
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Empresa no encontrada con ID: " + empresaId
                ));
            }
            System.out.println("🔍 STOCK GENERAL - Empresa encontrada: " + empresaId);
            
            List<Map<String, Object>> stockGeneral = sectorService.obtenerStockGeneral(empresaId);
            System.out.println("🔍 STOCK GENERAL - Datos obtenidos: " + stockGeneral.size() + " items");
            
            // Log de los primeros 3 items para debug
            for (int i = 0; i < Math.min(3, stockGeneral.size()); i++) {
                System.out.println("🔍 STOCK GENERAL - Item " + i + ": " + stockGeneral.get(i));
            }
            
            System.out.println("🔍 STOCK GENERAL - Proceso completado exitosamente");
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
            System.out.println("🔍 STOCK DETALLADO - Endpoint llamado para empresa: " + empresaId);
            System.out.println("🔍 STOCK DETALLADO - Iniciando proceso...");
            System.out.println("🔍 STOCK DETALLADO - Timestamp: " + new java.util.Date());
            
            // Verificar que la empresa existe
            System.out.println("🔍 STOCK DETALLADO - Verificando empresa...");
            if (!empresaRepository.existsById(empresaId)) {
                System.err.println("🔍 STOCK DETALLADO - Empresa no encontrada: " + empresaId);
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Empresa no encontrada con ID: " + empresaId
                ));
            }
            System.out.println("🔍 STOCK DETALLADO - Empresa encontrada: " + empresaId);
            
            List<Map<String, Object>> stockDetallado = sectorService.obtenerStockDetallado(empresaId);
            System.out.println("🔍 STOCK DETALLADO - Datos obtenidos: " + stockDetallado.size() + " items");
            
            // Log de los primeros 3 items para debug
            for (int i = 0; i < Math.min(3, stockDetallado.size()); i++) {
                System.out.println("🔍 STOCK DETALLADO - Item " + i + ": " + stockDetallado.get(i));
            }
            
            System.out.println("🔍 STOCK DETALLADO - Proceso completado exitosamente");
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
            System.out.println("🔍 ASIGNAR PRODUCTOS - Endpoint llamado");
            System.out.println("🔍 ASIGNAR PRODUCTOS - Empresa: " + empresaId);
            System.out.println("🔍 ASIGNAR PRODUCTOS - Sector: " + sectorId);
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> asignaciones = (List<Map<String, Object>>) request.get("asignaciones");
            
            if (asignaciones == null || asignaciones.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "No se proporcionaron asignaciones"
                ));
            }
            
            System.out.println("🔍 ASIGNAR PRODUCTOS - Asignaciones recibidas: " + asignaciones.size());
            
            sectorService.asignarProductosASector(sectorId, empresaId, asignaciones);
            
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
            @RequestBody Map<String, Object> request) {
        try {
            System.out.println("🔍 RECIBIR PRODUCTOS - Endpoint llamado");
            System.out.println("🔍 RECIBIR PRODUCTOS - Empresa: " + empresaId);
            System.out.println("🔍 RECIBIR PRODUCTOS - Sector: " + sectorId);
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> recepciones = (List<Map<String, Object>>) request.get("recepciones");
            
            if (recepciones == null || recepciones.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "No se proporcionaron recepciones"
                ));
            }
            
            System.out.println("🔍 RECIBIR PRODUCTOS - Recepciones recibidas: " + recepciones.size());
            
            sectorService.recibirProductosEnSector(sectorId, empresaId, recepciones);
            
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
            @PathVariable Long stockId) {
        try {
            System.out.println("🔍 QUITAR PRODUCTO - Endpoint llamado");
            System.out.println("🔍 QUITAR PRODUCTO - Empresa: " + empresaId);
            System.out.println("🔍 QUITAR PRODUCTO - Sector: " + sectorId);
            System.out.println("🔍 QUITAR PRODUCTO - Stock ID: " + stockId);
            
            sectorService.quitarProductoDeSector(sectorId, empresaId, stockId);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Producto quitado exitosamente del sector",
                "sectorId", sectorId,
                "stockId", stockId
            ));
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
            @RequestBody Map<String, Object> request) {
        try {
            System.out.println("🔍 TRANSFERIR STOCK - Endpoint llamado");
            System.out.println("🔍 TRANSFERIR STOCK - Empresa: " + empresaId);
            
            Long productoId = Long.valueOf(request.get("productoId").toString());
            Long sectorOrigenId = Long.valueOf(request.get("sectorOrigenId").toString());
            Long sectorDestinoId = Long.valueOf(request.get("sectorDestinoId").toString());
            Integer cantidad = Integer.valueOf(request.get("cantidad").toString());
            
            System.out.println("🔍 TRANSFERIR STOCK - Producto: " + productoId);
            System.out.println("🔍 TRANSFERIR STOCK - Sector Origen: " + sectorOrigenId);
            System.out.println("🔍 TRANSFERIR STOCK - Sector Destino: " + sectorDestinoId);
            System.out.println("🔍 TRANSFERIR STOCK - Cantidad: " + cantidad);
            
            sectorService.transferirStockEntreSectores(empresaId, productoId, sectorOrigenId, sectorDestinoId, cantidad);
            
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
     * Limpiar duplicaciones de stock por sector
     * Endpoint temporal para corregir datos existentes
     */
    @PostMapping("/limpiar-duplicaciones")
    public ResponseEntity<?> limpiarDuplicacionesStock(@PathVariable Long empresaId) {
        try {
            System.out.println("🔍 LIMPIAR DUPLICACIONES - Endpoint llamado para empresa: " + empresaId);
            
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
}
