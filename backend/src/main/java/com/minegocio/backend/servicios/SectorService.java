package com.minegocio.backend.servicios;

import com.minegocio.backend.entidades.Sector;
import com.minegocio.backend.entidades.StockPorSector;
import com.minegocio.backend.entidades.Producto;
import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.repositorios.SectorRepository;
import com.minegocio.backend.repositorios.StockPorSectorRepository;
import com.minegocio.backend.repositorios.ProductoRepository;
import com.minegocio.backend.repositorios.EmpresaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;
import java.util.ArrayList;
import java.util.Date;

@Service
public class SectorService {
    
    @Autowired
    private SectorRepository sectorRepository;
    
    @Autowired
    private StockPorSectorRepository stockPorSectorRepository;
    
    @Autowired
    private ProductoRepository productoRepository;
    
    @Autowired
    private EmpresaRepository empresaRepository;
    
    /**
     * Crear un nuevo sector
     */
    @Transactional
    public Sector crearSector(String nombre, String descripcion, String ubicacion, Long empresaId) {
        Empresa empresa = empresaRepository.findById(empresaId)
            .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        
        // Verificar que no exista un sector con el mismo nombre
        if (sectorRepository.existsByNombreAndEmpresaId(nombre, empresaId)) {
            throw new RuntimeException("Ya existe un sector con ese nombre");
        }
        
        Sector sector = new Sector();
        sector.setNombre(nombre);
        sector.setDescripcion(descripcion);
        sector.setUbicacion(ubicacion);
        sector.setEmpresa(empresa);
        sector.setActivo(true);
        
        return sectorRepository.save(sector);
    }
    
    /**
     * Obtener todos los sectores activos de una empresa
     */
    public List<Sector> obtenerSectoresActivos(Long empresaId) {
        return sectorRepository.findByEmpresaIdAndActivoOrderByNombre(empresaId, true);
    }
    
    /**
     * Obtener todos los sectores de una empresa
     */
    public List<Sector> obtenerTodosLosSectores(Long empresaId) {
        return sectorRepository.findByEmpresaIdOrderByNombre(empresaId);
    }
    
    /**
     * Actualizar un sector
     */
    @Transactional
    public Sector actualizarSector(Long sectorId, String nombre, String descripcion, String ubicacion) {
        Sector sector = sectorRepository.findById(sectorId)
            .orElseThrow(() -> new RuntimeException("Sector no encontrado"));
        
        // Verificar que el nuevo nombre no exista en la misma empresa
        if (!nombre.equals(sector.getNombre()) && 
            sectorRepository.existsByNombreAndEmpresaId(nombre, sector.getEmpresa().getId())) {
            throw new RuntimeException("Ya existe un sector con ese nombre");
        }
        
        sector.setNombre(nombre);
        sector.setDescripcion(descripcion);
        sector.setUbicacion(ubicacion);
        
        return sectorRepository.save(sector);
    }
    
    /**
     * Desactivar/activar un sector
     */
    @Transactional
    public Sector cambiarEstadoSector(Long sectorId, Boolean activo) {
        Sector sector = sectorRepository.findById(sectorId)
            .orElseThrow(() -> new RuntimeException("Sector no encontrado"));
        
        sector.setActivo(activo);
        return sectorRepository.save(sector);
    }
    
    /**
     * Asignar stock de un producto a un sector
     */
    @Transactional
    public StockPorSector asignarStock(Long productoId, Long sectorId, Integer cantidad) {
        Producto producto = productoRepository.findById(productoId)
            .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        
        Sector sector = sectorRepository.findById(sectorId)
            .orElseThrow(() -> new RuntimeException("Sector no encontrado"));
        
        // Buscar si ya existe stock para este producto en este sector
        Optional<StockPorSector> stockExistente = stockPorSectorRepository
            .findByProductoIdAndSectorId(productoId, sectorId);
        
        StockPorSector stockPorSector;
        if (stockExistente.isPresent()) {
            stockPorSector = stockExistente.get();
            stockPorSector.setCantidad(cantidad);
        } else {
            stockPorSector = new StockPorSector(producto, sector, cantidad);
        }
        
        StockPorSector stockGuardado = stockPorSectorRepository.save(stockPorSector);
        
        // Actualizar el stock total del producto
        actualizarStockTotalProducto(productoId);
        
        return stockGuardado;
    }
    
