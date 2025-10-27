package com.minegocio.backend.servicios;

import com.minegocio.backend.entidades.Producto;
import com.minegocio.backend.entidades.StockPorSector;
import com.minegocio.backend.entidades.Sector;
import com.minegocio.backend.repositorios.ProductoRepository;
import com.minegocio.backend.repositorios.StockPorSectorRepository;
import com.minegocio.backend.repositorios.SectorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Comparator;
import java.util.stream.Collectors;

/**
 * Servicio para sincronizar stock entre la gestión de sectores y el sistema de ingresos/cargas
 * Implementa la estrategia híbrida inteligente de descuento de stock
 */
@Service
public class StockSincronizacionService {

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private StockPorSectorRepository stockPorSectorRepository;

    @Autowired
    private SectorRepository sectorRepository;

    /**
     * Descuenta stock de un producto aplicando la estrategia híbrida inteligente
     * 
     * @param empresaId ID de la empresa
     * @param productoId ID del producto
     * @param cantidad Cantidad a descontar
     * @param motivo Motivo del descuento (ej: "Carga de planilla", "Venta rápida", etc.)
     * @return Map con el detalle de los descuentos realizados
     */
    @Transactional
    public Map<String, Object> descontarStockInteligente(Long empresaId, Long productoId, Integer cantidad, String motivo) {
        System.out.println("🔍 STOCK SINCRONIZACIÓN - Iniciando descuento inteligente");
        System.out.println("🔍 STOCK SINCRONIZACIÓN - Empresa: " + empresaId + ", Producto: " + productoId + ", Cantidad: " + cantidad);
        
        // Verificar que el producto existe y pertenece a la empresa
        Producto producto = productoRepository.findByIdAndEmpresaId(productoId, empresaId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado o no pertenece a la empresa"));

        // Verificar stock total disponible
        Integer stockTotalDisponible = obtenerStockTotalDisponible(empresaId, productoId);
        if (stockTotalDisponible < cantidad) {
            throw new RuntimeException("Stock insuficiente para el producto: " + producto.getNombre() + 
                ". Disponible: " + stockTotalDisponible + ", Solicitado: " + cantidad);
        }

        Map<String, Object> resultado = new HashMap<>();
        resultado.put("productoId", productoId);
        resultado.put("productoNombre", producto.getNombre());
        resultado.put("cantidadSolicitada", cantidad);
        resultado.put("motivo", motivo);
        resultado.put("fechaDescuento", LocalDateTime.now());
        resultado.put("descuentos", new java.util.ArrayList<Map<String, Object>>());

        Integer cantidadRestante = cantidad;

        System.out.println("🔍 STOCK SINCRONIZACIÓN - Iniciando descuento de " + cantidad + " unidades");
        System.out.println("🔍 STOCK SINCRONIZACIÓN - Stock total disponible: " + stockTotalDisponible);
        
        // 1. PRIMERA PRIORIDAD: Descontar de productos sin sectorizar
        System.out.println("🔍 STOCK SINCRONIZACIÓN - Paso 1: Descontando de productos sin sectorizar...");
        cantidadRestante = descontarDeProductoSinSectorizar(empresaId, productoId, cantidadRestante, resultado);
        System.out.println("🔍 STOCK SINCRONIZACIÓN - Cantidad restante después de sin sectorizar: " + cantidadRestante);

        // 2. SEGUNDA PRIORIDAD: Descontar de sectores ordenados por cantidad (menor a mayor)
        if (cantidadRestante > 0) {
            System.out.println("🔍 STOCK SINCRONIZACIÓN - Paso 2: Descontando de sectores...");
            cantidadRestante = descontarDeSectores(empresaId, productoId, cantidadRestante, resultado);
            System.out.println("🔍 STOCK SINCRONIZACIÓN - Cantidad restante después de sectores: " + cantidadRestante);
        } else {
            System.out.println("🔍 STOCK SINCRONIZACIÓN - No hay cantidad restante para descontar de sectores");
        }

        // NO actualizar el stock total del producto aquí porque ya se actualizó en descontarDeProductoSinSectorizar
        // El stock del producto ya refleja el stock sin sectorizar después del descuento

        // 3. LIMPIEZA FINAL: Eliminar registros de StockPorSector con cantidad 0 para este producto
        limpiarRegistrosStockCero(productoId, empresaId);
        
        // 4. LIMPIEZA ADICIONAL: Si el producto quedó en stock 0, limpiar sectorAlmacenamiento
        if (producto.getStock() != null && producto.getStock() <= 0) {
            limpiarSectorAlmacenamientoSiStockCero(productoId, empresaId);
        }

        resultado.put("cantidadDescontada", cantidad - cantidadRestante);
        resultado.put("cantidadRestante", cantidadRestante);
        resultado.put("stockRestante", stockTotalDisponible - cantidad);

        System.out.println("✅ STOCK SINCRONIZACIÓN - Descuento completado exitosamente");
        System.out.println("✅ STOCK SINCRONIZACIÓN - Cantidad descontada: " + (cantidad - cantidadRestante));

        return resultado;
    }

    /**
     * Incrementa stock de un producto usando la estrategia híbrida inteligente
     * Los incrementos siempre van al stock sin sectorizar del producto
     */
    @Transactional
    public Map<String, Object> incrementarStockInteligente(Long empresaId, Long productoId, Integer cantidad, String observacion) {
        System.out.println("🔍 STOCK SINCRONIZACIÓN - Iniciando incremento de " + cantidad + " unidades");
        
        // Validar que el producto existe
        Producto producto = productoRepository.findByIdAndEmpresaId(productoId, empresaId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        // Obtener stock actual
        Integer stockActual = producto.getStock() != null ? producto.getStock() : 0;
        Integer stockEnSectores = stockPorSectorRepository.findByProductoIdAndSectorEmpresaId(productoId, empresaId)
                .stream()
                .mapToInt(stock -> stock.getCantidad() != null ? stock.getCantidad() : 0)
                .sum();
        
        Integer stockSinSectorizar = Math.max(0, stockActual - stockEnSectores);
        
        System.out.println("🔍 STOCK SINCRONIZACIÓN - Stock actual: " + stockActual);
        System.out.println("🔍 STOCK SINCRONIZACIÓN - Stock en sectores: " + stockEnSectores);
        System.out.println("🔍 STOCK SINCRONIZACIÓN - Stock sin sectorizar: " + stockSinSectorizar);
        
        // Incrementar el stock total del producto
        Integer nuevoStockTotal = stockActual + cantidad;
        producto.setStock(nuevoStockTotal);
        productoRepository.save(producto);
        
        System.out.println("🔍 STOCK SINCRONIZACIÓN - Nuevo stock total: " + nuevoStockTotal);
        System.out.println("🔍 STOCK SINCRONIZACIÓN - Nuevo stock sin sectorizar: " + (stockSinSectorizar + cantidad));
        
        // Crear resultado
        Map<String, Object> resultado = new HashMap<>();
        resultado.put("productoId", productoId);
        resultado.put("productoNombre", producto.getNombre());
        resultado.put("cantidadIncrementada", cantidad);
        resultado.put("stockAnterior", stockActual);
        resultado.put("stockNuevo", nuevoStockTotal);
        resultado.put("stockSinSectorizarAnterior", stockSinSectorizar);
        resultado.put("stockSinSectorizarNuevo", stockSinSectorizar + cantidad);
        resultado.put("observacion", observacion);
        resultado.put("fechaIncremento", LocalDateTime.now());
        
        System.out.println("✅ STOCK SINCRONIZACIÓN - Incremento completado exitosamente");
        
        return resultado;
    }

    /**
     * Obtiene el stock total disponible de un producto (incluyendo sin sectorizar y por sectores)
     */
    public Integer obtenerStockTotalDisponible(Long empresaId, Long productoId) {
        // Stock del producto principal
        Producto producto = productoRepository.findByIdAndEmpresaId(productoId, empresaId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
        
        Integer stockTotal = producto.getStock() != null ? producto.getStock() : 0;

        // Stock en sectores
        List<StockPorSector> stockEnSectores = stockPorSectorRepository.findByProductoIdAndSectorEmpresaId(productoId, empresaId);
        Integer stockEnSectoresTotal = stockEnSectores.stream()
                .mapToInt(stock -> stock.getCantidad() != null ? stock.getCantidad() : 0)
                .sum();

        return stockTotal + stockEnSectoresTotal;
    }

    /**
     * Descuenta stock del producto sin sectorizar
     * IMPORTANTE: Solo descuenta del producto.stock si realmente hay stock sin sectorizar
     */
    private Integer descontarDeProductoSinSectorizar(Long empresaId, Long productoId, Integer cantidad, Map<String, Object> resultado) {
        Producto producto = productoRepository.findByIdAndEmpresaId(productoId, empresaId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        // Calcular el stock realmente sin sectorizar
        Integer stockTotalProducto = producto.getStock() != null ? producto.getStock() : 0;
        Integer stockEnSectores = stockPorSectorRepository.findByProductoIdAndSectorEmpresaId(productoId, empresaId)
                .stream()
                .mapToInt(stock -> stock.getCantidad() != null ? stock.getCantidad() : 0)
                .sum();
        
        // El stock sin sectorizar es la diferencia entre el stock total y el stock en sectores
        Integer stockSinSectorizar = Math.max(0, stockTotalProducto - stockEnSectores);
        
        System.out.println("🔍 STOCK SINCRONIZACIÓN - Stock total producto: " + stockTotalProducto);
        System.out.println("🔍 STOCK SINCRONIZACIÓN - Stock en sectores: " + stockEnSectores);
        System.out.println("🔍 STOCK SINCRONIZACIÓN - Stock sin sectorizar calculado: " + stockSinSectorizar);
        
        if (stockSinSectorizar > 0) {
            Integer cantidadADescontar = Math.min(cantidad, stockSinSectorizar);
            
            // Descontar del producto principal
            Integer nuevoStockTotal = stockTotalProducto - cantidadADescontar;
            producto.setStock(nuevoStockTotal);
            productoRepository.save(producto);

            // Registrar el descuento
            Map<String, Object> descuento = new HashMap<>();
            descuento.put("tipo", "SIN_SECTORIZAR");
            descuento.put("cantidad", cantidadADescontar);
            descuento.put("stockAnterior", stockTotalProducto);
            descuento.put("stockNuevo", nuevoStockTotal);
            descuento.put("stockSinSectorizarAnterior", stockSinSectorizar);
            descuento.put("stockSinSectorizarNuevo", stockSinSectorizar - cantidadADescontar);
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> descuentos = (List<Map<String, Object>>) resultado.get("descuentos");
            descuentos.add(descuento);

            System.out.println("🔍 STOCK SINCRONIZACIÓN - Descontado de sin sectorizar: " + cantidadADescontar);
            System.out.println("🔍 STOCK SINCRONIZACIÓN - Nuevo stock total: " + nuevoStockTotal);
            
            return cantidad - cantidadADescontar;
        } else {
            System.out.println("🔍 STOCK SINCRONIZACIÓN - No hay stock sin sectorizar para descontar");
        }
        
        return cantidad;
    }

    /**
     * Descuenta stock de sectores ordenados por cantidad (menor a mayor)
     */
    private Integer descontarDeSectores(Long empresaId, Long productoId, Integer cantidad, Map<String, Object> resultado) {
        System.out.println("🔍 STOCK SINCRONIZACIÓN - Descontando de sectores: " + cantidad + " unidades");
        
        // Obtener todos los sectores con stock del producto, ordenados por cantidad (menor a mayor)
        List<StockPorSector> stockEnSectores = stockPorSectorRepository.findByProductoIdAndSectorEmpresaId(productoId, empresaId)
                .stream()
                .filter(stock -> stock.getCantidad() != null && stock.getCantidad() > 0)
                .sorted(Comparator.comparing(StockPorSector::getCantidad))
                .collect(Collectors.toList());

        System.out.println("🔍 STOCK SINCRONIZACIÓN - Sectores encontrados con stock: " + stockEnSectores.size());
        for (StockPorSector stock : stockEnSectores) {
            System.out.println("🔍 STOCK SINCRONIZACIÓN - Sector: " + stock.getSector().getNombre() + " - Cantidad: " + stock.getCantidad());
        }

        Integer cantidadRestante = cantidad;

        for (StockPorSector stockSector : stockEnSectores) {
            if (cantidadRestante <= 0) break;

            Integer cantidadADescontar = Math.min(cantidadRestante, stockSector.getCantidad());
            Integer stockAnterior = stockSector.getCantidad();

            // Descontar del sector
            Integer nuevaCantidad = stockAnterior - cantidadADescontar;
            
            if (nuevaCantidad <= 0) {
                // Si la cantidad queda en 0 o menos, eliminar el registro
                stockPorSectorRepository.delete(stockSector);
                System.out.println("🗑️ STOCK SINCRONIZACIÓN - Eliminado registro de sector con stock 0: " + stockSector.getSector().getNombre());
            } else {
                // Si queda stock, actualizar la cantidad
                stockSector.setCantidad(nuevaCantidad);
                stockSector.setFechaActualizacion(LocalDateTime.now());
                stockPorSectorRepository.save(stockSector);
            }
            
            // ACTUALIZAR EL STOCK TOTAL DEL PRODUCTO
            // Cuando se descuenta de sectores, también hay que actualizar el stock total del producto
            Producto producto = productoRepository.findByIdAndEmpresaId(productoId, empresaId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
            
            Integer stockTotalAnterior = producto.getStock() != null ? producto.getStock() : 0;
            Integer nuevoStockTotal = stockTotalAnterior - cantidadADescontar;
            producto.setStock(nuevoStockTotal);
            productoRepository.save(producto);
            
            System.out.println("🔍 STOCK SINCRONIZACIÓN - Stock total del producto actualizado: " + stockTotalAnterior + " -> " + nuevoStockTotal);

            // Registrar el descuento
            Map<String, Object> descuento = new HashMap<>();
            descuento.put("tipo", "SECTOR");
            descuento.put("sectorId", stockSector.getSector().getId());
            descuento.put("sectorNombre", stockSector.getSector().getNombre());
            descuento.put("cantidad", cantidadADescontar);
            descuento.put("stockAnterior", stockAnterior);
            descuento.put("stockNuevo", nuevaCantidad <= 0 ? 0 : nuevaCantidad);
            descuento.put("registroEliminado", nuevaCantidad <= 0);

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> descuentos = (List<Map<String, Object>>) resultado.get("descuentos");
            descuentos.add(descuento);

            System.out.println("🔍 STOCK SINCRONIZACIÓN - Descontado del sector " + stockSector.getSector().getNombre() + ": " + cantidadADescontar);

            cantidadRestante -= cantidadADescontar;
        }

        return cantidadRestante;
    }



    /**
     * Obtiene el detalle de stock disponible por ubicación para un producto
     */
    public Map<String, Object> obtenerDetalleStockDisponible(Long empresaId, Long productoId) {
        Producto producto = productoRepository.findByIdAndEmpresaId(productoId, empresaId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        Map<String, Object> resultado = new HashMap<>();
        resultado.put("productoId", productoId);
        resultado.put("productoNombre", producto.getNombre());
        resultado.put("stockSinSectorizar", producto.getStock() != null ? producto.getStock() : 0);

        // Stock en sectores
        List<StockPorSector> stockEnSectores = stockPorSectorRepository.findByProductoIdAndSectorEmpresaId(productoId, empresaId)
                .stream()
                .filter(stock -> stock.getCantidad() != null && stock.getCantidad() > 0)
                .sorted(Comparator.comparing(StockPorSector::getCantidad))
                .collect(Collectors.toList());

        List<Map<String, Object>> sectores = stockEnSectores.stream()
                .map(stock -> {
                    Map<String, Object> sector = new HashMap<>();
                    sector.put("sectorId", stock.getSector().getId());
                    sector.put("sectorNombre", stock.getSector().getNombre());
                    sector.put("cantidad", stock.getCantidad());
                    return sector;
                })
                .collect(Collectors.toList());

        resultado.put("sectores", sectores);

        // Stock total
        Integer stockTotal = (producto.getStock() != null ? producto.getStock() : 0) + 
                           stockEnSectores.stream().mapToInt(stock -> stock.getCantidad() != null ? stock.getCantidad() : 0).sum();
        resultado.put("stockTotal", stockTotal);

        return resultado;
    }

    /**
     * Sincroniza el stock del producto con los sectores
     * Se usa cuando se modifica el stock directamente en Gestión de Productos
     */
    @Transactional
    public Map<String, Object> sincronizarStockConSectores(Long empresaId, Long productoId, Integer nuevoStockTotal, String motivo) {
        System.out.println("🔄 SINCRONIZACIÓN - Iniciando sincronización de stock con sectores");
        System.out.println("🔄 SINCRONIZACIÓN - Empresa: " + empresaId + ", Producto: " + productoId + ", Nuevo Stock Total: " + nuevoStockTotal);
        
        Producto producto = productoRepository.findByIdAndEmpresaId(productoId, empresaId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        // Obtener stock actual del producto (sin sumar sectores)
        Integer stockAnterior = producto.getStock() != null ? producto.getStock() : 0;
        Integer diferencia = nuevoStockTotal - stockAnterior;
        
        System.out.println("🔄 SINCRONIZACIÓN - Stock anterior del producto: " + stockAnterior);
        System.out.println("🔄 SINCRONIZACIÓN - Nuevo stock total solicitado: " + nuevoStockTotal);
        System.out.println("🔄 SINCRONIZACIÓN - Diferencia a aplicar: " + diferencia);

        Map<String, Object> resultado = new HashMap<>();
        resultado.put("productoId", productoId);
        resultado.put("productoNombre", producto.getNombre());
        resultado.put("stockAnterior", stockAnterior);
        resultado.put("nuevoStockTotal", nuevoStockTotal);
        resultado.put("diferencia", diferencia);
        resultado.put("motivo", motivo);
        resultado.put("fechaSincronizacion", LocalDateTime.now());
        resultado.put("cambios", new java.util.ArrayList<Map<String, Object>>());

        if (diferencia > 0) {
            // Aumento de stock - agregar al producto sin sectorizar
            Integer stockSinSectorizar = producto.getStock() != null ? producto.getStock() : 0;
            producto.setStock(stockSinSectorizar + diferencia);
            productoRepository.save(producto);

            Map<String, Object> cambio = new HashMap<>();
            cambio.put("tipo", "AUMENTO_SIN_SECTORIZAR");
            cambio.put("cantidad", diferencia);
            cambio.put("stockAnterior", stockSinSectorizar);
            cambio.put("stockNuevo", stockSinSectorizar + diferencia);

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> cambios = (List<Map<String, Object>>) resultado.get("cambios");
            cambios.add(cambio);

            System.out.println("🔄 SINCRONIZACIÓN - Aumentado stock sin sectorizar: " + diferencia);

        } else if (diferencia < 0) {
            // Disminución de stock - aplicar estrategia híbrida inteligente
            Integer cantidadADescontar = Math.abs(diferencia);
            descontarStockInteligente(empresaId, productoId, cantidadADescontar, "Sincronización: " + motivo);
            
            // NO actualizar el stock del producto aquí porque descontarStockInteligente ya lo hace
            // El stock del producto ya refleja el stock sin sectorizar después del descuento
            
            System.out.println("🔄 SINCRONIZACIÓN - Descontado stock usando estrategia híbrida: " + cantidadADescontar);
        }

        System.out.println("✅ SINCRONIZACIÓN - Sincronización completada exitosamente");
        return resultado;
    }

    /**
     * Sincroniza el stock de un sector con el producto principal
     * Se usa cuando se modifica el stock en Gestión de Sectores
     */
    @Transactional
    public Map<String, Object> sincronizarSectorConProducto(Long empresaId, Long productoId, Long sectorId, Integer nuevoStockSector, String motivo) {
        System.out.println("🔄 SINCRONIZACIÓN - Iniciando sincronización de sector con producto");
        System.out.println("🔄 SINCRONIZACIÓN - Sector: " + sectorId + ", Nuevo Stock: " + nuevoStockSector);
        
        Producto producto = productoRepository.findByIdAndEmpresaId(productoId, empresaId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        // Buscar o crear el stock por sector
        StockPorSector stockSector = stockPorSectorRepository.findByProductoIdAndSectorId(productoId, sectorId)
                .orElseGet(() -> {
                    Sector sector = sectorRepository.findById(sectorId)
                            .orElseThrow(() -> new RuntimeException("Sector no encontrado"));
                    
                    StockPorSector nuevoStock = new StockPorSector();
                    nuevoStock.setProducto(producto);
                    nuevoStock.setSector(sector);
                    nuevoStock.setCantidad(0);
                    return nuevoStock;
                });

        Integer stockAnterior = stockSector.getCantidad() != null ? stockSector.getCantidad() : 0;
        Integer diferencia = nuevoStockSector - stockAnterior;

        Map<String, Object> resultado = new HashMap<>();
        resultado.put("productoId", productoId);
        resultado.put("productoNombre", producto.getNombre());
        resultado.put("sectorId", sectorId);
        resultado.put("stockAnterior", stockAnterior);
        resultado.put("nuevoStock", nuevoStockSector);
        resultado.put("diferencia", diferencia);
        resultado.put("motivo", motivo);
        resultado.put("fechaSincronizacion", LocalDateTime.now());

        // Actualizar el stock del sector
        stockSector.setCantidad(nuevoStockSector);
        stockSector.setFechaActualizacion(LocalDateTime.now());
        stockPorSectorRepository.save(stockSector);

        // Ajustar el stock del producto principal si es necesario
        if (diferencia != 0) {
            Integer stockProducto = producto.getStock() != null ? producto.getStock() : 0;
            producto.setStock(stockProducto - diferencia); // Restar porque el stock del sector aumentó
            productoRepository.save(producto);
        }

        System.out.println("✅ SINCRONIZACIÓN - Sector sincronizado exitosamente");
        return resultado;
    }

    /**
     * Verifica la consistencia entre el stock del producto y los sectores
     */
    public Map<String, Object> verificarConsistencia(Long empresaId, Long productoId) {
        Producto producto = productoRepository.findByIdAndEmpresaId(productoId, empresaId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        List<StockPorSector> stockEnSectores = stockPorSectorRepository.findByProductoIdAndSectorEmpresaId(productoId, empresaId);
        Integer stockEnSectoresTotal = stockEnSectores.stream()
                .mapToInt(stock -> stock.getCantidad() != null ? stock.getCantidad() : 0)
                .sum();

        Integer stockProducto = producto.getStock() != null ? producto.getStock() : 0;
        Integer stockTotalCalculado = stockProducto + stockEnSectoresTotal;

        Map<String, Object> resultado = new HashMap<>();
        resultado.put("productoId", productoId);
        resultado.put("productoNombre", producto.getNombre());
        resultado.put("stockProducto", stockProducto);
        resultado.put("stockEnSectores", stockEnSectoresTotal);
        resultado.put("stockTotalCalculado", stockTotalCalculado);
        resultado.put("esConsistente", true); // Por defecto asumimos que es consistente

        // Verificar si hay inconsistencias
        if (stockProducto < 0) {
            resultado.put("esConsistente", false);
            resultado.put("error", "Stock del producto es negativo: " + stockProducto);
        }

        if (stockEnSectoresTotal < 0) {
            resultado.put("esConsistente", false);
            resultado.put("error", "Stock en sectores es negativo: " + stockEnSectoresTotal);
        }

        return resultado;
    }

    /**
     * Limpia registros de StockPorSector con cantidad 0 para un producto específico
     * Este método se ejecuta automáticamente después de cada descuento de stock
     */
    private void limpiarRegistrosStockCero(Long productoId, Long empresaId) {
        try {
            System.out.println("🧹 STOCK SINCRONIZACIÓN - Limpiando registros con stock 0 para producto: " + productoId);
            
            // Obtener todos los registros de StockPorSector para este producto
            List<StockPorSector> registrosStock = stockPorSectorRepository.findByProductoIdAndSectorEmpresaId(productoId, empresaId);
            
            int registrosEliminados = 0;
            for (StockPorSector stock : registrosStock) {
                if (stock.getCantidad() == null || stock.getCantidad() <= 0) {
                    stockPorSectorRepository.delete(stock);
                    registrosEliminados++;
                    System.out.println("🗑️ STOCK SINCRONIZACIÓN - Eliminado registro con stock 0 en sector: " + stock.getSector().getNombre());
                }
            }
            
            if (registrosEliminados > 0) {
                System.out.println("✅ STOCK SINCRONIZACIÓN - Limpieza completada. Registros eliminados: " + registrosEliminados);
            } else {
                System.out.println("✅ STOCK SINCRONIZACIÓN - No se encontraron registros con stock 0 para limpiar");
            }
            
        } catch (Exception e) {
            System.err.println("❌ STOCK SINCRONIZACIÓN - Error limpiando registros con stock 0: " + e.getMessage());
            // No fallar la operación principal si hay error en la limpieza
        }
    }

    /**
     * Limpia el campo sectorAlmacenamiento de un producto si quedó en stock cero
     * Esto asegura que el producto aparezca correctamente en el stock general
     */
    private void limpiarSectorAlmacenamientoSiStockCero(Long productoId, Long empresaId) {
        try {
            System.out.println("🧹 STOCK SINCRONIZACIÓN - Limpiando sectorAlmacenamiento para producto con stock cero: " + productoId);
            
            Producto producto = productoRepository.findByIdAndEmpresaId(productoId, empresaId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));
            
            // Solo limpiar si realmente tiene stock 0 y tiene sectorAlmacenamiento asignado
            if ((producto.getStock() == null || producto.getStock() <= 0) && 
                (producto.getSectorAlmacenamiento() != null && !producto.getSectorAlmacenamiento().trim().isEmpty())) {
                
                String sectorAnterior = producto.getSectorAlmacenamiento();
                producto.setSectorAlmacenamiento(null);
                productoRepository.save(producto);
                
                System.out.println("✅ STOCK SINCRONIZACIÓN - sectorAlmacenamiento limpiado para producto: " + producto.getNombre() + 
                    " (sector anterior: " + sectorAnterior + ")");
            } else {
                System.out.println("✅ STOCK SINCRONIZACIÓN - No se requiere limpieza de sectorAlmacenamiento para producto: " + producto.getNombre());
            }
            
        } catch (Exception e) {
            System.err.println("❌ STOCK SINCRONIZACIÓN - Error limpiando sectorAlmacenamiento: " + e.getMessage());
            // No fallar la operación principal si hay error en la limpieza
        }
    }
}
