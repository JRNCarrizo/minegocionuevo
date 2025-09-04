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
    
    @Autowired
    private StockSincronizacionService stockSincronizacionService;
    
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
        Integer stockAnterior = 0;
        
        if (stockExistente.isPresent()) {
            stockPorSector = stockExistente.get();
            stockAnterior = stockPorSector.getCantidad();
            stockPorSector.setCantidad(cantidad);
        } else {
            stockPorSector = new StockPorSector(producto, sector, cantidad);
        }
        
        StockPorSector stockGuardado = stockPorSectorRepository.save(stockPorSector);
        
        // SINCRONIZACIÓN AUTOMÁTICA CON PRODUCTO
        try {
            System.out.println("🔄 SINCRONIZACIÓN - Iniciando sincronización automática desde Gestión de Sectores");
            System.out.println("🔄 SINCRONIZACIÓN - Producto: " + productoId + ", Sector: " + sectorId + ", Cantidad: " + cantidad);
            
            // Sincronizar el sector con el producto
            Map<String, Object> resultadoSincronizacion = stockSincronizacionService.sincronizarSectorConProducto(
                producto.getEmpresa().getId(),
                productoId,
                sectorId,
                cantidad,
                "Asignación de stock desde Gestión de Sectores"
            );
            
            System.out.println("✅ SINCRONIZACIÓN - Sector sincronizado exitosamente: " + resultadoSincronizacion);
            
        } catch (Exception e) {
            System.err.println("❌ SINCRONIZACIÓN - Error en sincronización automática: " + e.getMessage());
            // No fallar la operación principal si hay error en sincronización
        }
        
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
     * Obtener stock detallado de la empresa
     * Formato requerido por el frontend para RecibirProductos
     */
    public List<Map<String, Object>> obtenerStockDetallado(Long empresaId) {
        System.out.println("🔍 SECTOR SERVICE - Iniciando obtenerStockDetallado para empresa: " + empresaId);
        
        Empresa empresa = empresaRepository.findById(empresaId)
            .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        
        List<Map<String, Object>> stockDetallado = new ArrayList<>();
        
        // Obtener TODOS los productos de la empresa
        List<Producto> todosLosProductos = productoRepository.findByEmpresaId(empresaId);
        System.out.println("🔍 SECTOR SERVICE - Total productos en empresa: " + todosLosProductos.size());
        
        // Obtener stock por sectores
        List<StockPorSector> stockPorSectores = stockPorSectorRepository.findByEmpresaId(empresaId);
        System.out.println("🔍 SECTOR SERVICE - StockPorSectores encontrados: " + stockPorSectores.size());
        
        for (Producto producto : todosLosProductos) {
            try {
                // Solo procesar productos activos
                if (!producto.getActivo()) {
                    continue;
                }
                
                List<Map<String, Object>> ubicaciones = new ArrayList<>();
                
                // Calcular el stock total asignado a sectores para este producto
                Integer stockAsignado = stockPorSectores.stream()
                    .filter(stock -> stock.getProducto().getId().equals(producto.getId()))
                    .mapToInt(StockPorSector::getCantidad)
                    .sum();
                
                // Calcular el stock sin asignar
                Integer stockTotal = producto.getStock() != null ? producto.getStock() : 0;
                Integer stockSinAsignar = Math.max(0, stockTotal - stockAsignado);
                
                // Agregar ubicación "Sin asignar" si hay stock disponible
                if (stockSinAsignar > 0) {
                    Map<String, Object> ubicacionSinAsignar = new HashMap<>();
                    ubicacionSinAsignar.put("ubicacion", "Sin asignar");
                    ubicacionSinAsignar.put("cantidad", stockSinAsignar);
                    ubicacionSinAsignar.put("stockId", producto.getId() + "_sin_asignar");
                    ubicaciones.add(ubicacionSinAsignar);
                }
                
                // Agregar ubicaciones por sector
                List<StockPorSector> stockDelProducto = stockPorSectores.stream()
                    .filter(stock -> stock.getProducto().getId().equals(producto.getId()))
                    .collect(Collectors.toList());
                
                for (StockPorSector stock : stockDelProducto) {
                    if (stock.getCantidad() > 0) {
                        Map<String, Object> ubicacion = new HashMap<>();
                        ubicacion.put("ubicacion", stock.getSector().getNombre());
                        ubicacion.put("cantidad", stock.getCantidad());
                        ubicacion.put("stockId", stock.getId().toString());
                        ubicaciones.add(ubicacion);
                    }
                }
                
                // Solo agregar productos que tengan ubicaciones con stock
                if (!ubicaciones.isEmpty()) {
                    Map<String, Object> productoDetallado = new HashMap<>();
                    productoDetallado.put("productoId", producto.getId());
                    productoDetallado.put("productoNombre", producto.getNombre());
                    productoDetallado.put("codigoPersonalizado", producto.getCodigoPersonalizado());
                    productoDetallado.put("ubicaciones", ubicaciones);
                    stockDetallado.add(productoDetallado);
                }
                
            } catch (Exception e) {
                System.err.println("🔍 SECTOR SERVICE - Error procesando Producto en stock detallado: " + e.getMessage());
                e.printStackTrace();
            }
        }
        
        System.out.println("🔍 SECTOR SERVICE - Total productos en stock detallado: " + stockDetallado.size());
        return stockDetallado;
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
                
                // Permitir cantidad 0 para asignaciones iniciales (cuando se crea un producto nuevo)
                if (cantidad < 0) {
                    System.out.println("🔍 SECTOR SERVICE - Cantidad negativa, saltando producto " + productoId);
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
                
                // Verificar que hay suficiente stock disponible (solo si la cantidad es mayor a 0)
                if (cantidad > 0) {
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
                } else {
                    System.out.println("🔍 SECTOR SERVICE - Asignación inicial con cantidad 0, no verificando stock");
                }
                
                // Buscar si ya existe una asignación para este producto en este sector
                Optional<StockPorSector> stockExistente = stockPorSectorRepository.findByProductoIdAndSectorId(productoId, sectorId);
                
                if (stockExistente.isPresent()) {
                    // Reemplazar la cantidad existente (no sumar)
                    StockPorSector stock = stockExistente.get();
                    stock.setCantidad(cantidad);
                    stockPorSectorRepository.save(stock);
                    System.out.println("🔍 SECTOR SERVICE - Stock reemplazado: " + stock.getCantidad());
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
     * Recibir productos en un sector (transferir desde otras ubicaciones)
     */
    @Transactional
    public void recibirProductosEnSector(Long sectorId, Long empresaId, List<Map<String, Object>> recepciones) {
        System.out.println("🔍 SECTOR SERVICE - Iniciando recepción de productos en el sector: " + sectorId);
        System.out.println("🔍 SECTOR SERVICE - Empresa: " + empresaId);
        System.out.println("🔍 SECTOR SERVICE - Recepciones: " + recepciones.size());
        System.out.println("🔍 SECTOR SERVICE - Datos de recepciones: " + recepciones);
        
        // Verificar que el sector existe y pertenece a la empresa
        Sector sector = sectorRepository.findById(sectorId)
            .orElseThrow(() -> new RuntimeException("Sector no encontrado"));
        
        if (!sector.getEmpresa().getId().equals(empresaId)) {
            throw new RuntimeException("El sector no pertenece a la empresa especificada");
        }
        
        if (!sector.getActivo()) {
            throw new RuntimeException("No se pueden recibir productos en un sector inactivo");
        }
        
        for (Map<String, Object> recepcion : recepciones) {
            System.out.println("🔍 SECTOR SERVICE - Procesando recepción: " + recepcion);
            try {
                Object productoIdObj = recepcion.get("productoId");
                Object stockIdObj = recepcion.get("stockId");
                Object cantidadObj = recepcion.get("cantidad");
                
                System.out.println("🔍 SECTOR SERVICE - productoIdObj: " + productoIdObj + " (tipo: " + (productoIdObj != null ? productoIdObj.getClass().getSimpleName() : "null") + ")");
                System.out.println("🔍 SECTOR SERVICE - stockIdObj: " + stockIdObj + " (tipo: " + (stockIdObj != null ? stockIdObj.getClass().getSimpleName() : "null") + ")");
                System.out.println("🔍 SECTOR SERVICE - cantidadObj: " + cantidadObj + " (tipo: " + (cantidadObj != null ? cantidadObj.getClass().getSimpleName() : "null") + ")");
                
                Long productoId;
                String stockId;
                Integer cantidad;
                
                if (productoIdObj instanceof Number) {
                    productoId = ((Number) productoIdObj).longValue();
                } else {
                    productoId = Long.valueOf(productoIdObj.toString());
                }
                
                stockId = stockIdObj.toString();
                
                if (cantidadObj instanceof Number) {
                    cantidad = ((Number) cantidadObj).intValue();
                } else {
                    cantidad = Integer.valueOf(cantidadObj.toString());
                }
                
                System.out.println("🔍 SECTOR SERVICE - Procesando recepción: Producto " + productoId + ", Stock " + stockId + ", Cantidad " + cantidad);
                
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
                    throw new RuntimeException("No se pueden recibir productos inactivos: " + producto.getNombre());
                }
                
                // Buscar el stock de origen
                StockPorSector stockOrigen = null;
                
                // Si el stockId contiene "_sin_asignar", significa que viene del stock general
                if (stockId.contains("_sin_asignar")) {
                    // Verificar que hay suficiente stock disponible en el producto
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
                } else {
                    // Buscar el stock específico
                    Long stockIdLong = Long.valueOf(stockId);
                    stockOrigen = stockPorSectorRepository.findById(stockIdLong)
                        .orElseThrow(() -> new RuntimeException("Stock de origen no encontrado: " + stockId));
                    
                    if (stockOrigen.getCantidad() < cantidad) {
                        throw new RuntimeException("Stock insuficiente en origen para el producto " + producto.getNombre() + 
                            ". Disponible: " + stockOrigen.getCantidad() + ", Solicitado: " + cantidad);
                    }
                    
                    // Reducir la cantidad en el stock de origen
                    stockOrigen.setCantidad(stockOrigen.getCantidad() - cantidad);
                    stockPorSectorRepository.save(stockOrigen);
                    System.out.println("🔍 SECTOR SERVICE - Stock de origen reducido: " + stockOrigen.getCantidad());
                }
                
                // Buscar si ya existe una asignación para este producto en el sector destino
                Optional<StockPorSector> stockExistente = stockPorSectorRepository.findByProductoIdAndSectorId(productoId, sectorId);
                
                if (stockExistente.isPresent()) {
                    // Sumar la cantidad a la existente
                    StockPorSector stock = stockExistente.get();
                    stock.setCantidad(stock.getCantidad() + cantidad);
                    stockPorSectorRepository.save(stock);
                    System.out.println("🔍 SECTOR SERVICE - Stock en destino aumentado: " + stock.getCantidad());
                } else {
                    // Crear nueva asignación
                    StockPorSector nuevoStock = new StockPorSector(producto, sector, cantidad);
                    stockPorSectorRepository.save(nuevoStock);
                    System.out.println("🔍 SECTOR SERVICE - Nueva asignación creada en destino: " + cantidad);
                }
                
            } catch (NumberFormatException e) {
                throw new RuntimeException("Formato inválido en recepción: " + recepcion);
            } catch (Exception e) {
                throw new RuntimeException("Error procesando recepción: " + e.getMessage());
            }
        }
        
        System.out.println("🔍 SECTOR SERVICE - Recepción completada exitosamente");
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
    
    /**
     * Transferir stock entre sectores
     */
    @Transactional
    public void transferirStockEntreSectores(Long empresaId, Long productoId, Long sectorOrigenId, Long sectorDestinoId, Integer cantidad) {
        System.out.println("🔍 TRANSFERIR STOCK - Iniciando transferencia");
        System.out.println("🔍 TRANSFERIR STOCK - Empresa: " + empresaId);
        System.out.println("🔍 TRANSFERIR STOCK - Producto: " + productoId);
        System.out.println("🔍 TRANSFERIR STOCK - Sector Origen: " + sectorOrigenId);
        System.out.println("🔍 TRANSFERIR STOCK - Sector Destino: " + sectorDestinoId);
        System.out.println("🔍 TRANSFERIR STOCK - Cantidad: " + cantidad);
        
        // Validaciones básicas
        if (cantidad <= 0) {
            throw new RuntimeException("La cantidad a transferir debe ser mayor a 0");
        }
        
        if (sectorOrigenId.equals(sectorDestinoId)) {
            throw new RuntimeException("No se puede transferir al mismo sector");
        }
        
        // Verificar que el producto existe y pertenece a la empresa
        Producto producto = productoRepository.findById(productoId)
            .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + productoId));
        
        if (!producto.getEmpresa().getId().equals(empresaId)) {
            throw new RuntimeException("El producto no pertenece a la empresa especificada");
        }
        
        if (!producto.getActivo()) {
            throw new RuntimeException("No se pueden transferir productos inactivos: " + producto.getNombre());
        }
        
        // Verificar que el sector origen existe y pertenece a la empresa
        Sector sectorOrigen = sectorRepository.findById(sectorOrigenId)
            .orElseThrow(() -> new RuntimeException("Sector origen no encontrado: " + sectorOrigenId));
        
        if (!sectorOrigen.getEmpresa().getId().equals(empresaId)) {
            throw new RuntimeException("El sector origen no pertenece a la empresa especificada");
        }
        
        if (!sectorOrigen.getActivo()) {
            throw new RuntimeException("El sector origen está inactivo: " + sectorOrigen.getNombre());
        }
        
        // Verificar que el sector destino existe y pertenece a la empresa
        Sector sectorDestino = sectorRepository.findById(sectorDestinoId)
            .orElseThrow(() -> new RuntimeException("Sector destino no encontrado: " + sectorDestinoId));
        
        if (!sectorDestino.getEmpresa().getId().equals(empresaId)) {
            throw new RuntimeException("El sector destino no pertenece a la empresa especificada");
        }
        
        if (!sectorDestino.getActivo()) {
            throw new RuntimeException("El sector destino está inactivo: " + sectorDestino.getNombre());
        }
        
        // Buscar el stock en el sector origen
        Optional<StockPorSector> stockOrigen = stockPorSectorRepository.findByProductoIdAndSectorId(productoId, sectorOrigenId);
        
        if (stockOrigen.isEmpty()) {
            throw new RuntimeException("El producto no tiene stock asignado en el sector origen: " + sectorOrigen.getNombre());
        }
        
        StockPorSector stockOrigenEntity = stockOrigen.get();
        
        // Verificar que hay suficiente stock en el sector origen
        if (stockOrigenEntity.getCantidad() < cantidad) {
            throw new RuntimeException("Stock insuficiente en el sector origen. Disponible: " + 
                stockOrigenEntity.getCantidad() + ", Solicitado: " + cantidad);
        }
        
        // Buscar el stock en el sector destino
        Optional<StockPorSector> stockDestino = stockPorSectorRepository.findByProductoIdAndSectorId(productoId, sectorDestinoId);
        
        // Realizar la transferencia
        if (stockDestino.isPresent()) {
            // Actualizar stock existente en el sector destino
            StockPorSector stockDestinoEntity = stockDestino.get();
            stockDestinoEntity.setCantidad(stockDestinoEntity.getCantidad() + cantidad);
            stockPorSectorRepository.save(stockDestinoEntity);
            System.out.println("🔍 TRANSFERIR STOCK - Stock actualizado en sector destino: " + stockDestinoEntity.getCantidad());
        } else {
            // Crear nueva asignación en el sector destino
            StockPorSector nuevoStockDestino = new StockPorSector(producto, sectorDestino, cantidad);
            stockPorSectorRepository.save(nuevoStockDestino);
            System.out.println("🔍 TRANSFERIR STOCK - Nueva asignación creada en sector destino: " + cantidad);
        }
        
        // Reducir stock del sector origen
        stockOrigenEntity.setCantidad(stockOrigenEntity.getCantidad() - cantidad);
        
        // Si el stock del sector origen queda en 0, eliminar el registro
        if (stockOrigenEntity.getCantidad() == 0) {
            stockPorSectorRepository.delete(stockOrigenEntity);
            System.out.println("🔍 TRANSFERIR STOCK - Registro eliminado del sector origen (stock = 0)");
        } else {
            stockPorSectorRepository.save(stockOrigenEntity);
            System.out.println("🔍 TRANSFERIR STOCK - Stock actualizado en sector origen: " + stockOrigenEntity.getCantidad());
        }
        
        System.out.println("🔍 TRANSFERIR STOCK - Transferencia completada exitosamente");
        System.out.println("🔍 TRANSFERIR STOCK - Producto: " + producto.getNombre());
        System.out.println("🔍 TRANSFERIR STOCK - Desde: " + sectorOrigen.getNombre() + " (" + (stockOrigenEntity.getCantidad() + cantidad) + " -> " + stockOrigenEntity.getCantidad() + ")");
        System.out.println("🔍 TRANSFERIR STOCK - Hacia: " + sectorDestino.getNombre() + " (+" + cantidad + ")");
    }
    
    /**
     * Limpia duplicaciones de stock por sector para una empresa
     * Este método debe ejecutarse una vez para corregir datos existentes
     */
    @Transactional
    public void limpiarDuplicacionesStock(Long empresaId) {
        System.out.println("🔍 LIMPIAR DUPLICACIONES - Iniciando limpieza para empresa: " + empresaId);
        
        // Obtener todos los productos de la empresa
        List<Producto> productos = productoRepository.findByEmpresaId(empresaId);
        
        for (Producto producto : productos) {
            System.out.println("🔍 LIMPIAR DUPLICACIONES - Procesando producto: " + producto.getNombre());
            
            // Obtener todas las asignaciones de stock para este producto
            List<StockPorSector> asignaciones = stockPorSectorRepository.findByProductoId(producto.getId());
            
            if (asignaciones.isEmpty()) {
                continue;
            }
            
            // Calcular el stock total asignado
            Integer stockTotalAsignado = asignaciones.stream()
                .mapToInt(StockPorSector::getCantidad)
                .sum();
            
            System.out.println("🔍 LIMPIAR DUPLICACIONES - Stock total asignado: " + stockTotalAsignado);
            System.out.println("🔍 LIMPIAR DUPLICACIONES - Stock real del producto: " + producto.getStock());
            
            // Si el stock asignado supera el stock real, hay duplicación
            if (stockTotalAsignado > (producto.getStock() != null ? producto.getStock() : 0)) {
                System.out.println("🔍 LIMPIAR DUPLICACIONES - ¡DUPLICACIÓN DETECTADA!");
                
                // Eliminar todas las asignaciones existentes
                stockPorSectorRepository.deleteAll(asignaciones);
                System.out.println("🔍 LIMPIAR DUPLICACIONES - Asignaciones eliminadas");
                
                // Crear una nueva asignación con el stock real en el primer sector
                if (!asignaciones.isEmpty()) {
                    Sector primerSector = asignaciones.get(0).getSector();
                    StockPorSector nuevaAsignacion = new StockPorSector(producto, primerSector, producto.getStock() != null ? producto.getStock() : 0);
                    stockPorSectorRepository.save(nuevaAsignacion);
                    System.out.println("🔍 LIMPIAR DUPLICACIONES - Nueva asignación creada en sector: " + primerSector.getNombre());
                }
            }
        }
        
        System.out.println("🔍 LIMPIAR DUPLICACIONES - Limpieza completada");
    }
    
    /**
     * Asignar automáticamente productos a sectores basándose en el campo sectorAlmacenamiento
     */
    @Transactional
    public void asignarProductosAutomaticamente(Long empresaId) {
        System.out.println("🔍 ASIGNAR PRODUCTOS AUTOMATICAMENTE - Iniciando para empresa: " + empresaId);
        
        // Primero obtener la empresa
        Empresa empresa = empresaRepository.findById(empresaId)
            .orElseThrow(() -> new RuntimeException("Empresa no encontrada con ID: " + empresaId));
        
        // Obtener todos los productos de la empresa que tienen sectorAlmacenamiento
        List<Producto> productosConSector = productoRepository.findByEmpresaAndSectorAlmacenamientoIsNotNullAndSectorAlmacenamientoNot(empresa, "");
        System.out.println("🔍 ASIGNAR PRODUCTOS AUTOMATICAMENTE - Productos con sectorAlmacenamiento: " + productosConSector.size());
        
        // Obtener todos los sectores de la empresa
        List<Sector> sectores = sectorRepository.findByEmpresaIdOrderByNombre(empresaId);
        System.out.println("🔍 ASIGNAR PRODUCTOS AUTOMATICAMENTE - Sectores disponibles: " + sectores.size());
        
        int productosAsignados = 0;
        
        for (Producto producto : productosConSector) {
            try {
                String sectorAlmacenamiento = producto.getSectorAlmacenamiento();
                if (sectorAlmacenamiento == null || sectorAlmacenamiento.trim().isEmpty()) {
                    continue;
                }
                
                // Buscar un sector que coincida con el sectorAlmacenamiento
                Sector sectorEncontrado = null;
                for (Sector sector : sectores) {
                    if (sector.getNombre().equalsIgnoreCase(sectorAlmacenamiento.trim())) {
                        sectorEncontrado = sector;
                        break;
                    }
                }
                
                if (sectorEncontrado != null) {
                    // Verificar si ya existe una asignación
                    Optional<StockPorSector> stockExistente = stockPorSectorRepository.findByProductoIdAndSectorId(
                        producto.getId(), sectorEncontrado.getId());
                    
                    if (stockExistente.isPresent()) {
                        // Actualizar la cantidad existente
                        StockPorSector stock = stockExistente.get();
                        stock.setCantidad(producto.getStock() != null ? producto.getStock() : 0);
                        stockPorSectorRepository.save(stock);
                        System.out.println("🔍 ASIGNAR PRODUCTOS AUTOMATICAMENTE - Actualizado: " + producto.getNombre() + " en " + sectorEncontrado.getNombre());
                    } else {
                        // Crear nueva asignación
                        StockPorSector nuevoStock = new StockPorSector(producto, sectorEncontrado, 
                            producto.getStock() != null ? producto.getStock() : 0);
                        stockPorSectorRepository.save(nuevoStock);
                        System.out.println("🔍 ASIGNAR PRODUCTOS AUTOMATICAMENTE - Creado: " + producto.getNombre() + " en " + sectorEncontrado.getNombre());
                    }
                    productosAsignados++;
                } else {
                    System.out.println("🔍 ASIGNAR PRODUCTOS AUTOMATICAMENTE - Sector no encontrado para: " + sectorAlmacenamiento);
                }
            } catch (Exception e) {
                System.err.println("🔍 ASIGNAR PRODUCTOS AUTOMATICAMENTE - Error procesando producto " + producto.getNombre() + ": " + e.getMessage());
            }
        }
        
        System.out.println("🔍 ASIGNAR PRODUCTOS AUTOMATICAMENTE - Total productos asignados: " + productosAsignados);
    }
}