    /**
     * Mover stock entre sectores
     */
    @Transactional
    public void moverStock(Long productoId, Long sectorOrigenId, Long sectorDestinoId, Integer cantidad) {
        // Verificar stock en origen
        StockPorSector stockOrigen = stockPorSectorRepository
            .findByProductoIdAndSectorId(productoId, sectorOrigenId)
            .orElseThrow(() -> new RuntimeException("No hay stock del producto en el sector origen"));
        
        if (stockOrigen.getCantidad() < cantidad) {
            throw new RuntimeException("Stock insuficiente en el sector origen");
        }
        
        // Reducir stock en origen
        stockOrigen.setCantidad(stockOrigen.getCantidad() - cantidad);
        stockPorSectorRepository.save(stockOrigen);
        
        // Aumentar stock en destino
        asignarStock(productoId, sectorDestinoId, 
            stockPorSectorRepository.findByProductoIdAndSectorId(productoId, sectorDestinoId)
                .map(sps -> sps.getCantidad() + cantidad)
                .orElse(cantidad));
    }
    
    /**
     * Obtener stock de un producto por sectores
     */
    public List<StockPorSector> obtenerStockPorSectores(Long productoId) {
        return stockPorSectorRepository.findByProductoId(productoId);
    }
    
    /**
     * Obtener productos con stock en un sector
     */
    public List<StockPorSector> obtenerProductosEnSector(Long sectorId, Long empresaId) {
        return stockPorSectorRepository.findProductosConStockEnSector(sectorId, empresaId);
    }
    
    /**
     * Actualizar el stock total de un producto basado en los sectores
     */
    @Transactional
    public void actualizarStockTotalProducto(Long productoId) {
        Integer stockTotal = stockPorSectorRepository.getStockTotalByProductoId(productoId);
        
        Producto producto = productoRepository.findById(productoId)
            .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        
        producto.setStock(stockTotal);
        productoRepository.save(producto);
    }
    
    /**
     * MIGRACIÓN: Migrar datos del campo sectorAlmacenamiento a la nueva estructura
     * Este método se ejecuta una sola vez para migrar datos existentes
     */
    @Transactional
    public void migrarSectoresExistentes(Long empresaId) {
        // Limpiar datos duplicados existentes (si los hay)
        limpiarStockPorSectorDuplicados(empresaId);
        
        // Obtener todos los sectores únicos del campo sectorAlmacenamiento
        List<String> sectoresExistentes = productoRepository
            .findSectoresAlmacenamientoPorEmpresa(
                empresaRepository.findById(empresaId).orElseThrow()
            );
        
        // Crear sectores en la nueva estructura
        Map<String, Sector> sectoresCreados = new HashMap<>();
        
        for (String nombreSector : sectoresExistentes) {
            if (nombreSector != null && !nombreSector.trim().isEmpty()) {
                // Crear el sector si no existe
                Sector sector = sectorRepository.findByNombreAndEmpresaId(nombreSector, empresaId)
                    .orElseGet(() -> {
                        Sector nuevoSector = new Sector();
                        nuevoSector.setNombre(nombreSector);
                        nuevoSector.setEmpresa(empresaRepository.findById(empresaId).orElseThrow());
                        nuevoSector.setActivo(true);
                        return sectorRepository.save(nuevoSector);
                    });
                
                sectoresCreados.put(nombreSector, sector);
            }
        }
        
        // Migrar stock de productos
        List<Producto> productos = productoRepository.findByEmpresaId(empresaId);
        
        for (Producto producto : productos) {
            if (producto.getSectorAlmacenamiento() != null && 
                !producto.getSectorAlmacenamiento().trim().isEmpty() &&
                producto.getStock() != null && producto.getStock() > 0) {
                
                Sector sector = sectoresCreados.get(producto.getSectorAlmacenamiento());
                if (sector != null) {
                    // Verificar si ya existe un registro para este producto y sector
                    Optional<StockPorSector> stockExistente = stockPorSectorRepository
                        .findByProductoIdAndSectorId(producto.getId(), sector.getId());
                    
                    if (stockExistente.isEmpty()) {
                        // Crear registro de stock por sector solo si no existe
                        StockPorSector stockPorSector = new StockPorSector();
                        stockPorSector.setProducto(producto);
                        stockPorSector.setSector(sector);
                        stockPorSector.setCantidad(producto.getStock());
                        
                        stockPorSectorRepository.save(stockPorSector);
                    }
                }
            }
        }
    }
    
    /**
     * Limpiar registros duplicados en StockPorSector
     */
    @Transactional
    private void limpiarStockPorSectorDuplicados(Long empresaId) {
        List<StockPorSector> stocks = stockPorSectorRepository.findByEmpresaId(empresaId);
        Map<String, StockPorSector> stocksUnicos = new HashMap<>();
        
        for (StockPorSector stock : stocks) {
            String key = stock.getProducto().getId() + "_" + stock.getSector().getId();
            if (stocksUnicos.containsKey(key)) {
                // Eliminar el duplicado
                stockPorSectorRepository.delete(stock);
            } else {
                stocksUnicos.put(key, stock);
            }
        }
    }
    
    /**
     * Obtener estadísticas de sectores
     */
    public Map<String, Object> obtenerEstadisticasSectores(Long empresaId) {
        Empresa empresa = empresaRepository.findById(empresaId)
            .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        
        List<Sector> sectores = sectorRepository.findByEmpresaIdOrderByNombre(empresaId);
        long totalSectores = sectores.size();
        long sectoresActivos = sectores.stream().filter(Sector::getActivo).count();
        long sectoresInactivos = totalSectores - sectoresActivos;
        
        return Map.of(
            "totalSectores", totalSectores,
            "sectoresActivos", sectoresActivos,
            "sectoresInactivos", sectoresInactivos
        );
    }
    
    /**
     * Obtener stock general de la empresa
     * Incluye productos con sector asignado y sin sector asignado
     */
    public List<Map<String, Object>> obtenerStockGeneral(Long empresaId) {
        System.out.println("🔍 SECTOR SERVICE - Iniciando obtenerStockGeneral para empresa: " + empresaId);
        
        Empresa empresa = empresaRepository.findById(empresaId)
            .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        
        List<Map<String, Object>> stockGeneral = new ArrayList<>();
        
        // Obtener productos con sector asignado (nueva estructura)
        List<StockPorSector> stockPorSectores = stockPorSectorRepository.findByEmpresaId(empresaId);
        System.out.println("🔍 SECTOR SERVICE - StockPorSectores encontrados: " + stockPorSectores.size());
        
        for (StockPorSector stock : stockPorSectores) {
            try {
                Map<String, Object> item = new HashMap<>();
                item.put("id", stock.getId()); // ID único para el frontend
                item.put("producto", Map.of(
                    "id", stock.getProducto().getId(),
                    "nombre", stock.getProducto().getNombre(),
                    "codigoPersonalizado", stock.getProducto().getCodigoPersonalizado() != null ? stock.getProducto().getCodigoPersonalizado() : ""
                ));
                item.put("sector", Map.of(
                    "id", stock.getSector().getId(),
                    "nombre", stock.getSector().getNombre()
                ));
                item.put("cantidad", stock.getCantidad());
                item.put("fechaActualizacion", stock.getFechaActualizacion() != null ? stock.getFechaActualizacion().toString() : new Date().toString());
                item.put("tipo", "con_sector");
                stockGeneral.add(item);
            } catch (Exception e) {
                System.err.println("🔍 SECTOR SERVICE - Error procesando StockPorSector: " + e.getMessage());
            }
        }
        
        // Obtener TODOS los productos de la empresa
        List<Producto> todosLosProductos = productoRepository.findByEmpresaId(empresaId);
        System.out.println("🔍 SECTOR SERVICE - Total productos en empresa: " + todosLosProductos.size());
        
        for (Producto producto : todosLosProductos) {
            try {
                // Calcular el stock total asignado a sectores para este producto
                Integer stockAsignado = stockPorSectores.stream()
                    .filter(stock -> stock.getProducto().getId().equals(producto.getId()))
                    .mapToInt(StockPorSector::getCantidad)
                    .sum();
                
                // Calcular el stock sin asignar
                Integer stockTotal = producto.getStock() != null ? producto.getStock() : 0;
                Integer stockSinAsignar = Math.max(0, stockTotal - stockAsignado);
                
                System.out.println("🔍 SECTOR SERVICE - Producto: " + producto.getNombre() + 
                    ", Stock total: " + stockTotal + 
                    ", Stock asignado: " + stockAsignado + 
                    ", Stock sin asignar: " + stockSinAsignar);
                
                // Siempre agregar la fila de stock sin asignar si hay stock disponible
                if (stockSinAsignar > 0) {
                    Map<String, Object> item = new HashMap<>();
                    item.put("id", producto.getId() + "_sin_sector"); // ID único para el frontend
                    item.put("producto", Map.of(
                        "id", producto.getId(),
                        "nombre", producto.getNombre(),
                        "codigoPersonalizado", producto.getCodigoPersonalizado() != null ? producto.getCodigoPersonalizado() : ""
                    ));
                    item.put("sector", null); // Sin sector asignado
                    item.put("cantidad", stockSinAsignar);
                    item.put("fechaActualizacion", producto.getFechaActualizacion() != null ? producto.getFechaActualizacion().toString() : new Date().toString());
                    item.put("tipo", "sin_sector");
                    stockGeneral.add(item);
                }
            } catch (Exception e) {
                System.err.println("🔍 SECTOR SERVICE - Error procesando Producto: " + e.getMessage());
            }
        }
        
        System.out.println("🔍 SECTOR SERVICE - Total items en stock general: " + stockGeneral.size());
        return stockGeneral;
    }
    
    /**
     * Asignar productos a un sector
     */
    @Transactional
    public void asignarProductosASector(Long sectorId, Long empresaId, List<Map<String, Object>> asignaciones) {
        System.out.println("🔍 SECTOR SERVICE - Iniciando asignación de productos al sector: " + sectorId);
        System.out.println("🔍 SECTOR SERVICE - Empresa: " + empresaId);
        System.out.println("🔍 SECTOR SERVICE - Asignaciones: " + asignaciones.size());
        System.out.println("🔍 SECTOR SERVICE - Datos de asignaciones: " + asignaciones);
        
        // Verificar que el sector existe y pertenece a la empresa
        Sector sector = sectorRepository.findById(sectorId)
            .orElseThrow(() -> new RuntimeException("Sector no encontrado"));
        
        if (!sector.getEmpresa().getId().equals(empresaId)) {
            throw new RuntimeException("El sector no pertenece a la empresa especificada");
        }
        
        if (!sector.getActivo()) {
            throw new RuntimeException("No se pueden asignar productos a un sector inactivo");
        }
        
        for (Map<String, Object> asignacion : asignaciones) {
            System.out.println("🔍 SECTOR SERVICE - Procesando asignación: " + asignacion);
            try {
                Object productoIdObj = asignacion.get("productoId");
                Object cantidadObj = asignacion.get("cantidad");
                
                System.out.println("🔍 SECTOR SERVICE - productoIdObj: " + productoIdObj + " (tipo: " + (productoIdObj != null ? productoIdObj.getClass().getSimpleName() : "null") + ")");
                System.out.println("🔍 SECTOR SERVICE - cantidadObj: " + cantidadObj + " (tipo: " + (cantidadObj != null ? cantidadObj.getClass().getSimpleName() : "null") + ")");
                
                Long productoId;
                Integer cantidad;
                
                if (productoIdObj instanceof Number) {
                    productoId = ((Number) productoIdObj).longValue();
                } else {
                    productoId = Long.valueOf(productoIdObj.toString());
                }
                
                if (cantidadObj instanceof Number) {
                    cantidad = ((Number) cantidadObj).intValue();
                } else {
                    cantidad = Integer.valueOf(cantidadObj.toString());
                }
                
                System.out.println("🔍 SECTOR SERVICE - Procesando asignación: Producto " + productoId + ", Cantidad " + cantidad);
                
                if (cantidad <= 0) {
                    System.out.println("🔍 SECTOR SERVICE - Cantidad 0 o negativa, saltando producto " + productoId);
                    continue;
                }
                
                // Verificar que el producto existe y pertenece a la empresa
                Producto producto = productoRepository.findById(productoId)
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + productoId));
                
                if (!producto.getEmpresa().getId().equals(empresaId)) {
                    throw new RuntimeException("El producto no pertenece a la empresa especificada: " + productoId);
                }
                
                if (!producto.getActivo()) {
                    throw new RuntimeException("No se pueden asignar productos inactivos: " + producto.getNombre());
                }
                
                // Verificar que hay suficiente stock disponible
                Integer stockDisponible = producto.getStock() != null ? producto.getStock() : 0;
                Integer stockAsignado = stockPorSectorRepository.getStockTotalByProductoId(productoId);
                Integer stockRealmenteDisponible = stockDisponible - stockAsignado;
                
                System.out.println("🔍 SECTOR SERVICE - Stock disponible: " + stockDisponible);
                System.out.println("🔍 SECTOR SERVICE - Stock ya asignado: " + stockAsignado);
                System.out.println("🔍 SECTOR SERVICE - Stock realmente disponible: " + stockRealmenteDisponible);
                
                if (cantidad > stockRealmenteDisponible) {
                    throw new RuntimeException("Stock insuficiente para el producto " + producto.getNombre() + 
                        ". Disponible: " + stockRealmenteDisponible + ", Solicitado: " + cantidad);
                }
                
                // Buscar si ya existe una asignación para este producto en este sector
                Optional<StockPorSector> stockExistente = stockPorSectorRepository.findByProductoIdAndSectorId(productoId, sectorId);
                
                if (stockExistente.isPresent()) {
                    // Actualizar la cantidad existente
                    StockPorSector stock = stockExistente.get();
                    stock.setCantidad(stock.getCantidad() + cantidad);
                    stockPorSectorRepository.save(stock);
                    System.out.println("🔍 SECTOR SERVICE - Stock actualizado: " + stock.getCantidad());
                } else {
                    // Crear nueva asignación
                    StockPorSector nuevoStock = new StockPorSector(producto, sector, cantidad);
                    stockPorSectorRepository.save(nuevoStock);
                    System.out.println("🔍 SECTOR SERVICE - Nueva asignación creada: " + cantidad);
                }
                
            } catch (NumberFormatException e) {
                throw new RuntimeException("Formato inválido en asignación: " + asignacion);
            } catch (Exception e) {
                throw new RuntimeException("Error procesando asignación: " + e.getMessage());
            }
        }
        
        System.out.println("🔍 SECTOR SERVICE - Asignación completada exitosamente");
    }
    
    /**
     * Quitar un producto de un sector
     */
    @Transactional
    public void quitarProductoDeSector(Long sectorId, Long empresaId, Long stockId) {
        System.out.println("🔍 SECTOR SERVICE - Iniciando quitar producto del sector: " + sectorId);
        System.out.println("🔍 SECTOR SERVICE - Empresa: " + empresaId);
        System.out.println("🔍 SECTOR SERVICE - Stock ID: " + stockId);
        
        // Verificar que el sector existe y pertenece a la empresa
        Sector sector = sectorRepository.findById(sectorId)
            .orElseThrow(() -> new RuntimeException("Sector no encontrado"));
        
        if (!sector.getEmpresa().getId().equals(empresaId)) {
            throw new RuntimeException("El sector no pertenece a la empresa especificada");
        }
        
        // Buscar el stock por sector
        StockPorSector stockPorSector = stockPorSectorRepository.findById(stockId)
            .orElseThrow(() -> new RuntimeException("Stock por sector no encontrado"));
        
        // Verificar que el stock pertenece al sector especificado
        if (!stockPorSector.getSector().getId().equals(sectorId)) {
            throw new RuntimeException("El stock no pertenece al sector especificado");
        }
        
        // Verificar que el producto pertenece a la empresa
        if (!stockPorSector.getProducto().getEmpresa().getId().equals(empresaId)) {
            throw new RuntimeException("El producto no pertenece a la empresa especificada");
        }
        
        System.out.println("🔍 SECTOR SERVICE - Quitando producto: " + stockPorSector.getProducto().getNombre());
        System.out.println("🔍 SECTOR SERVICE - Cantidad a quitar: " + stockPorSector.getCantidad());
        
        // Eliminar el registro de stock por sector
        stockPorSectorRepository.delete(stockPorSector);
        
        System.out.println("🔍 SECTOR SERVICE - Producto quitado exitosamente del sector");
    }
}
