package com.minegocio.backend.servicios;

import com.minegocio.backend.dto.MovimientoDiaDTO;
import com.minegocio.backend.entidades.*;
import com.minegocio.backend.repositorios.*;
import com.minegocio.backend.seguridad.UsuarioPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.jdbc.core.JdbcTemplate;

import java.io.IOException;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

@Service
public class MovimientoDiaService {
    
    // Configurar sistema para modo headless al inicializar la clase
    static {
        System.setProperty("java.awt.headless", "true");
        System.setProperty("java.awt.graphicsenv", "sun.awt.X11GraphicsEnvironment");
        System.setProperty("sun.java2d.headless", "true");
        System.setProperty("sun.java2d.noddraw", "true");
        System.setProperty("sun.java2d.d3d", "false");
        System.setProperty("sun.java2d.opengl", "false");
        System.setProperty("sun.java2d.pmoffscreen", "false");
        System.setProperty("sun.java2d.xrender", "false");
        
        // Configuración adicional para Apache POI
        System.setProperty("org.apache.poi.util.POILogger", "org.apache.poi.util.NullLogger");
    }
    
    @Autowired
    private CierreDiaRepository cierreDiaRepository;
    
    @Autowired
    private DetalleCierreDiaRepository detalleCierreDiaRepository;
    
    @Autowired
    private ProductoRepository productoRepository;
    
    @Autowired
    private PlanillaPedidoRepository planillaPedidoRepository;

    @Autowired
    private PlanillaDevolucionRepository planillaDevolucionRepository;
    
    @Autowired
    private RoturaPerdidaRepository roturaPerdidaRepository;
    
    @Autowired
    private DetallePlanillaPedidoRepository detallePlanillaPedidoRepository;
    
    @Autowired
    private DetallePlanillaDevolucionRepository detallePlanillaDevolucionRepository;
    
    @Autowired
    private RemitoIngresoRepository remitoIngresoRepository;
    
    @Autowired
    private DetalleRemitoIngresoRepository detalleRemitoIngresoRepository;
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    @Autowired
    private NotificacionService notificacionService;
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
    
    // Cache para almacenar el stock inicial de cada día por empresa
    // Formato: "empresaId_fecha" -> StockInicialDTO
    private static final Map<String, MovimientoDiaDTO.StockInicialDTO> stockInicialCache = new HashMap<>();
    
    /**
     * Obtener movimientos del día para una fecha específica
     */
    @Transactional(readOnly = true)
    public MovimientoDiaDTO obtenerMovimientosDia(String fechaStr) {
        // DEBUG: Verificar registros antes de calcular movimientos
        try {
            System.out.println("🔍 [DEBUG] === VERIFICANDO REGISTROS EN BASE DE DATOS ===");
            Map<String, Object> debugInfo = debugRegistrosFecha(fechaStr);
            System.out.println("🔍 [DEBUG] === FIN VERIFICACIÓN ===");
        } catch (Exception e) {
            System.err.println("❌ [DEBUG] Error en verificación: " + e.getMessage());
        }
        Long empresaId = null;
        try {
            empresaId = obtenerEmpresaId();
            LocalDate fecha = LocalDate.parse(fechaStr, DATE_FORMATTER);
            LocalDate fechaActual = LocalDate.now();
            
            System.out.println("🔍 [MOVIMIENTOS] Obteniendo movimientos para empresa: " + empresaId + ", fecha: " + fecha);
            
            // Si es un día nuevo (después de medianoche), cerrar automáticamente el día anterior
            if (fecha.isAfter(fechaActual.minusDays(1))) {
                cerrarDiaAnteriorAutomaticamente(empresaId, fecha);
            }
            
            // Determinar si el día está cerrado automáticamente
            boolean diaCerrado = fecha.isBefore(fechaActual);
            
            // Buscar si ya existe un cierre para esta fecha
            Optional<CierreDia> cierreExistente = cierreDiaRepository.findByEmpresaIdAndFecha(empresaId, fecha);
            
            if (cierreExistente.isPresent()) {
                System.out.println("🔍 [MOVIMIENTOS] Cierre encontrado, cargando datos existentes");
                return cargarMovimientosDesdeCierre(cierreExistente.get());
            } else {
                System.out.println("🔍 [MOVIMIENTOS] No hay cierre, calculando movimientos en tiempo real");
                MovimientoDiaDTO movimientos = calcularMovimientosEnTiempoReal(empresaId, fecha);
                
                // Si es un día pasado, automáticamente se considera cerrado
                if (diaCerrado) {
                    movimientos.setDiaCerrado(true);
                    System.out.println("🔒 [MOVIMIENTOS] Día pasado detectado, marcando como cerrado automáticamente");
                }
                
                System.out.println("📊 [MOVIMIENTOS] Movimientos calculados:");
                System.out.println("  - Stock Inicial: " + movimientos.getStockInicial().getCantidadTotal() + " productos");
                System.out.println("  - Ingresos: " + movimientos.getIngresos().getCantidadTotal());
                System.out.println("  - Devoluciones: " + movimientos.getDevoluciones().getCantidadTotal());
                System.out.println("  - Salidas: " + movimientos.getSalidas().getCantidadTotal());
                System.out.println("  - Roturas: " + movimientos.getRoturas().getCantidadTotal());
                System.out.println("  - Balance Final: " + movimientos.getBalanceFinal().getCantidadTotal());
                
                return movimientos;
            }
            
        } catch (Exception e) {
            System.err.println("❌ [MOVIMIENTOS] Error al obtener movimientos: " + e.getMessage());
            System.err.println("❌ [MOVIMIENTOS] Stack trace completo:");
            e.printStackTrace();
            System.err.println("❌ [MOVIMIENTOS] Empresa ID: " + empresaId);
            System.err.println("❌ [MOVIMIENTOS] Fecha recibida: " + fechaStr);
            throw new RuntimeException("Error al obtener movimientos del día: " + e.getMessage(), e);
        }
    }
    
    /**
     * Cerrar automáticamente el día anterior si no está cerrado
     * Esto se ejecuta cuando se consulta un día nuevo para asegurar que el stock inicial sea correcto
     */
    @Transactional
    public void cerrarDiaAnteriorAutomaticamente(Long empresaId, LocalDate fechaActual) {
        LocalDate diaAnterior = fechaActual.minusDays(1);
        
        try {
            // Verificar si el día anterior no está cerrado
            Optional<CierreDia> cierreAnterior = cierreDiaRepository.findByEmpresaIdAndFecha(empresaId, diaAnterior);
            
            if (cierreAnterior.isEmpty() || !cierreAnterior.get().getCerrado()) {
                System.out.println("🔄 [AUTO-CIERRE] Día anterior no cerrado, cerrando automáticamente: " + diaAnterior);
                
                // Calcular movimientos del día anterior
                MovimientoDiaDTO movimientos = calcularMovimientosEnTiempoReal(empresaId, diaAnterior);
                
                // Crear el cierre automático
                CierreDia cierre = new CierreDia(empresaId, diaAnterior);
                cierre.setCerrado(true);
                cierre.setCierreAutomatico(true);
                cierre.setFechaCreacion(LocalDateTime.now());
                cierre.setFechaActualizacion(LocalDateTime.now());
                
                // Guardar el cierre
                cierre = cierreDiaRepository.save(cierre);
                
                // Guardar los detalles del cierre
                guardarDetallesCierre(cierre, movimientos);
                
                // Limpiar cache del stock inicial para que se recalcule
                limpiarCacheStockInicial();
                
                System.out.println("✅ [AUTO-CIERRE] Día anterior cerrado automáticamente: " + diaAnterior);
                
            } else {
                System.out.println("ℹ️ [AUTO-CIERRE] Día anterior ya está cerrado: " + diaAnterior);
            }
            
        } catch (Exception e) {
            System.err.println("❌ [AUTO-CIERRE] Error al cerrar día anterior: " + e.getMessage());
            e.printStackTrace();
            // No lanzar excepción para no interrumpir el flujo normal
        }
    }

    
    /**
     * Calcular movimientos en tiempo real sin guardar
     */
    private MovimientoDiaDTO calcularMovimientosEnTiempoReal(Long empresaId, LocalDate fecha) {
        // Obtener stock inicial (balance final del día anterior)
        MovimientoDiaDTO.StockInicialDTO stockInicial = obtenerStockInicial(empresaId, fecha);
        
        // Obtener ingresos del día
        MovimientoDiaDTO.MovimientosDTO ingresos = obtenerIngresos(empresaId, fecha);
        
        // Obtener devoluciones del día
        MovimientoDiaDTO.MovimientosDTO devoluciones = obtenerDevoluciones(empresaId, fecha);
        
        // Obtener salidas del día
        MovimientoDiaDTO.MovimientosDTO salidas = obtenerSalidas(empresaId, fecha);
        
        // Obtener roturas del día
        MovimientoDiaDTO.MovimientosDTO roturas = obtenerRoturas(empresaId, fecha);
        
        // Calcular balance final
        MovimientoDiaDTO.StockInicialDTO balanceFinal = calcularBalanceFinal(empresaId, stockInicial, ingresos, devoluciones, salidas, roturas);
        
        return new MovimientoDiaDTO(
            fecha.format(DATE_FORMATTER),
            stockInicial,
            ingresos,
            devoluciones,
            salidas,
            roturas,
            balanceFinal,
            false // Se determinará automáticamente en el método principal
        );
    }
    
    /**
     * Obtener stock inicial (stock real al inicio del día, sin incluir movimientos del día actual)
     * 
     * Lógica:
     * 1. Si hay un cierre del día anterior: usar el balance final del día anterior
     * 2. Si no hay cierre del día anterior: calcular el stock actual menos los movimientos del día actual
     * 3. Para días futuros: usar el stock actual
     */
    private MovimientoDiaDTO.StockInicialDTO obtenerStockInicial(Long empresaId, LocalDate fecha) {
        // Verificar si ya tenemos el stock inicial en cache para este día
        String cacheKey = empresaId + "_" + fecha.format(DATE_FORMATTER);
        
        if (stockInicialCache.containsKey(cacheKey)) {
            System.out.println("📊 [STOCK INICIAL] Usando stock inicial desde cache para: " + fecha);
            return stockInicialCache.get(cacheKey);
        }
        
        LocalDate diaAnterior = fecha.minusDays(1);
        LocalDate fechaActual = LocalDate.now();
        Optional<CierreDia> cierreAnterior = cierreDiaRepository.findByEmpresaIdAndFecha(empresaId, diaAnterior);
        
        System.out.println("🔍 [STOCK INICIAL] Calculando para fecha: " + fecha + ", Día anterior: " + diaAnterior);
        
        if (cierreAnterior.isPresent() && cierreAnterior.get().getCerrado()) {
            // CASO 1: Hay cierre del día anterior - usar balance final del día anterior
            System.out.println("📊 [STOCK INICIAL] Usando balance final del día anterior");
            
            List<DetalleCierreDia> detallesBalance = detalleCierreDiaRepository
                .findByCierreDiaIdAndTipoMovimientoOrderByFechaCreacionAsc(
                    cierreAnterior.get().getId(), 
                    DetalleCierreDia.TipoMovimiento.BALANCE_FINAL
                );
            
            List<MovimientoDiaDTO.ProductoStockDTO> productos = detallesBalance.stream()
                .map(detalle -> {
                    MovimientoDiaDTO.ProductoStockDTO producto = new MovimientoDiaDTO.ProductoStockDTO();
                    producto.setId(detalle.getProductoId());
                    producto.setNombre(detalle.getNombreProducto());
                    producto.setCodigoPersonalizado(detalle.getCodigoPersonalizado());
                    Integer cantidad = detalle.getCantidad();
                    producto.setCantidad(cantidad);
                    producto.setCantidadInicial(cantidad);
                    producto.setPrecio(null); // Precio no disponible en balance
                    return producto;
                })
                .collect(Collectors.toList());
            
            int cantidadTotal = productos.stream().mapToInt(p -> p.getCantidadInicial() != null ? p.getCantidadInicial() : 0).sum();
            
            System.out.println("📊 [STOCK INICIAL] Balance final del día anterior - Total: " + cantidadTotal);
            
            MovimientoDiaDTO.StockInicialDTO stockInicial = new MovimientoDiaDTO.StockInicialDTO(cantidadTotal, productos);
            
            // Guardar en cache para futuras consultas del mismo día
            stockInicialCache.put(cacheKey, stockInicial);
            System.out.println("💾 [STOCK INICIAL] Stock inicial guardado en cache para: " + fecha);
            
            return stockInicial;
            
        } else if (fecha.isBefore(fechaActual) || fecha.isEqual(fechaActual)) {
            // CASO 2: No hay cierre del día anterior y es día pasado o actual
            // CORRECCIÓN: Usar directamente el stock actual como stock inicial para evitar desfases
            System.out.println("📊 [STOCK INICIAL] No hay cierre del día anterior - usando stock actual como stock inicial");
            
            // Obtener stock actual
            List<Producto> productosActuales;
            try {
                productosActuales = productoRepository.findByEmpresaId(empresaId);
                System.out.println("🔍 [STOCK INICIAL] Productos encontrados en la empresa: " + productosActuales.size());
                if (productosActuales.isEmpty()) {
                    System.out.println("⚠️ [STOCK INICIAL] NO HAY PRODUCTOS EN LA EMPRESA - Esto causará que no se muestren las cards");
                }
            } catch (Exception e) {
                System.err.println("❌ [STOCK INICIAL] Error al consultar productos: " + e.getMessage());
                e.printStackTrace();
                throw new RuntimeException("Error al consultar productos de la empresa", e);
            }
            
            // CORRECCIÓN: Usar directamente el stock actual como stock inicial
            // No hacer cálculos complejos que causen desfases
            System.out.println("📊 [STOCK INICIAL] Usando stock actual directamente como stock inicial");
            
            // Crear DTOs usando directamente el stock actual
            List<MovimientoDiaDTO.ProductoStockDTO> productosDTO = productosActuales.stream()
                .map(producto -> {
                    MovimientoDiaDTO.ProductoStockDTO productoDTO = new MovimientoDiaDTO.ProductoStockDTO();
                    productoDTO.setId(producto.getId());
                    productoDTO.setNombre(producto.getNombre());
                    productoDTO.setCodigoPersonalizado(producto.getCodigoPersonalizado());
                    Integer stockActual = producto.getStock();
                    productoDTO.setCantidad(stockActual != null ? stockActual : 0);
                    productoDTO.setCantidadInicial(stockActual != null ? stockActual : 0);
                    productoDTO.setPrecio(producto.getPrecio() != null ? producto.getPrecio().doubleValue() : null);
                    return productoDTO;
                })
                .filter(producto -> producto.getCantidadInicial() != null && producto.getCantidadInicial() >= 0) // Incluir productos con stock 0
                .collect(Collectors.toList());
            
            int cantidadTotal = productosDTO.stream().mapToInt(p -> p.getCantidadInicial() != null ? p.getCantidadInicial() : 0).sum();
            
            System.out.println("📊 [STOCK INICIAL] Stock actual usado como stock inicial - Total: " + cantidadTotal);
            System.out.println("📊 [STOCK INICIAL] Productos incluidos: " + productosDTO.size());
            for (MovimientoDiaDTO.ProductoStockDTO producto : productosDTO) {
                System.out.println("  - " + producto.getCodigoPersonalizado() + " | " + producto.getNombre() + " | Stock: " + producto.getCantidadInicial());
            }
            System.out.println("🔒 [STOCK INICIAL] IMPORTANTE: Este stock inicial evita desfases al usar stock actual directamente");
            
            MovimientoDiaDTO.StockInicialDTO stockInicialCalculado = new MovimientoDiaDTO.StockInicialDTO(cantidadTotal, productosDTO);
            
            // Guardar en cache para futuras consultas del mismo día
            stockInicialCache.put(cacheKey, stockInicialCalculado);
            System.out.println("💾 [STOCK INICIAL] Stock inicial guardado en cache para: " + fecha);
            
            return stockInicialCalculado;
            
        } else {
            // CASO 3: Día futuro - usar stock actual
            System.out.println("📊 [STOCK INICIAL] Día futuro - usando stock actual");
            
            List<Producto> productos = productoRepository.findByEmpresaId(empresaId);
            List<MovimientoDiaDTO.ProductoStockDTO> productosDTO = productos.stream()
                .map(producto -> {
                    MovimientoDiaDTO.ProductoStockDTO productoDTO = new MovimientoDiaDTO.ProductoStockDTO();
                    productoDTO.setId(producto.getId());
                    productoDTO.setNombre(producto.getNombre());
                    productoDTO.setCodigoPersonalizado(producto.getCodigoPersonalizado());
                    productoDTO.setCantidad(producto.getStock());
                    productoDTO.setCantidadInicial(producto.getStock());
                    productoDTO.setPrecio(producto.getPrecio() != null ? producto.getPrecio().doubleValue() : null);
                    return productoDTO;
                })
                .filter(producto -> producto.getCantidadInicial() != null && producto.getCantidadInicial() >= 0) // Incluir productos con stock 0
                .collect(Collectors.toList());
            
            int cantidadTotal = productosDTO.stream().mapToInt(p -> p.getCantidadInicial() != null ? p.getCantidadInicial() : 0).sum();
            
            System.out.println("📊 [STOCK INICIAL] Stock actual para día futuro - Total: " + cantidadTotal);
            System.out.println("📊 [STOCK INICIAL] Productos incluidos: " + productosDTO.size());
            for (MovimientoDiaDTO.ProductoStockDTO producto : productosDTO) {
                System.out.println("  - " + producto.getCodigoPersonalizado() + " | " + producto.getNombre() + " | Stock: " + producto.getCantidadInicial());
            }
            
            MovimientoDiaDTO.StockInicialDTO stockInicial = new MovimientoDiaDTO.StockInicialDTO(cantidadTotal, productosDTO);
            
            // Guardar en cache para futuras consultas del mismo día
            stockInicialCache.put(cacheKey, stockInicial);
            System.out.println("💾 [STOCK INICIAL] Stock inicial guardado en cache para: " + fecha);
            
            return stockInicial;
        }
    }
    
    /**
     * Limpiar cache del stock inicial (útil para testing o reinicio del día)
     */
    public void limpiarCacheStockInicial() {
        stockInicialCache.clear();
        System.out.println("🗑️ [CACHE] Stock inicial cache limpiado");
    }
    
    /**
     * Limpiar cache del stock inicial para una fecha específica
     */
    public void limpiarCacheStockInicial(Long empresaId, LocalDate fecha) {
        String cacheKey = empresaId + "_" + fecha.format(DATE_FORMATTER);
        stockInicialCache.remove(cacheKey);
        System.out.println("🗑️ [CACHE] Stock inicial cache limpiado para: " + fecha);
    }
    
    /**
     * Cerrar o reabrir el día
     * Si el día está abierto: lo cierra y guarda el balance final
     * Si el día está cerrado: lo reabre eliminando el cierre
     */
    @Transactional
    public String cerrarDia(String fechaStr) {
        try {
            Long empresaId = obtenerEmpresaId();
            LocalDate fecha = LocalDate.parse(fechaStr, DATE_FORMATTER);
            
            System.out.println("🔒 [CIERRE DÍA] Procesando día para empresa: " + empresaId + ", fecha: " + fecha);
            
            // Verificar si ya existe un cierre para esta fecha
            Optional<CierreDia> cierreExistente = cierreDiaRepository.findByEmpresaIdAndFecha(empresaId, fecha);
            
            if (cierreExistente.isPresent() && cierreExistente.get().getCerrado()) {
                // DÍA CERRADO - REABRIR
                System.out.println("🔓 [REABRIR DÍA] Reabriendo día cerrado");
                
                // Eliminar detalles del cierre
                detalleCierreDiaRepository.deleteByCierreDiaId(cierreExistente.get().getId());
                
                // Eliminar el cierre
                cierreDiaRepository.delete(cierreExistente.get());
                
                // Limpiar cache del stock inicial
                limpiarCacheStockInicial();
                
                System.out.println("✅ [REABRIR DÍA] Día reabierto exitosamente para: " + fecha);
                return "Día reabierto exitosamente para " + fecha + ". Ahora puedes hacer más movimientos.";
                
            } else {
                // DÍA ABIERTO - CERRAR
                System.out.println("🔒 [CIERRE DÍA] Cerrando día abierto");
                
                // Si existe pero no está cerrado, eliminarlo para recrearlo
                if (cierreExistente.isPresent()) {
                    System.out.println("🔒 [CIERRE DÍA] Eliminando cierre existente no cerrado");
                    detalleCierreDiaRepository.deleteByCierreDiaId(cierreExistente.get().getId());
                    cierreDiaRepository.delete(cierreExistente.get());
                }
                
                // Calcular movimientos en tiempo real
                MovimientoDiaDTO movimientos = calcularMovimientosEnTiempoReal(empresaId, fecha);
                
                // Crear el cierre
                CierreDia cierre = new CierreDia(empresaId, fecha);
                cierre.setCerrado(true);
                cierre.setFechaCreacion(LocalDateTime.now());
                cierre.setFechaActualizacion(LocalDateTime.now());
                
                // Guardar el cierre
                cierre = cierreDiaRepository.save(cierre);
                System.out.println("🔒 [CIERRE DÍA] Cierre guardado con ID: " + cierre.getId());
                
                // Guardar los detalles del cierre
                guardarDetallesCierre(cierre, movimientos);
                
                // Limpiar cache del stock inicial para que se recalcule
                limpiarCacheStockInicial();
                
                System.out.println("✅ [CIERRE DÍA] Día cerrado exitosamente para: " + fecha);
                
                // Crear notificación de cierre de día
                try {
                    int totalProductos = movimientos.getStockInicial().getProductos().size();
                    double valorTotal = movimientos.getStockInicial().getProductos().stream()
                        .mapToDouble(p -> p.getPrecio() * p.getCantidad())
                        .sum();
                    
                    notificacionService.crearNotificacionCierreDia(
                        empresaId,
                        fecha.format(DATE_FORMATTER),
                        totalProductos,
                        valorTotal
                    );
                    System.out.println("🔒 Notificación de cierre de día creada para: " + fecha);
                } catch (Exception e) {
                    System.err.println("Error al crear notificación de cierre de día: " + e.getMessage());
                }
                
                return "Día cerrado exitosamente para " + fecha + ". Balance final guardado.";
            }
            
        } catch (Exception e) {
            System.err.println("❌ [CIERRE DÍA] Error al procesar el día: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error al procesar el día: " + e.getMessage(), e);
        }
    }

    /**
     * Debug: Obtener información detallada del stock para una fecha específica
     */
    public Map<String, Object> debugStock(String fechaStr) {
        try {
            Long empresaId = obtenerEmpresaId();
            LocalDate fecha = LocalDate.parse(fechaStr, DATE_FORMATTER);
            
            Map<String, Object> debug = new HashMap<>();
            
            // 1. Stock actual de productos
            List<Producto> productosActuales = productoRepository.findByEmpresaId(empresaId);
            Map<Long, Integer> stockActual = productosActuales.stream()
                .collect(Collectors.toMap(Producto::getId, Producto::getStock));
            
            debug.put("stockActual", stockActual);
            debug.put("totalStockActual", stockActual.values().stream().mapToInt(Integer::intValue).sum());
            
            // 2. Movimientos del día
            MovimientoDiaDTO.MovimientosDTO ingresos = obtenerIngresos(empresaId, fecha);
            MovimientoDiaDTO.MovimientosDTO devoluciones = obtenerDevoluciones(empresaId, fecha);
            MovimientoDiaDTO.MovimientosDTO salidas = obtenerSalidas(empresaId, fecha);
            MovimientoDiaDTO.MovimientosDTO roturas = obtenerRoturas(empresaId, fecha);
            
            debug.put("ingresos", ingresos.getProductos().stream().collect(Collectors.toMap(
                p -> p.getId(), p -> p.getCantidad()
            )));
            debug.put("totalIngresos", ingresos.getCantidadTotal());
            
            debug.put("devoluciones", devoluciones.getProductos().stream().collect(Collectors.toMap(
                p -> p.getId(), p -> p.getCantidad()
            )));
            debug.put("totalDevoluciones", devoluciones.getCantidadTotal());
            
            debug.put("salidas", salidas.getProductos().stream().collect(Collectors.toMap(
                p -> p.getId(), p -> p.getCantidad()
            )));
            debug.put("totalSalidas", salidas.getCantidadTotal());
            
            debug.put("roturas", roturas.getProductos().stream().collect(Collectors.toMap(
                p -> p.getId(), p -> p.getCantidad()
            )));
            debug.put("totalRoturas", roturas.getCantidadTotal());
            
            // 3. Cálculo del stock inicial
            Map<Long, Integer> stockInicial = new HashMap<>(stockActual);
            
            // Restar ingresos
            for (MovimientoDiaDTO.ProductoMovimientoDTO ingreso : ingresos.getProductos()) {
                stockInicial.merge(ingreso.getId(), -ingreso.getCantidad(), Integer::sum);
            }
            
            // Restar devoluciones
            for (MovimientoDiaDTO.ProductoMovimientoDTO devolucion : devoluciones.getProductos()) {
                stockInicial.merge(devolucion.getId(), -devolucion.getCantidad(), Integer::sum);
            }
            
            // Sumar salidas
            for (MovimientoDiaDTO.ProductoMovimientoDTO salida : salidas.getProductos()) {
                stockInicial.merge(salida.getId(), salida.getCantidad(), Integer::sum);
            }
            
            // Sumar roturas
            for (MovimientoDiaDTO.ProductoMovimientoDTO rotura : roturas.getProductos()) {
                stockInicial.merge(rotura.getId(), rotura.getCantidad(), Integer::sum);
            }
            
            debug.put("stockInicial", stockInicial);
            debug.put("totalStockInicial", stockInicial.values().stream().mapToInt(Integer::intValue).sum());
            
            // 4. Cálculo del balance final
            Map<Long, Integer> balanceFinal = new HashMap<>(stockInicial);
            
            // Sumar ingresos
            for (MovimientoDiaDTO.ProductoMovimientoDTO ingreso : ingresos.getProductos()) {
                balanceFinal.merge(ingreso.getId(), ingreso.getCantidad(), Integer::sum);
            }
            
            // Sumar devoluciones
            for (MovimientoDiaDTO.ProductoMovimientoDTO devolucion : devoluciones.getProductos()) {
                balanceFinal.merge(devolucion.getId(), devolucion.getCantidad(), Integer::sum);
            }
            
            // Restar salidas
            for (MovimientoDiaDTO.ProductoMovimientoDTO salida : salidas.getProductos()) {
                balanceFinal.merge(salida.getId(), -salida.getCantidad(), Integer::sum);
            }
            
            // Restar roturas
            for (MovimientoDiaDTO.ProductoMovimientoDTO rotura : roturas.getProductos()) {
                balanceFinal.merge(rotura.getId(), -rotura.getCantidad(), Integer::sum);
            }
            
            debug.put("balanceFinal", balanceFinal);
            debug.put("totalBalanceFinal", balanceFinal.values().stream().mapToInt(Integer::intValue).sum());
            
            return debug;
            
        } catch (Exception e) {
            System.err.println("❌ [DEBUG] Error al obtener información de debug: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error al obtener información de debug: " + e.getMessage(), e);
        }
    }

    /**
     * Ejecutar migración V36 para agregar columna estado a planillas_devoluciones
     * SOLO PARA USAR EN PRODUCCIÓN - Ejecutar una sola vez
     */
    public String ejecutarMigracionV36() {
        try {
            System.out.println("🔧 [MIGRACIÓN] Ejecutando migración V36...");
            
            // Verificar si la columna ya existe
            try {
                String checkQuery = "SELECT estado FROM planillas_devoluciones LIMIT 1";
                jdbcTemplate.queryForObject(checkQuery, String.class);
                System.out.println("⚠️ [MIGRACIÓN] La columna 'estado' ya existe en planillas_devoluciones");
                return "La columna 'estado' ya existe en la tabla planillas_devoluciones";
            } catch (Exception e) {
                System.out.println("🔧 [MIGRACIÓN] La columna 'estado' no existe, procediendo con la migración...");
            }
            
            // Ejecutar la migración V36
            System.out.println("🔧 [MIGRACIÓN] Agregando columna 'estado'...");
            jdbcTemplate.execute("ALTER TABLE planillas_devoluciones ADD COLUMN estado VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE_VERIFICACION'");
            
            System.out.println("🔧 [MIGRACIÓN] Agregando columna 'usuario_verificacion_id'...");
            jdbcTemplate.execute("ALTER TABLE planillas_devoluciones ADD COLUMN usuario_verificacion_id BIGINT");
            
            System.out.println("🔧 [MIGRACIÓN] Agregando columna 'fecha_verificacion'...");
            jdbcTemplate.execute("ALTER TABLE planillas_devoluciones ADD COLUMN fecha_verificacion TIMESTAMP");
            
            System.out.println("🔧 [MIGRACIÓN] Agregando foreign key...");
            try {
                jdbcTemplate.execute("ALTER TABLE planillas_devoluciones ADD CONSTRAINT fk_planilla_devolucion_usuario_verificacion FOREIGN KEY (usuario_verificacion_id) REFERENCES usuarios(id)");
            } catch (Exception e) {
                System.out.println("⚠️ [MIGRACIÓN] Foreign key ya existe o no se pudo crear: " + e.getMessage());
            }
            
            System.out.println("🔧 [MIGRACIÓN] Creando índice...");
            try {
                jdbcTemplate.execute("CREATE INDEX idx_planillas_devoluciones_estado ON planillas_devoluciones(estado)");
            } catch (Exception e) {
                System.out.println("⚠️ [MIGRACIÓN] Índice ya existe o no se pudo crear: " + e.getMessage());
            }
            
            System.out.println("✅ [MIGRACIÓN] Migración V36 completada exitosamente");
            return "Migración V36 completada: columnas estado, usuario_verificacion_id y fecha_verificacion agregadas a planillas_devoluciones";
            
        } catch (Exception e) {
            System.err.println("❌ [MIGRACIÓN] Error al ejecutar migración V36: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error al ejecutar migración V36: " + e.getMessage(), e);
        }
    }
    
    /**
     * Capturar automáticamente el stock inicial al inicio de cada día
     * Se ejecuta a las 00:00 todos los días
     */
    @Scheduled(cron = "0 0 0 * * *") // Ejecutar a las 00:00 todos los días
    public void capturarStockInicialAutomatico() {
        try {
            System.out.println("🕐 [AUTO-CAPTURE] Iniciando captura automática del stock inicial para el día: " + LocalDate.now());
            
            // Obtener todas las empresas activas
            // Nota: Necesitarías un método para obtener todas las empresas
            // Por ahora, capturamos para la empresa por defecto o todas las empresas
            
            LocalDate fechaHoy = LocalDate.now();
            
            // Capturar stock inicial para el día actual
            // Esto asegura que siempre tengamos el stock inicial disponible
            capturarStockInicialParaFecha(fechaHoy);
            
            System.out.println("✅ [AUTO-CAPTURE] Captura automática del stock inicial completada para: " + fechaHoy);
            
        } catch (Exception e) {
            System.err.println("❌ [AUTO-CAPTURE] Error en captura automática del stock inicial: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Capturar stock inicial para una fecha específica
     */
    public void capturarStockInicialParaFecha(LocalDate fecha) {
        try {
            // Obtener todas las empresas (necesitarías implementar este método)
            // Por ahora, usamos una empresa por defecto o todas las empresas
            List<Long> empresasIds = obtenerTodasLasEmpresasIds();
            
            for (Long empresaId : empresasIds) {
                String cacheKey = empresaId + "_" + fecha.format(DATE_FORMATTER);
                
                // Solo capturar si no existe ya
                if (!stockInicialCache.containsKey(cacheKey)) {
                    System.out.println("📊 [AUTO-CAPTURE] Capturando stock inicial para empresa: " + empresaId + ", fecha: " + fecha);
                    
                    // Calcular y guardar stock inicial
                    MovimientoDiaDTO.StockInicialDTO stockInicial = calcularStockInicialParaEmpresa(empresaId, fecha);
                    stockInicialCache.put(cacheKey, stockInicial);
                    
                    System.out.println("✅ [AUTO-CAPTURE] Stock inicial capturado para empresa: " + empresaId + ", fecha: " + fecha);
                } else {
                    System.out.println("ℹ️ [AUTO-CAPTURE] Stock inicial ya existe para empresa: " + empresaId + ", fecha: " + fecha);
                }
            }
            
        } catch (Exception e) {
            System.err.println("❌ [AUTO-CAPTURE] Error capturando stock inicial para fecha " + fecha + ": " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Obtener todas las empresas IDs (método auxiliar)
     */
    private List<Long> obtenerTodasLasEmpresasIds() {
        try {
            // Obtener todas las empresas activas
            // Necesitarías agregar el repositorio de empresas si no existe
            return List.of(1L); // Por ahora, empresa con ID 1
            // TODO: Implementar consulta real a la base de datos
            // return empresaRepository.findAll().stream().map(Empresa::getId).collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("❌ [AUTO-CAPTURE] Error obteniendo empresas: " + e.getMessage());
            return List.of(1L); // Fallback a empresa por defecto
        }
    }
    
    /**
     * Calcular stock inicial para una empresa específica
     */
    private MovimientoDiaDTO.StockInicialDTO calcularStockInicialParaEmpresa(Long empresaId, LocalDate fecha) {
        // Usar la lógica existente pero sin el contexto de usuario
        // Esto es una versión simplificada del método obtenerStockInicial
        
        LocalDate diaAnterior = fecha.minusDays(1);
        LocalDate fechaActual = LocalDate.now();
        Optional<CierreDia> cierreAnterior = cierreDiaRepository.findByEmpresaIdAndFecha(empresaId, diaAnterior);
        
        if (cierreAnterior.isPresent() && cierreAnterior.get().getCerrado()) {
            // CASO 1: Hay cierre del día anterior - usar balance final del día anterior
            List<DetalleCierreDia> detallesBalance = detalleCierreDiaRepository
                .findByCierreDiaIdAndTipoMovimientoOrderByFechaCreacionAsc(
                    cierreAnterior.get().getId(), 
                    DetalleCierreDia.TipoMovimiento.BALANCE_FINAL
                );
            
            List<MovimientoDiaDTO.ProductoStockDTO> productos = detallesBalance.stream()
                .map(detalle -> {
                    MovimientoDiaDTO.ProductoStockDTO producto = new MovimientoDiaDTO.ProductoStockDTO();
                    producto.setId(detalle.getProductoId());
                    producto.setNombre(detalle.getNombreProducto());
                    producto.setCodigoPersonalizado(detalle.getCodigoPersonalizado());
                    Integer cantidad = detalle.getCantidad();
                    producto.setCantidad(cantidad);
                    producto.setCantidadInicial(cantidad);
                    producto.setPrecio(null);
                    return producto;
                })
                .collect(Collectors.toList());
            
            int cantidadTotal = productos.stream().mapToInt(p -> p.getCantidadInicial() != null ? p.getCantidadInicial() : 0).sum();
            return new MovimientoDiaDTO.StockInicialDTO(cantidadTotal, productos);
            
        } else {
            // CASO 2: No hay cierre del día anterior - usar stock actual
            List<Producto> productosActuales = productoRepository.findByEmpresaId(empresaId);
            List<MovimientoDiaDTO.ProductoStockDTO> productosDTO = productosActuales.stream()
                .map(producto -> {
                    MovimientoDiaDTO.ProductoStockDTO productoDTO = new MovimientoDiaDTO.ProductoStockDTO();
                    productoDTO.setId(producto.getId());
                    productoDTO.setNombre(producto.getNombre());
                    productoDTO.setCodigoPersonalizado(producto.getCodigoPersonalizado());
                    productoDTO.setCantidadInicial(producto.getStock());
                    productoDTO.setPrecio(producto.getPrecio() != null ? producto.getPrecio().doubleValue() : null);
                    return productoDTO;
                })
                .collect(Collectors.toList());
            
            int cantidadTotal = productosDTO.stream().mapToInt(p -> p.getCantidadInicial() != null ? p.getCantidadInicial() : 0).sum();
            return new MovimientoDiaDTO.StockInicialDTO(cantidadTotal, productosDTO);
        }
    }
    
    /**
     * Obtener ingresos del día
     */
    private MovimientoDiaDTO.MovimientosDTO obtenerIngresos(Long empresaId, LocalDate fecha) {
        // Convertir LocalDate a LocalDateTime para buscar en el rango del día
        LocalDateTime fechaInicio = fecha.atStartOfDay();
        LocalDateTime fechaFin = fecha.atTime(23, 59, 59, 999999999);
        
        List<RemitoIngreso> remitos = remitoIngresoRepository.findByRangoFechasAndEmpresaId(fechaInicio, fechaFin, empresaId);
        
        // Mapa para agrupar productos por ID
        Map<Long, MovimientoDiaDTO.ProductoMovimientoDTO> productosAgrupados = new HashMap<>();
        
        for (RemitoIngreso remito : remitos) {
            List<DetalleRemitoIngreso> detalles = detalleRemitoIngresoRepository
                .findByRemitoIngresoIdOrderByFechaCreacionAsc(remito.getId());
            
            for (DetalleRemitoIngreso detalle : detalles) {
                if (detalle.getProducto() != null) {
                    Long productoId = detalle.getProducto().getId();
                    
                    if (productosAgrupados.containsKey(productoId)) {
                        // Sumar cantidad al producto existente
                        MovimientoDiaDTO.ProductoMovimientoDTO productoExistente = productosAgrupados.get(productoId);
                        productoExistente.setCantidad(productoExistente.getCantidad() + detalle.getCantidad());
                    } else {
                        // Crear nuevo producto
                        productosAgrupados.put(productoId, new MovimientoDiaDTO.ProductoMovimientoDTO(
                            detalle.getProducto().getId(),
                            detalle.getProducto().getNombre(),
                            detalle.getProducto().getCodigoPersonalizado(),
                            detalle.getCantidad(),
                            remito.getFechaRemito().format(DATETIME_FORMATTER),
                            null // Sin observaciones
                        ));
                    }
                }
            }
        }
        
        List<MovimientoDiaDTO.ProductoMovimientoDTO> productos = new ArrayList<>(productosAgrupados.values());
        int cantidadTotal = productos.stream().mapToInt(MovimientoDiaDTO.ProductoMovimientoDTO::getCantidad).sum();
        
        System.out.println("📊 [INGRESOS] Productos unificados: " + productos.size() + ", Total: " + cantidadTotal);
        for (MovimientoDiaDTO.ProductoMovimientoDTO producto : productos) {
            System.out.println("  - " + producto.getCodigoPersonalizado() + " | " + producto.getNombre() + " | " + producto.getCantidad());
        }
        
        return new MovimientoDiaDTO.MovimientosDTO(cantidadTotal, productos);
    }
    
    /**
     * Obtener devoluciones del día
     */
    private MovimientoDiaDTO.MovimientosDTO obtenerDevoluciones(Long empresaId, LocalDate fecha) {
        // Convertir LocalDate a LocalDateTime para buscar en el rango del día
        LocalDateTime fechaInicio = fecha.atStartOfDay();
        LocalDateTime fechaFin = fecha.atTime(23, 59, 59, 999999999);
        
        List<PlanillaDevolucion> planillas = planillaDevolucionRepository.findByEmpresaIdAndFechaPlanillaBetweenOrderByFechaCreacionDesc(empresaId, fechaInicio, fechaFin);
        
        // Mapa para agrupar productos por ID
        Map<Long, MovimientoDiaDTO.ProductoMovimientoDTO> productosAgrupados = new HashMap<>();
        
        for (PlanillaDevolucion planilla : planillas) {
            List<DetallePlanillaDevolucion> detalles = detallePlanillaDevolucionRepository
                .findByPlanillaDevolucionIdOrderByFechaCreacionAsc(planilla.getId());
            
            for (DetallePlanillaDevolucion detalle : detalles) {
                // Solo sumar productos en BUEN_ESTADO para los movimientos del día
                // Si no tiene estado definido (productos existentes), considerarlo como BUEN_ESTADO
                DetallePlanillaDevolucion.EstadoProducto estado = detalle.getEstadoProducto();
                if (estado == null || estado == DetallePlanillaDevolucion.EstadoProducto.BUEN_ESTADO) {
                    Long productoId = detalle.getProducto().getId();
                    
                    if (productosAgrupados.containsKey(productoId)) {
                        // Sumar cantidad al producto existente
                        MovimientoDiaDTO.ProductoMovimientoDTO productoExistente = productosAgrupados.get(productoId);
                        productoExistente.setCantidad(productoExistente.getCantidad() + detalle.getCantidad());
                    } else {
                        // Crear nuevo producto
                        productosAgrupados.put(productoId, new MovimientoDiaDTO.ProductoMovimientoDTO(
                            detalle.getProducto().getId(),
                            detalle.getProducto().getNombre(),
                            detalle.getProducto().getCodigoPersonalizado(),
                            detalle.getCantidad(),
                            detalle.getFechaCreacion().format(DATETIME_FORMATTER),
                            null // Sin observaciones
                        ));
                    }
                }
            }
        }
        
        List<MovimientoDiaDTO.ProductoMovimientoDTO> productos = new ArrayList<>(productosAgrupados.values());
        int cantidadTotal = productos.stream().mapToInt(MovimientoDiaDTO.ProductoMovimientoDTO::getCantidad).sum();
        
        System.out.println("📊 [DEVOLUCIONES] Productos unificados: " + productos.size() + ", Total: " + cantidadTotal);
        for (MovimientoDiaDTO.ProductoMovimientoDTO producto : productos) {
            System.out.println("  - " + producto.getCodigoPersonalizado() + " | " + producto.getNombre() + " | " + producto.getCantidad());
        }
        
        return new MovimientoDiaDTO.MovimientosDTO(cantidadTotal, productos);
    }
    
    /**
     * Obtener salidas del día
     */
    private MovimientoDiaDTO.MovimientosDTO obtenerSalidas(Long empresaId, LocalDate fecha) {
        // Convertir LocalDate a LocalDateTime para buscar en el rango del día
        LocalDateTime fechaInicio = fecha.atStartOfDay();
        LocalDateTime fechaFin = fecha.atTime(23, 59, 59, 999999999);
        
        List<PlanillaPedido> planillas = planillaPedidoRepository.findByEmpresaIdAndFechaPlanillaBetweenOrderByFechaCreacionDesc(empresaId, fechaInicio, fechaFin);
        
        // Mapa para agrupar productos por ID
        Map<Long, MovimientoDiaDTO.ProductoMovimientoDTO> productosAgrupados = new HashMap<>();
        
        for (PlanillaPedido planilla : planillas) {
            List<DetallePlanillaPedido> detalles = detallePlanillaPedidoRepository
                .findByPlanillaPedidoIdOrderByFechaCreacionAsc(planilla.getId());
            
            for (DetallePlanillaPedido detalle : detalles) {
                Long productoId = detalle.getProducto().getId();
                
                if (productosAgrupados.containsKey(productoId)) {
                    // Sumar cantidad al producto existente
                    MovimientoDiaDTO.ProductoMovimientoDTO productoExistente = productosAgrupados.get(productoId);
                    productoExistente.setCantidad(productoExistente.getCantidad() + detalle.getCantidad());
                } else {
                    // Crear nuevo producto
                    productosAgrupados.put(productoId, new MovimientoDiaDTO.ProductoMovimientoDTO(
                        detalle.getProducto().getId(),
                        detalle.getProducto().getNombre(),
                        detalle.getProducto().getCodigoPersonalizado(),
                        detalle.getCantidad(),
                        detalle.getFechaCreacion().format(DATETIME_FORMATTER),
                        null // Sin observaciones
                    ));
                }
            }
        }
        
        List<MovimientoDiaDTO.ProductoMovimientoDTO> productos = new ArrayList<>(productosAgrupados.values());
        int cantidadTotal = productos.stream().mapToInt(MovimientoDiaDTO.ProductoMovimientoDTO::getCantidad).sum();
        
        System.out.println("📊 [SALIDAS] Productos unificados: " + productos.size() + ", Total: " + cantidadTotal);
        for (MovimientoDiaDTO.ProductoMovimientoDTO producto : productos) {
            System.out.println("  - " + producto.getCodigoPersonalizado() + " | " + producto.getNombre() + " | " + producto.getCantidad());
        }
        
        return new MovimientoDiaDTO.MovimientosDTO(cantidadTotal, productos);
    }
    
    /**
     * Obtener roturas del día
     */
    private MovimientoDiaDTO.MovimientosDTO obtenerRoturas(Long empresaId, LocalDate fecha) {
        // Convertir LocalDate a LocalDateTime para buscar en el rango del día
        LocalDateTime fechaInicio = fecha.atStartOfDay();
        LocalDateTime fechaFin = fecha.atTime(23, 59, 59, 999999999);
        
        List<RoturaPerdida> roturas = roturaPerdidaRepository.findByEmpresaIdAndFechaBetweenOrderByFechaCreacionDesc(empresaId, fechaInicio, fechaFin);
        
        // Mapa para agrupar productos por ID
        Map<Long, MovimientoDiaDTO.ProductoMovimientoDTO> productosAgrupados = new HashMap<>();
        
        for (RoturaPerdida rotura : roturas) {
            Long productoId = rotura.getProducto().getId();
            
            if (productosAgrupados.containsKey(productoId)) {
                // Sumar cantidad al producto existente
                MovimientoDiaDTO.ProductoMovimientoDTO productoExistente = productosAgrupados.get(productoId);
                productoExistente.setCantidad(productoExistente.getCantidad() + rotura.getCantidad());
            } else {
                // Crear nuevo producto
                productosAgrupados.put(productoId, new MovimientoDiaDTO.ProductoMovimientoDTO(
                    rotura.getProducto().getId(),
                    rotura.getProducto().getNombre(),
                    rotura.getProducto().getCodigoPersonalizado(),
                    rotura.getCantidad(),
                    rotura.getFecha().format(DATETIME_FORMATTER),
                    null // Sin observaciones
                ));
            }
        }
        
        List<MovimientoDiaDTO.ProductoMovimientoDTO> productos = new ArrayList<>(productosAgrupados.values());
        int cantidadTotal = productos.stream().mapToInt(MovimientoDiaDTO.ProductoMovimientoDTO::getCantidad).sum();
        
        System.out.println("📊 [ROTURAS] Productos unificados: " + productos.size() + ", Total: " + cantidadTotal);
        for (MovimientoDiaDTO.ProductoMovimientoDTO producto : productos) {
            System.out.println("  - " + producto.getCodigoPersonalizado() + " | " + producto.getNombre() + " | " + producto.getCantidad());
        }
        
        return new MovimientoDiaDTO.MovimientosDTO(cantidadTotal, productos);
    }
    
    /**
     * Calcular balance final
     * 
     * CORRECCIÓN: Usar directamente el stock real actual del sistema
     * para evitar desfases en los cálculos complejos
     */
    private MovimientoDiaDTO.StockInicialDTO calcularBalanceFinal(
            Long empresaId,
            MovimientoDiaDTO.StockInicialDTO stockInicial,
            MovimientoDiaDTO.MovimientosDTO ingresos,
            MovimientoDiaDTO.MovimientosDTO devoluciones,
            MovimientoDiaDTO.MovimientosDTO salidas,
            MovimientoDiaDTO.MovimientosDTO roturas) {
        
        // CORRECCIÓN: Usar directamente el stock real actual del sistema
        // Esto garantiza que el balance final sea exactamente igual al stock real
        System.out.println("🔍 [CALCULAR BALANCE FINAL] Usando stock real actual del sistema para evitar desfases");
        
        // Obtener el stock real actual de la base de datos usando el empresaId
        if (empresaId == null) {
            System.out.println("⚠️ [CALCULAR BALANCE FINAL] No se proporcionó empresaId, usando stock inicial");
            return stockInicial;
        }
        
        // Obtener productos reales de la base de datos
        List<Producto> productosReales = productoRepository.findByEmpresaId(empresaId);
        System.out.println("🔍 [CALCULAR BALANCE FINAL] Productos reales encontrados: " + productosReales.size());
        
        // Crear balance final usando el stock real actual
        List<MovimientoDiaDTO.ProductoStockDTO> productosBalance = productosReales.stream()
            .map(producto -> {
                MovimientoDiaDTO.ProductoStockDTO productoDTO = new MovimientoDiaDTO.ProductoStockDTO();
                productoDTO.setId(producto.getId());
                productoDTO.setNombre(producto.getNombre());
                productoDTO.setCodigoPersonalizado(producto.getCodigoPersonalizado());
                
                // Usar el stock real actual como cantidad final
                Integer stockReal = producto.getStock();
                productoDTO.setCantidad(stockReal != null ? stockReal : 0);
                
                // Para cantidad inicial, usar el stock inicial si está disponible
                Integer cantidadInicial = 0;
                if (stockInicial != null && stockInicial.getProductos() != null) {
                    Optional<MovimientoDiaDTO.ProductoStockDTO> stockInicialProducto = stockInicial.getProductos().stream()
                        .filter(p -> p.getId().equals(producto.getId()))
                        .findFirst();
                    if (stockInicialProducto.isPresent()) {
                        cantidadInicial = stockInicialProducto.get().getCantidadInicial() != null ? 
                            stockInicialProducto.get().getCantidadInicial() : 0;
                    }
                }
                productoDTO.setCantidadInicial(cantidadInicial);
                
                // Calcular variación
                int variacion = (stockReal != null ? stockReal : 0) - cantidadInicial;
                productoDTO.setVariacion(variacion);
                
                // Determinar tipo de variación
                if (variacion > 0) {
                    productoDTO.setTipoVariacion("INCREMENTO");
                } else if (variacion < 0) {
                    productoDTO.setTipoVariacion("DECREMENTO");
                } else {
                    productoDTO.setTipoVariacion("SIN_CAMBIOS");
                }
                
                productoDTO.setPrecio(producto.getPrecio() != null ? producto.getPrecio().doubleValue() : null);
                
                return productoDTO;
            })
            .filter(producto -> producto.getCantidad() != null && producto.getCantidad() >= 0) // Incluir productos con stock 0
            .collect(Collectors.toList());
        
        int cantidadTotal = productosBalance.stream().mapToInt(p -> p.getCantidad() != null ? p.getCantidad() : 0).sum();
        
        System.out.println("📊 [BALANCE FINAL] Balance final = Stock real actual - Total: " + cantidadTotal);
        System.out.println("📊 [BALANCE FINAL] Productos incluidos: " + productosBalance.size());
        for (MovimientoDiaDTO.ProductoStockDTO producto : productosBalance) {
            System.out.println("  - " + producto.getCodigoPersonalizado() + " | " + producto.getNombre() + 
                             " | Inicial: " + producto.getCantidadInicial() + 
                             " | Final (Stock Real): " + producto.getCantidad() + 
                             " | Variación: " + producto.getVariacion() + 
                             " | Tipo: " + producto.getTipoVariacion());
        }
        
        return new MovimientoDiaDTO.StockInicialDTO(cantidadTotal, productosBalance);
    }
    
    /**
     * Cargar movimientos desde un cierre existente
     */
    private MovimientoDiaDTO cargarMovimientosDesdeCierre(CierreDia cierre) {
        List<DetalleCierreDia> detalles = detalleCierreDiaRepository.findByCierreDiaIdOrderByFechaCreacionAsc(cierre.getId());
        
        // Agrupar detalles por tipo
        Map<DetalleCierreDia.TipoMovimiento, List<DetalleCierreDia>> detallesPorTipo = detalles.stream()
            .collect(Collectors.groupingBy(DetalleCierreDia::getTipoMovimiento));
        
        // Construir DTOs
        MovimientoDiaDTO.StockInicialDTO stockInicial = construirStockInicial(detallesPorTipo.get(DetalleCierreDia.TipoMovimiento.STOCK_INICIAL));
        MovimientoDiaDTO.MovimientosDTO ingresos = construirMovimientos(detallesPorTipo.get(DetalleCierreDia.TipoMovimiento.INGRESO));
        MovimientoDiaDTO.MovimientosDTO devoluciones = construirMovimientos(detallesPorTipo.get(DetalleCierreDia.TipoMovimiento.DEVOLUCION));
        MovimientoDiaDTO.MovimientosDTO salidas = construirMovimientos(detallesPorTipo.get(DetalleCierreDia.TipoMovimiento.SALIDA));
        MovimientoDiaDTO.MovimientosDTO roturas = construirMovimientos(detallesPorTipo.get(DetalleCierreDia.TipoMovimiento.ROTURA));
        MovimientoDiaDTO.StockInicialDTO balanceFinal = construirBalanceFinalDesdeCierre(
            detallesPorTipo.get(DetalleCierreDia.TipoMovimiento.BALANCE_FINAL),
            detallesPorTipo.get(DetalleCierreDia.TipoMovimiento.STOCK_INICIAL)
        );
        
        return new MovimientoDiaDTO(
            cierre.getFecha().format(DATE_FORMATTER),
            stockInicial,
            ingresos,
            devoluciones,
            salidas,
            roturas,
            balanceFinal,
            cierre.getCerrado()
        );
    }
    
    /**
     * Construir StockInicialDTO desde detalles
     */
    private MovimientoDiaDTO.StockInicialDTO construirStockInicial(List<DetalleCierreDia> detalles) {
        if (detalles == null) {
            return new MovimientoDiaDTO.StockInicialDTO(0, new ArrayList<>());
        }
        
        List<MovimientoDiaDTO.ProductoStockDTO> productos = detalles.stream()
            .map(detalle -> new MovimientoDiaDTO.ProductoStockDTO(
                detalle.getProductoId(),
                detalle.getNombreProducto(),
                detalle.getCodigoPersonalizado(),
                detalle.getCantidad(),
                null,
                detalle.getCantidad(), // cantidadInicial (para balance final)
                0, // variacion (se calcula después si es necesario)
                "SIN_CAMBIOS" // tipoVariacion (se calcula después si es necesario)
            ))
            .collect(Collectors.toList());
        
        int cantidadTotal = productos.stream().mapToInt(MovimientoDiaDTO.ProductoStockDTO::getCantidad).sum();
        
        return new MovimientoDiaDTO.StockInicialDTO(cantidadTotal, productos);
    }
    
    /**
     * Construir Balance Final desde detalles de cierre con cálculo de variaciones
     */
    private MovimientoDiaDTO.StockInicialDTO construirBalanceFinalDesdeCierre(List<DetalleCierreDia> detallesBalance, List<DetalleCierreDia> detallesStockInicial) {
        System.out.println("🔍 [CONSTRUIR BALANCE FINAL] detallesBalance: " + (detallesBalance != null ? detallesBalance.size() : "null"));
        System.out.println("🔍 [CONSTRUIR BALANCE FINAL] detallesStockInicial: " + (detallesStockInicial != null ? detallesStockInicial.size() : "null"));
        
        if (detallesBalance == null) {
            System.out.println("⚠️ [CONSTRUIR BALANCE FINAL] detallesBalance es null, retornando lista vacía");
            return new MovimientoDiaDTO.StockInicialDTO(0, new ArrayList<>());
        }
        
        if (detallesBalance.isEmpty()) {
            System.out.println("⚠️ [CONSTRUIR BALANCE FINAL] detallesBalance está vacío, retornando lista vacía");
            return new MovimientoDiaDTO.StockInicialDTO(0, new ArrayList<>());
        }
        
        // Crear mapa de stock inicial para calcular variaciones
        Map<Long, Integer> stockInicialPorProducto = new HashMap<>();
        if (detallesStockInicial != null) {
            for (DetalleCierreDia detalle : detallesStockInicial) {
                stockInicialPorProducto.put(detalle.getProductoId(), detalle.getCantidad());
            }
        }
        
        List<MovimientoDiaDTO.ProductoStockDTO> productos = detallesBalance.stream()
            .map(detalle -> {
                int cantidadInicial = stockInicialPorProducto.getOrDefault(detalle.getProductoId(), 0);
                int variacion = detalle.getCantidad() - cantidadInicial;
                String tipoVariacion;
                
                if (variacion > 0) {
                    tipoVariacion = "INCREMENTO";
                } else if (variacion < 0) {
                    tipoVariacion = "DECREMENTO";
                } else {
                    tipoVariacion = "SIN_CAMBIOS";
                }
                
                return new MovimientoDiaDTO.ProductoStockDTO(
                    detalle.getProductoId(),
                    detalle.getNombreProducto(),
                    detalle.getCodigoPersonalizado(),
                    detalle.getCantidad(),
                    null,
                    cantidadInicial,
                    variacion,
                    tipoVariacion
                );
            })
            .collect(Collectors.toList());
        
        int cantidadTotal = productos.stream().mapToInt(MovimientoDiaDTO.ProductoStockDTO::getCantidad).sum();
        
        // Log para debug
        System.out.println("📊 [BALANCE FINAL DESDE CIERRE] Productos con cambios:");
        for (MovimientoDiaDTO.ProductoStockDTO producto : productos) {
            if (!"SIN_CAMBIOS".equals(producto.getTipoVariacion())) {
                System.out.println("  - " + producto.getCodigoPersonalizado() + " | " + producto.getNombre() + 
                                 " | Inicial: " + producto.getCantidadInicial() + 
                                 " | Final: " + producto.getCantidad() + 
                                 " | Variación: " + producto.getVariacion() + 
                                 " | Tipo: " + producto.getTipoVariacion());
            }
        }
        
        return new MovimientoDiaDTO.StockInicialDTO(cantidadTotal, productos);
    }
    
    /**
     * Construir MovimientosDTO desde detalles
     */
    private MovimientoDiaDTO.MovimientosDTO construirMovimientos(List<DetalleCierreDia> detalles) {
        if (detalles == null) {
            return new MovimientoDiaDTO.MovimientosDTO(0, new ArrayList<>());
        }
        
        List<MovimientoDiaDTO.ProductoMovimientoDTO> productos = detalles.stream()
            .map(detalle -> new MovimientoDiaDTO.ProductoMovimientoDTO(
                detalle.getProductoId(),
                detalle.getNombreProducto(),
                detalle.getCodigoPersonalizado(),
                detalle.getCantidad(),
                detalle.getFechaMovimiento() != null ? detalle.getFechaMovimiento().format(DATETIME_FORMATTER) : null,
                null // Sin observaciones
            ))
            .collect(Collectors.toList());
        
        int cantidadTotal = productos.stream().mapToInt(MovimientoDiaDTO.ProductoMovimientoDTO::getCantidad).sum();
        
        return new MovimientoDiaDTO.MovimientosDTO(cantidadTotal, productos);
    }
    
    /**
     * Guardar detalles del cierre
     */
    private void guardarDetallesCierre(CierreDia cierre, MovimientoDiaDTO movimientos) {
        List<DetalleCierreDia> detalles = new ArrayList<>();
        
        // Stock inicial
        for (MovimientoDiaDTO.ProductoStockDTO producto : movimientos.getStockInicial().getProductos()) {
            detalles.add(new DetalleCierreDia(cierre, producto.getId(), producto.getNombre(),
                producto.getCodigoPersonalizado(), DetalleCierreDia.TipoMovimiento.STOCK_INICIAL,
                producto.getCantidad(), null));
        }
        
        // Ingresos
        for (MovimientoDiaDTO.ProductoMovimientoDTO producto : movimientos.getIngresos().getProductos()) {
            detalles.add(new DetalleCierreDia(cierre, producto.getId(), producto.getNombre(),
                producto.getCodigoPersonalizado(), DetalleCierreDia.TipoMovimiento.INGRESO,
                producto.getCantidad(), null));
        }
        
        // Devoluciones
        for (MovimientoDiaDTO.ProductoMovimientoDTO producto : movimientos.getDevoluciones().getProductos()) {
            detalles.add(new DetalleCierreDia(cierre, producto.getId(), producto.getNombre(),
                producto.getCodigoPersonalizado(), DetalleCierreDia.TipoMovimiento.DEVOLUCION,
                producto.getCantidad(), null));
        }
        
        // Salidas
        for (MovimientoDiaDTO.ProductoMovimientoDTO producto : movimientos.getSalidas().getProductos()) {
            detalles.add(new DetalleCierreDia(cierre, producto.getId(), producto.getNombre(),
                producto.getCodigoPersonalizado(), DetalleCierreDia.TipoMovimiento.SALIDA,
                producto.getCantidad(), null));
        }
        
        // Roturas
        for (MovimientoDiaDTO.ProductoMovimientoDTO producto : movimientos.getRoturas().getProductos()) {
            detalles.add(new DetalleCierreDia(cierre, producto.getId(), producto.getNombre(),
                producto.getCodigoPersonalizado(), DetalleCierreDia.TipoMovimiento.ROTURA,
                producto.getCantidad(), null));
        }
        
        // Balance final
        for (MovimientoDiaDTO.ProductoStockDTO producto : movimientos.getBalanceFinal().getProductos()) {
            detalles.add(new DetalleCierreDia(cierre, producto.getId(), producto.getNombre(),
                producto.getCodigoPersonalizado(), DetalleCierreDia.TipoMovimiento.BALANCE_FINAL,
                producto.getCantidad(), null));
        }
        
        detalleCierreDiaRepository.saveAll(detalles);
    }
    
    /**
     * DEBUG: Verificar registros en base de datos para una fecha específica
     * MÉTODO PÚBLICO - No requiere autenticación
     */
    @Transactional(readOnly = true)
    public Map<String, Object> debugRegistrosFecha(String fechaStr) {
        try {
            // Para debug, usar empresaId fijo (cambiar por el ID de tu empresa)
            Long empresaId = 1L; // CAMBIAR POR EL ID DE TU EMPRESA
            LocalDate fecha = LocalDate.parse(fechaStr, DATE_FORMATTER);
            LocalDateTime fechaInicio = fecha.atStartOfDay();
            LocalDateTime fechaFin = fecha.atTime(23, 59, 59, 999999999);
            
            System.out.println("🔍 [DEBUG] Verificando registros para empresa: " + empresaId + ", fecha: " + fecha);
            
            // Contar ingresos
            List<RemitoIngreso> ingresos = remitoIngresoRepository.findByRangoFechasAndEmpresaId(fechaInicio, fechaFin, empresaId);
            int totalIngresos = ingresos.stream()
                .mapToInt(ri -> ri.getDetalles() != null ? ri.getDetalles().size() : 0)
                .sum();
            
            // Contar roturas
            List<RoturaPerdida> roturas = roturaPerdidaRepository.findByEmpresaIdAndFechaBetweenOrderByFechaCreacionDesc(empresaId, fechaInicio, fechaFin);
            int totalRoturas = roturas.stream().mapToInt(RoturaPerdida::getCantidad).sum();
            
            // Contar devoluciones
            List<PlanillaDevolucion> devoluciones = planillaDevolucionRepository.findByEmpresaIdAndFechaPlanillaBetweenOrderByFechaCreacionDesc(empresaId, fechaInicio, fechaFin);
            int totalDevoluciones = devoluciones.stream()
                .mapToInt(pd -> pd.getDetalles() != null ? pd.getDetalles().size() : 0)
                .sum();
            
            // Contar salidas
            List<PlanillaPedido> salidas = planillaPedidoRepository.findByEmpresaIdAndFechaPlanillaBetweenOrderByFechaCreacionDesc(empresaId, fechaInicio, fechaFin);
            int totalSalidas = salidas.stream()
                .mapToInt(pp -> pp.getDetalles() != null ? pp.getDetalles().size() : 0)
                .sum();
            
            Map<String, Object> resultado = new HashMap<>();
            resultado.put("fecha", fechaStr);
            resultado.put("empresaId", empresaId);
            resultado.put("ingresos", Map.of(
                "remitos", ingresos.size(),
                "detalles", totalIngresos,
                "registros", ingresos.stream().map(ri -> Map.of(
                    "id", ri.getId(),
                    "numeroRemito", ri.getNumeroRemito(),
                    "fechaRemito", ri.getFechaRemito().toString(),
                    "detalles", ri.getDetalles() != null ? ri.getDetalles().size() : 0
                )).collect(Collectors.toList())
            ));
            resultado.put("roturas", Map.of(
                "registros", roturas.size(),
                "totalCantidad", totalRoturas,
                "registros", roturas.stream().map(rp -> Map.of(
                    "id", rp.getId(),
                    "producto", rp.getProducto() != null ? rp.getProducto().getNombre() : "N/A",
                    "cantidad", rp.getCantidad(),
                    "fecha", rp.getFecha().toString()
                )).collect(Collectors.toList())
            ));
            resultado.put("devoluciones", Map.of(
                "planillas", devoluciones.size(),
                "detalles", totalDevoluciones,
                "registros", devoluciones.stream().map(pd -> Map.of(
                    "id", pd.getId(),
                    "numeroPlanilla", pd.getNumeroPlanilla(),
                    "fechaPlanilla", pd.getFechaPlanilla().toString(),
                    "detalles", pd.getDetalles() != null ? pd.getDetalles().size() : 0
                )).collect(Collectors.toList())
            ));
            resultado.put("salidas", Map.of(
                "planillas", salidas.size(),
                "detalles", totalSalidas,
                "registros", salidas.stream().map(pp -> Map.of(
                    "id", pp.getId(),
                    "numeroPlanilla", pp.getNumeroPlanilla(),
                    "fechaPlanilla", pp.getFechaPlanilla().toString(),
                    "detalles", pp.getDetalles() != null ? pp.getDetalles().size() : 0
                )).collect(Collectors.toList())
            ));
            
            System.out.println("📊 [DEBUG] Resultados:");
            System.out.println("  - Ingresos: " + ingresos.size() + " remitos, " + totalIngresos + " detalles");
            System.out.println("  - Roturas: " + roturas.size() + " registros, " + totalRoturas + " cantidad total");
            System.out.println("  - Devoluciones: " + devoluciones.size() + " planillas, " + totalDevoluciones + " detalles");
            System.out.println("  - Salidas: " + salidas.size() + " planillas, " + totalSalidas + " detalles");
            
            return resultado;
            
        } catch (Exception e) {
            System.err.println("❌ [DEBUG] Error al verificar registros: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error al verificar registros: " + e.getMessage(), e);
        }
    }

    /**
     * Obtener movimientos acumulados por rango de fechas
     */
    @Transactional(readOnly = true)
    public MovimientoDiaDTO obtenerMovimientosRango(String fechaInicioStr, String fechaFinStr) {
        try {
            Long empresaId = obtenerEmpresaId();
            LocalDate fechaInicio = LocalDate.parse(fechaInicioStr, DATE_FORMATTER);
            LocalDate fechaFin = LocalDate.parse(fechaFinStr, DATE_FORMATTER);
            
            System.out.println("🔍 [MOVIMIENTOS RANGO] Obteniendo movimientos para empresa: " + empresaId + 
                             ", rango: " + fechaInicio + " a " + fechaFin);
            
            // Obtener stock inicial del primer día
            MovimientoDiaDTO stockInicial = obtenerMovimientosDia(fechaInicioStr);
            
            // Calcular movimientos acumulados durante el rango
            MovimientoDiaDTO.MovimientosDTO ingresosAcumulados = obtenerIngresosAcumulados(empresaId, fechaInicio, fechaFin);
            MovimientoDiaDTO.MovimientosDTO devolucionesAcumuladas = obtenerDevolucionesAcumuladas(empresaId, fechaInicio, fechaFin);
            MovimientoDiaDTO.MovimientosDTO salidasAcumuladas = obtenerSalidasAcumuladas(empresaId, fechaInicio, fechaFin);
            MovimientoDiaDTO.MovimientosDTO roturasAcumuladas = obtenerRoturasAcumuladas(empresaId, fechaInicio, fechaFin);
            
            // Calcular balance final
            MovimientoDiaDTO.StockInicialDTO balanceFinal = calcularBalanceFinalAcumulado(
                stockInicial.getStockInicial(), 
                ingresosAcumulados, 
                devolucionesAcumuladas, 
                salidasAcumuladas, 
                roturasAcumuladas
            );
            
            // Construir respuesta
            MovimientoDiaDTO resultado = new MovimientoDiaDTO();
            resultado.setFecha(fechaInicioStr + " a " + fechaFinStr);
            resultado.setStockInicial(stockInicial.getStockInicial());
            resultado.setIngresos(ingresosAcumulados);
            resultado.setDevoluciones(devolucionesAcumuladas);
            resultado.setSalidas(salidasAcumuladas);
            resultado.setRoturas(roturasAcumuladas);
            resultado.setBalanceFinal(balanceFinal);
            resultado.setDiaCerrado(true); // Los rangos siempre se consideran cerrados
            
            System.out.println("✅ [MOVIMIENTOS RANGO] Movimientos calculados exitosamente");
            return resultado;
            
        } catch (Exception e) {
            System.err.println("❌ [MOVIMIENTOS RANGO] Error al obtener movimientos por rango: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error al obtener movimientos por rango", e);
        }
    }

    /**
     * Obtener ingresos acumulados en un rango de fechas
     */
    private MovimientoDiaDTO.MovimientosDTO obtenerIngresosAcumulados(Long empresaId, LocalDate fechaInicio, LocalDate fechaFin) {
        LocalDateTime inicio = fechaInicio.atStartOfDay();
        LocalDateTime fin = fechaFin.atTime(23, 59, 59, 999999999);
        
        List<RemitoIngreso> remitos = remitoIngresoRepository.findByRangoFechasAndEmpresaId(inicio, fin, empresaId);
        
        Map<Long, MovimientoDiaDTO.ProductoMovimientoDTO> productosUnificados = new HashMap<>();
        
        for (RemitoIngreso remito : remitos) {
            for (DetalleRemitoIngreso detalle : remito.getDetalles()) {
                Long productoId = detalle.getProducto().getId();
                
                if (productosUnificados.containsKey(productoId)) {
                    MovimientoDiaDTO.ProductoMovimientoDTO existente = productosUnificados.get(productoId);
                    existente.setCantidad(existente.getCantidad() + detalle.getCantidad());
                } else {
                    productosUnificados.put(productoId, new MovimientoDiaDTO.ProductoMovimientoDTO(
                        productoId,
                        detalle.getProducto().getNombre(),
                        detalle.getProducto().getCodigoPersonalizado(),
                        detalle.getCantidad(),
                        remito.getFechaRemito().format(DATETIME_FORMATTER),
                        null
                    ));
                }
            }
        }
        
        List<MovimientoDiaDTO.ProductoMovimientoDTO> productos = new ArrayList<>(productosUnificados.values());
        int cantidadTotal = productos.stream().mapToInt(MovimientoDiaDTO.ProductoMovimientoDTO::getCantidad).sum();
        
        return new MovimientoDiaDTO.MovimientosDTO(cantidadTotal, productos);
    }

    /**
     * Obtener devoluciones acumuladas en un rango de fechas
     */
    private MovimientoDiaDTO.MovimientosDTO obtenerDevolucionesAcumuladas(Long empresaId, LocalDate fechaInicio, LocalDate fechaFin) {
        LocalDateTime inicio = fechaInicio.atStartOfDay();
        LocalDateTime fin = fechaFin.atTime(23, 59, 59, 999999999);
        
        List<PlanillaDevolucion> devoluciones = planillaDevolucionRepository.findByEmpresaIdAndFechaPlanillaBetweenOrderByFechaCreacionDesc(empresaId, inicio, fin);
        
        Map<Long, MovimientoDiaDTO.ProductoMovimientoDTO> productosUnificados = new HashMap<>();
        
        for (PlanillaDevolucion devolucion : devoluciones) {
            for (DetallePlanillaDevolucion detalle : devolucion.getDetalles()) {
                // Solo sumar productos en BUEN_ESTADO para los movimientos del día
                // Si no tiene estado definido (productos existentes), considerarlo como BUEN_ESTADO
                DetallePlanillaDevolucion.EstadoProducto estado = detalle.getEstadoProducto();
                if (estado == null || estado == DetallePlanillaDevolucion.EstadoProducto.BUEN_ESTADO) {
                    Long productoId = detalle.getProducto().getId();
                    
                    if (productosUnificados.containsKey(productoId)) {
                        MovimientoDiaDTO.ProductoMovimientoDTO existente = productosUnificados.get(productoId);
                        existente.setCantidad(existente.getCantidad() + detalle.getCantidad());
                    } else {
                        productosUnificados.put(productoId, new MovimientoDiaDTO.ProductoMovimientoDTO(
                            productoId,
                            detalle.getProducto().getNombre(),
                            detalle.getProducto().getCodigoPersonalizado(),
                            detalle.getCantidad(),
                            devolucion.getFechaPlanilla().format(DATETIME_FORMATTER),
                            null
                        ));
                    }
                }
            }
        }
        
        List<MovimientoDiaDTO.ProductoMovimientoDTO> productos = new ArrayList<>(productosUnificados.values());
        int cantidadTotal = productos.stream().mapToInt(MovimientoDiaDTO.ProductoMovimientoDTO::getCantidad).sum();
        
        return new MovimientoDiaDTO.MovimientosDTO(cantidadTotal, productos);
    }

    /**
     * Obtener salidas acumuladas en un rango de fechas
     */
    private MovimientoDiaDTO.MovimientosDTO obtenerSalidasAcumuladas(Long empresaId, LocalDate fechaInicio, LocalDate fechaFin) {
        LocalDateTime inicio = fechaInicio.atStartOfDay();
        LocalDateTime fin = fechaFin.atTime(23, 59, 59, 999999999);
        
        List<PlanillaPedido> pedidos = planillaPedidoRepository.findByEmpresaIdAndFechaPlanillaBetweenOrderByFechaCreacionDesc(empresaId, inicio, fin);
        
        Map<Long, MovimientoDiaDTO.ProductoMovimientoDTO> productosUnificados = new HashMap<>();
        
        for (PlanillaPedido pedido : pedidos) {
            for (DetallePlanillaPedido detalle : pedido.getDetalles()) {
                Long productoId = detalle.getProducto().getId();
                
                if (productosUnificados.containsKey(productoId)) {
                    MovimientoDiaDTO.ProductoMovimientoDTO existente = productosUnificados.get(productoId);
                    existente.setCantidad(existente.getCantidad() + detalle.getCantidad());
                } else {
                    productosUnificados.put(productoId, new MovimientoDiaDTO.ProductoMovimientoDTO(
                        productoId,
                        detalle.getProducto().getNombre(),
                        detalle.getProducto().getCodigoPersonalizado(),
                        detalle.getCantidad(),
                        pedido.getFechaPlanilla().format(DATETIME_FORMATTER),
                        null
                    ));
                }
            }
        }
        
        List<MovimientoDiaDTO.ProductoMovimientoDTO> productos = new ArrayList<>(productosUnificados.values());
        int cantidadTotal = productos.stream().mapToInt(MovimientoDiaDTO.ProductoMovimientoDTO::getCantidad).sum();
        
        return new MovimientoDiaDTO.MovimientosDTO(cantidadTotal, productos);
    }

    /**
     * Obtener roturas acumuladas en un rango de fechas
     */
    private MovimientoDiaDTO.MovimientosDTO obtenerRoturasAcumuladas(Long empresaId, LocalDate fechaInicio, LocalDate fechaFin) {
        LocalDateTime inicio = fechaInicio.atStartOfDay();
        LocalDateTime fin = fechaFin.atTime(23, 59, 59, 999999999);
        
        List<RoturaPerdida> roturas = roturaPerdidaRepository.findByEmpresaIdAndFechaBetweenOrderByFechaCreacionDesc(empresaId, inicio, fin);
        
        Map<Long, MovimientoDiaDTO.ProductoMovimientoDTO> productosUnificados = new HashMap<>();
        
        for (RoturaPerdida rotura : roturas) {
            Long productoId = rotura.getProducto().getId();
            
            if (productosUnificados.containsKey(productoId)) {
                MovimientoDiaDTO.ProductoMovimientoDTO existente = productosUnificados.get(productoId);
                existente.setCantidad(existente.getCantidad() + rotura.getCantidad());
            } else {
                productosUnificados.put(productoId, new MovimientoDiaDTO.ProductoMovimientoDTO(
                    productoId,
                    rotura.getProducto().getNombre(),
                    rotura.getProducto().getCodigoPersonalizado(),
                    rotura.getCantidad(),
                    rotura.getFecha().format(DATETIME_FORMATTER),
                    null
                ));
            }
        }
        
        List<MovimientoDiaDTO.ProductoMovimientoDTO> productos = new ArrayList<>(productosUnificados.values());
        int cantidadTotal = productos.stream().mapToInt(MovimientoDiaDTO.ProductoMovimientoDTO::getCantidad).sum();
        
        return new MovimientoDiaDTO.MovimientosDTO(cantidadTotal, productos);
    }

    /**
     * Calcular balance final acumulado
     */
    private MovimientoDiaDTO.StockInicialDTO calcularBalanceFinalAcumulado(
            MovimientoDiaDTO.StockInicialDTO stockInicial,
            MovimientoDiaDTO.MovimientosDTO ingresos,
            MovimientoDiaDTO.MovimientosDTO devoluciones,
            MovimientoDiaDTO.MovimientosDTO salidas,
            MovimientoDiaDTO.MovimientosDTO roturas) {
        
        Map<Long, MovimientoDiaDTO.ProductoStockDTO> balanceProductos = new HashMap<>();
        
        // Agregar stock inicial
        for (MovimientoDiaDTO.ProductoStockDTO producto : stockInicial.getProductos()) {
            balanceProductos.put(producto.getId(), new MovimientoDiaDTO.ProductoStockDTO(
                producto.getId(),
                producto.getNombre(),
                producto.getCodigoPersonalizado(),
                producto.getCantidadInicial() != null ? producto.getCantidadInicial() : 0,
                producto.getPrecio(),
                producto.getCantidadInicial() != null ? producto.getCantidadInicial() : 0, // cantidadInicial
                0, // variacion
                "SIN_CAMBIOS" // tipoVariacion
            ));
        }
        
        // Sumar ingresos
        for (MovimientoDiaDTO.ProductoMovimientoDTO producto : ingresos.getProductos()) {
            if (balanceProductos.containsKey(producto.getId())) {
                MovimientoDiaDTO.ProductoStockDTO existente = balanceProductos.get(producto.getId());
                Integer cantidadActual = existente.getCantidad() != null ? existente.getCantidad() : 0;
                existente.setCantidad(cantidadActual + producto.getCantidad());
            } else {
                balanceProductos.put(producto.getId(), new MovimientoDiaDTO.ProductoStockDTO(
                    producto.getId(),
                    producto.getNombre(),
                    producto.getCodigoPersonalizado(),
                    producto.getCantidad(),
                    null,
                    producto.getCantidad(),
                    0,
                    "SIN_CAMBIOS"
                ));
            }
        }
        
        // Sumar devoluciones
        for (MovimientoDiaDTO.ProductoMovimientoDTO producto : devoluciones.getProductos()) {
            if (balanceProductos.containsKey(producto.getId())) {
                MovimientoDiaDTO.ProductoStockDTO existente = balanceProductos.get(producto.getId());
                Integer cantidadActual = existente.getCantidad() != null ? existente.getCantidad() : 0;
                existente.setCantidad(cantidadActual + producto.getCantidad());
            } else {
                balanceProductos.put(producto.getId(), new MovimientoDiaDTO.ProductoStockDTO(
                    producto.getId(),
                    producto.getNombre(),
                    producto.getCodigoPersonalizado(),
                    producto.getCantidad(),
                    null,
                    producto.getCantidad(),
                    0,
                    "SIN_CAMBIOS"
                ));
            }
        }
        
        // Restar salidas
        for (MovimientoDiaDTO.ProductoMovimientoDTO producto : salidas.getProductos()) {
            if (balanceProductos.containsKey(producto.getId())) {
                MovimientoDiaDTO.ProductoStockDTO existente = balanceProductos.get(producto.getId());
                Integer cantidadActual = existente.getCantidad() != null ? existente.getCantidad() : 0;
                existente.setCantidad(cantidadActual - producto.getCantidad());
            }
        }
        
        // Restar roturas
        for (MovimientoDiaDTO.ProductoMovimientoDTO producto : roturas.getProductos()) {
            if (balanceProductos.containsKey(producto.getId())) {
                MovimientoDiaDTO.ProductoStockDTO existente = balanceProductos.get(producto.getId());
                Integer cantidadActual = existente.getCantidad() != null ? existente.getCantidad() : 0;
                existente.setCantidad(cantidadActual - producto.getCantidad());
            }
        }
        
        // Calcular variaciones
        for (MovimientoDiaDTO.ProductoStockDTO producto : balanceProductos.values()) {
            Integer cantidadInicial = producto.getCantidadInicial() != null ? producto.getCantidadInicial() : 0;
            Integer cantidadFinal = producto.getCantidad() != null ? producto.getCantidad() : 0;
            int variacion = cantidadFinal - cantidadInicial;
            
            producto.setVariacion(variacion);
            
            if (variacion > 0) {
                producto.setTipoVariacion("INCREMENTO");
            } else if (variacion < 0) {
                producto.setTipoVariacion("DECREMENTO");
            } else {
                producto.setTipoVariacion("SIN_CAMBIOS");
            }
        }
        
        List<MovimientoDiaDTO.ProductoStockDTO> productos = new ArrayList<>(balanceProductos.values());
        int cantidadTotal = productos.stream().mapToInt(p -> p.getCantidad() != null ? p.getCantidad() : 0).sum();
        
        return new MovimientoDiaDTO.StockInicialDTO(cantidadTotal, productos);
    }

    /**
     * Exportar movimientos del día a Excel
     */
    @Transactional(readOnly = true)
    public byte[] exportarMovimientosDiaExcel(String fechaStr) throws IOException {
        try {
            System.out.println("🔍 [EXPORTAR] Iniciando exportación a Excel para fecha: " + fechaStr);
            
            // Obtener los movimientos del día
            MovimientoDiaDTO movimientos = obtenerMovimientosDia(fechaStr);
            
            // Crear el workbook de Excel
            try (var workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
                var sheet = workbook.createSheet("Movimientos del Día");
                
                // Crear estilos
                var headerStyle = workbook.createCellStyle();
                var headerFont = workbook.createFont();
                headerFont.setBold(true);
                headerFont.setColor(org.apache.poi.ss.usermodel.IndexedColors.WHITE.getIndex());
                headerStyle.setFont(headerFont);
                headerStyle.setFillForegroundColor(org.apache.poi.ss.usermodel.IndexedColors.BLUE.getIndex());
                headerStyle.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);
                headerStyle.setAlignment(org.apache.poi.ss.usermodel.HorizontalAlignment.CENTER);
                headerStyle.setBorderTop(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                headerStyle.setBorderBottom(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                headerStyle.setBorderLeft(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                headerStyle.setBorderRight(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                
                var dataStyle = workbook.createCellStyle();
                dataStyle.setBorderTop(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                dataStyle.setBorderBottom(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                dataStyle.setBorderLeft(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                dataStyle.setBorderRight(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                
                var totalStyle = workbook.createCellStyle();
                var totalFont = workbook.createFont();
                totalFont.setBold(true);
                totalStyle.setFont(totalFont);
                totalStyle.setFillForegroundColor(org.apache.poi.ss.usermodel.IndexedColors.GREY_25_PERCENT.getIndex());
                totalStyle.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);
                totalStyle.setBorderTop(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                totalStyle.setBorderBottom(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                totalStyle.setBorderLeft(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                totalStyle.setBorderRight(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                
                // Crear título
                var titleRow = sheet.createRow(0);
                var titleCell = titleRow.createCell(0);
                titleCell.setCellValue("REPORTE DE MOVIMIENTOS DEL DÍA - " + fechaStr);
                titleCell.setCellStyle(headerStyle);
                sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 0, 7));
                
                // Crear encabezados
                var headerRow = sheet.createRow(2);
                String[] headers = {
                    "Producto", "Stock Inicial", "Ingresos", "Retornos", 
                    "Carga Planillas", "Roturas", "Balance Final", "Observaciones"
                };
                
                for (int i = 0; i < headers.length; i++) {
                    var cell = headerRow.createCell(i);
                    cell.setCellValue(headers[i]);
                    cell.setCellStyle(headerStyle);
                }
                
                // Obtener todos los productos únicos
                Set<Long> productosIds = new HashSet<>();
                Map<Long, String> productosNombres = new HashMap<>();
                Map<Long, String> productosCodigos = new HashMap<>();
                
                // Agregar productos del stock inicial
                for (var producto : movimientos.getStockInicial().getProductos()) {
                    productosIds.add(producto.getId());
                    productosNombres.put(producto.getId(), producto.getNombre());
                    productosCodigos.put(producto.getId(), producto.getCodigoPersonalizado());
                }
                
                // Agregar productos de ingresos
                for (var producto : movimientos.getIngresos().getProductos()) {
                    productosIds.add(producto.getId());
                    productosNombres.put(producto.getId(), producto.getNombre());
                    productosCodigos.put(producto.getId(), producto.getCodigoPersonalizado());
                }
                
                // Agregar productos de devoluciones
                for (var producto : movimientos.getDevoluciones().getProductos()) {
                    productosIds.add(producto.getId());
                    productosNombres.put(producto.getId(), producto.getNombre());
                    productosCodigos.put(producto.getId(), producto.getCodigoPersonalizado());
                }
                
                // Agregar productos de salidas
                for (var producto : movimientos.getSalidas().getProductos()) {
                    productosIds.add(producto.getId());
                    productosNombres.put(producto.getId(), producto.getNombre());
                    productosCodigos.put(producto.getId(), producto.getCodigoPersonalizado());
                }
                
                // Agregar productos de roturas
                for (var producto : movimientos.getRoturas().getProductos()) {
                    productosIds.add(producto.getId());
                    productosNombres.put(producto.getId(), producto.getNombre());
                    productosCodigos.put(producto.getId(), producto.getCodigoPersonalizado());
                }
                
                // Crear mapas para facilitar la búsqueda
                Map<Long, Integer> stockInicial = movimientos.getStockInicial().getProductos().stream()
                    .collect(Collectors.toMap(p -> p.getId(), p -> p.getCantidadInicial() != null ? p.getCantidadInicial() : 0));
                    
                Map<Long, Integer> ingresos = movimientos.getIngresos().getProductos().stream()
                    .collect(Collectors.toMap(p -> p.getId(), p -> p.getCantidad()));
                    
                Map<Long, Integer> devoluciones = movimientos.getDevoluciones().getProductos().stream()
                    .collect(Collectors.toMap(p -> p.getId(), p -> p.getCantidad()));
                    
                Map<Long, Integer> salidas = movimientos.getSalidas().getProductos().stream()
                    .collect(Collectors.toMap(p -> p.getId(), p -> p.getCantidad()));
                    
                Map<Long, Integer> roturas = movimientos.getRoturas().getProductos().stream()
                    .collect(Collectors.toMap(p -> p.getId(), p -> p.getCantidad()));
                
                // Llenar datos
                int rowNum = 3;
                int totalStockInicial = 0;
                int totalIngresos = 0;
                int totalDevoluciones = 0;
                int totalSalidas = 0;
                int totalRoturas = 0;
                int totalBalanceFinal = 0;
                
                for (Long productoId : productosIds) {
                    var row = sheet.createRow(rowNum++);
                    
                    // Producto
                    var cell0 = row.createCell(0);
                    String nombreProducto = productosNombres.get(productoId);
                    String codigoProducto = productosCodigos.get(productoId);
                    cell0.setCellValue(codigoProducto != null ? codigoProducto + " - " + nombreProducto : nombreProducto);
                    cell0.setCellStyle(dataStyle);
                    
                    // Stock Inicial
                    var cell1 = row.createCell(1);
                    int stockInicialCantidad = stockInicial.getOrDefault(productoId, 0);
                    cell1.setCellValue(stockInicialCantidad);
                    cell1.setCellStyle(dataStyle);
                    totalStockInicial += stockInicialCantidad;
                    
                    // Ingresos
                    var cell2 = row.createCell(2);
                    int ingresosCantidad = ingresos.getOrDefault(productoId, 0);
                    cell2.setCellValue(ingresosCantidad);
                    cell2.setCellStyle(dataStyle);
                    totalIngresos += ingresosCantidad;
                    
                    // Retornos
                    var cell3 = row.createCell(3);
                    int devolucionesCantidad = devoluciones.getOrDefault(productoId, 0);
                    cell3.setCellValue(devolucionesCantidad);
                    cell3.setCellStyle(dataStyle);
                    totalDevoluciones += devolucionesCantidad;
                    
                    // Carga Planillas
                    var cell4 = row.createCell(4);
                    int salidasCantidad = salidas.getOrDefault(productoId, 0);
                    cell4.setCellValue(salidasCantidad);
                    cell4.setCellStyle(dataStyle);
                    totalSalidas += salidasCantidad;
                    
                    // Roturas
                    var cell5 = row.createCell(5);
                    int roturasCantidad = roturas.getOrDefault(productoId, 0);
                    cell5.setCellValue(roturasCantidad);
                    cell5.setCellStyle(dataStyle);
                    totalRoturas += roturasCantidad;
                    
                    // Balance Final
                    var cell6 = row.createCell(6);
                    int balanceFinal = stockInicialCantidad + ingresosCantidad + devolucionesCantidad - salidasCantidad - roturasCantidad;
                    cell6.setCellValue(balanceFinal);
                    cell6.setCellStyle(dataStyle);
                    totalBalanceFinal += balanceFinal;
                    
                    // Observaciones
                    var cell7 = row.createCell(7);
                    cell7.setCellValue("");
                    cell7.setCellStyle(dataStyle);
                }
                
                // Fila de totales
                var totalRow = sheet.createRow(rowNum++);
                
                var totalCell0 = totalRow.createCell(0);
                totalCell0.setCellValue("TOTALES");
                totalCell0.setCellStyle(totalStyle);
                
                var totalCell1 = totalRow.createCell(1);
                totalCell1.setCellValue(totalStockInicial);
                totalCell1.setCellStyle(totalStyle);
                
                var totalCell2 = totalRow.createCell(2);
                totalCell2.setCellValue(totalIngresos);
                totalCell2.setCellStyle(totalStyle);
                
                var totalCell3 = totalRow.createCell(3);
                totalCell3.setCellValue(totalDevoluciones);
                totalCell3.setCellStyle(totalStyle);
                
                var totalCell4 = totalRow.createCell(4);
                totalCell4.setCellValue(totalSalidas);
                totalCell4.setCellStyle(totalStyle);
                
                var totalCell5 = totalRow.createCell(5);
                totalCell5.setCellValue(totalRoturas);
                totalCell5.setCellStyle(totalStyle);
                
                var totalCell6 = totalRow.createCell(6);
                totalCell6.setCellValue(totalBalanceFinal);
                totalCell6.setCellStyle(totalStyle);
                
                var totalCell7 = totalRow.createCell(7);
                totalCell7.setCellValue("");
                totalCell7.setCellStyle(totalStyle);
                
                // Ajustar ancho de columnas
                for (int i = 0; i < headers.length; i++) {
                    sheet.setColumnWidth(i, 4000);
                }
                
                // Convertir a bytes
                try (var outputStream = new java.io.ByteArrayOutputStream()) {
                    workbook.write(outputStream);
                    byte[] excelBytes = outputStream.toByteArray();
                    
                    System.out.println("✅ [EXPORTAR] Excel generado exitosamente. Tamaño: " + excelBytes.length + " bytes");
                    return excelBytes;
                }
            }
            
        } catch (Exception e) {
            System.err.println("❌ [EXPORTAR] Error al exportar movimientos a Excel: " + e.getMessage());
            e.printStackTrace();
            throw new IOException("Error al exportar movimientos a Excel", e);
        }
    }

    /**
     * Exportar movimientos por rango de fechas a Excel
     */
    @Transactional(readOnly = true)
    public byte[] exportarMovimientosRangoExcel(String fechaInicioStr, String fechaFinStr) throws IOException {
        try {
            System.out.println("🔍 [EXPORTAR] Iniciando exportación a Excel para rango: " + fechaInicioStr + " a " + fechaFinStr);
            
            // Obtener los movimientos del rango
            MovimientoDiaDTO movimientos = obtenerMovimientosRango(fechaInicioStr, fechaFinStr);
            
            // Crear el workbook de Excel
            try (var workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
                var sheet = workbook.createSheet("Movimientos por Rango");
                
                // Crear estilos
                var headerStyle = workbook.createCellStyle();
                var headerFont = workbook.createFont();
                headerFont.setBold(true);
                headerFont.setColor(org.apache.poi.ss.usermodel.IndexedColors.WHITE.getIndex());
                headerStyle.setFont(headerFont);
                headerStyle.setFillForegroundColor(org.apache.poi.ss.usermodel.IndexedColors.BLUE.getIndex());
                headerStyle.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);
                headerStyle.setAlignment(org.apache.poi.ss.usermodel.HorizontalAlignment.CENTER);
                headerStyle.setBorderTop(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                headerStyle.setBorderBottom(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                headerStyle.setBorderLeft(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                headerStyle.setBorderRight(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                
                var dataStyle = workbook.createCellStyle();
                dataStyle.setBorderTop(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                dataStyle.setBorderBottom(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                dataStyle.setBorderLeft(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                dataStyle.setBorderRight(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                
                var totalStyle = workbook.createCellStyle();
                var totalFont = workbook.createFont();
                totalFont.setBold(true);
                totalStyle.setFont(totalFont);
                totalStyle.setFillForegroundColor(org.apache.poi.ss.usermodel.IndexedColors.GREY_25_PERCENT.getIndex());
                totalStyle.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);
                totalStyle.setBorderTop(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                totalStyle.setBorderBottom(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                totalStyle.setBorderLeft(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                totalStyle.setBorderRight(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                
                // Crear título
                var titleRow = sheet.createRow(0);
                var titleCell = titleRow.createCell(0);
                titleCell.setCellValue("REPORTE DE MOVIMIENTOS POR RANGO - " + fechaInicioStr + " a " + fechaFinStr);
                titleCell.setCellStyle(headerStyle);
                sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 0, 7));
                
                // Crear encabezados
                var headerRow = sheet.createRow(2);
                String[] headers = {
                    "Producto", "Stock Inicial", "Ingresos", "Retornos", 
                    "Carga Planillas", "Roturas", "Balance Final", "Observaciones"
                };
                
                for (int i = 0; i < headers.length; i++) {
                    var cell = headerRow.createCell(i);
                    cell.setCellValue(headers[i]);
                    cell.setCellStyle(headerStyle);
                }
                
                // Obtener todos los productos únicos
                Set<Long> productosIds = new HashSet<>();
                Map<Long, String> productosNombres = new HashMap<>();
                Map<Long, String> productosCodigos = new HashMap<>();
                
                // Agregar productos del stock inicial
                for (var producto : movimientos.getStockInicial().getProductos()) {
                    productosIds.add(producto.getId());
                    productosNombres.put(producto.getId(), producto.getNombre());
                    productosCodigos.put(producto.getId(), producto.getCodigoPersonalizado());
                }
                
                // Agregar productos de ingresos
                for (var producto : movimientos.getIngresos().getProductos()) {
                    productosIds.add(producto.getId());
                    productosNombres.put(producto.getId(), producto.getNombre());
                    productosCodigos.put(producto.getId(), producto.getCodigoPersonalizado());
                }
                
                // Agregar productos de devoluciones
                for (var producto : movimientos.getDevoluciones().getProductos()) {
                    productosIds.add(producto.getId());
                    productosNombres.put(producto.getId(), producto.getNombre());
                    productosCodigos.put(producto.getId(), producto.getCodigoPersonalizado());
                }
                
                // Agregar productos de salidas
                for (var producto : movimientos.getSalidas().getProductos()) {
                    productosIds.add(producto.getId());
                    productosNombres.put(producto.getId(), producto.getNombre());
                    productosCodigos.put(producto.getId(), producto.getCodigoPersonalizado());
                }
                
                // Agregar productos de roturas
                for (var producto : movimientos.getRoturas().getProductos()) {
                    productosIds.add(producto.getId());
                    productosNombres.put(producto.getId(), producto.getNombre());
                    productosCodigos.put(producto.getId(), producto.getCodigoPersonalizado());
                }
                
                // Crear mapas para facilitar la búsqueda
                Map<Long, Integer> stockInicial = movimientos.getStockInicial().getProductos().stream()
                    .collect(Collectors.toMap(p -> p.getId(), p -> p.getCantidadInicial() != null ? p.getCantidadInicial() : 0));
                    
                Map<Long, Integer> ingresos = movimientos.getIngresos().getProductos().stream()
                    .collect(Collectors.toMap(p -> p.getId(), p -> p.getCantidad()));
                    
                Map<Long, Integer> devoluciones = movimientos.getDevoluciones().getProductos().stream()
                    .collect(Collectors.toMap(p -> p.getId(), p -> p.getCantidad()));
                    
                Map<Long, Integer> salidas = movimientos.getSalidas().getProductos().stream()
                    .collect(Collectors.toMap(p -> p.getId(), p -> p.getCantidad()));
                    
                Map<Long, Integer> roturas = movimientos.getRoturas().getProductos().stream()
                    .collect(Collectors.toMap(p -> p.getId(), p -> p.getCantidad()));
                
                // Llenar datos
                int rowNum = 3;
                int totalStockInicial = 0;
                int totalIngresos = 0;
                int totalDevoluciones = 0;
                int totalSalidas = 0;
                int totalRoturas = 0;
                int totalBalanceFinal = 0;
                
                for (Long productoId : productosIds) {
                    var row = sheet.createRow(rowNum++);
                    
                    // Producto
                    var cell0 = row.createCell(0);
                    String nombreProducto = productosNombres.get(productoId);
                    String codigoProducto = productosCodigos.get(productoId);
                    cell0.setCellValue(codigoProducto != null ? codigoProducto + " - " + nombreProducto : nombreProducto);
                    cell0.setCellStyle(dataStyle);
                    
                    // Stock Inicial
                    var cell1 = row.createCell(1);
                    int stockInicialCantidad = stockInicial.getOrDefault(productoId, 0);
                    cell1.setCellValue(stockInicialCantidad);
                    cell1.setCellStyle(dataStyle);
                    totalStockInicial += stockInicialCantidad;
                    
                    // Ingresos
                    var cell2 = row.createCell(2);
                    int ingresosCantidad = ingresos.getOrDefault(productoId, 0);
                    cell2.setCellValue(ingresosCantidad);
                    cell2.setCellStyle(dataStyle);
                    totalIngresos += ingresosCantidad;
                    
                    // Retornos
                    var cell3 = row.createCell(3);
                    int devolucionesCantidad = devoluciones.getOrDefault(productoId, 0);
                    cell3.setCellValue(devolucionesCantidad);
                    cell3.setCellStyle(dataStyle);
                    totalDevoluciones += devolucionesCantidad;
                    
                    // Carga Planillas
                    var cell4 = row.createCell(4);
                    int salidasCantidad = salidas.getOrDefault(productoId, 0);
                    cell4.setCellValue(salidasCantidad);
                    cell4.setCellStyle(dataStyle);
                    totalSalidas += salidasCantidad;
                    
                    // Roturas
                    var cell5 = row.createCell(5);
                    int roturasCantidad = roturas.getOrDefault(productoId, 0);
                    cell5.setCellValue(roturasCantidad);
                    cell5.setCellStyle(dataStyle);
                    totalRoturas += roturasCantidad;
                    
                    // Balance Final
                    var cell6 = row.createCell(6);
                    int balanceFinal = stockInicialCantidad + ingresosCantidad + devolucionesCantidad - salidasCantidad - roturasCantidad;
                    cell6.setCellValue(balanceFinal);
                    cell6.setCellStyle(dataStyle);
                    totalBalanceFinal += balanceFinal;
                    
                    // Observaciones
                    var cell7 = row.createCell(7);
                    cell7.setCellValue("");
                    cell7.setCellStyle(dataStyle);
                }
                
                // Fila de totales
                var totalRow = sheet.createRow(rowNum++);
                
                var totalCell0 = totalRow.createCell(0);
                totalCell0.setCellValue("TOTALES");
                totalCell0.setCellStyle(totalStyle);
                
                var totalCell1 = totalRow.createCell(1);
                totalCell1.setCellValue(totalStockInicial);
                totalCell1.setCellStyle(totalStyle);
                
                var totalCell2 = totalRow.createCell(2);
                totalCell2.setCellValue(totalIngresos);
                totalCell2.setCellStyle(totalStyle);
                
                var totalCell3 = totalRow.createCell(3);
                totalCell3.setCellValue(totalDevoluciones);
                totalCell3.setCellStyle(totalStyle);
                
                var totalCell4 = totalRow.createCell(4);
                totalCell4.setCellValue(totalSalidas);
                totalCell4.setCellStyle(totalStyle);
                
                var totalCell5 = totalRow.createCell(5);
                totalCell5.setCellValue(totalRoturas);
                totalCell5.setCellStyle(totalStyle);
                
                var totalCell6 = totalRow.createCell(6);
                totalCell6.setCellValue(totalBalanceFinal);
                totalCell6.setCellStyle(totalStyle);
                
                var totalCell7 = totalRow.createCell(7);
                totalCell7.setCellValue("");
                totalCell7.setCellStyle(totalStyle);
                
                // Ajustar ancho de columnas
                for (int i = 0; i < headers.length; i++) {
                    sheet.setColumnWidth(i, 4000);
                }
                
                // Convertir a bytes
                try (var outputStream = new java.io.ByteArrayOutputStream()) {
                    workbook.write(outputStream);
                    byte[] excelBytes = outputStream.toByteArray();
                    
                    System.out.println("✅ [EXPORTAR] Excel de rango generado exitosamente. Tamaño: " + excelBytes.length + " bytes");
                    return excelBytes;
                }
            }
            
        } catch (Exception e) {
            System.err.println("❌ [EXPORTAR] Error al exportar movimientos de rango a Excel: " + e.getMessage());
            e.printStackTrace();
            throw new IOException("Error al exportar movimientos de rango a Excel", e);
        }
    }

    /**
     * Exportar ingresos del día a Excel con estructura específica
     * Incluye: código personalizado, productos iniciales, cantidades, remitos por día
     */
    @Transactional(readOnly = true)
    public byte[] exportarIngresosDiaExcel(String fechaStr) throws IOException {
        try {
            Long empresaId = obtenerEmpresaId();
            LocalDate fecha = LocalDate.parse(fechaStr, DATE_FORMATTER);
            
            System.out.println("🔍 [EXPORTAR INGRESOS] Exportando ingresos para empresa: " + empresaId + ", fecha: " + fecha);
            
            // Obtener movimientos del día
            MovimientoDiaDTO movimientos = obtenerMovimientosDia(fechaStr);
            
            // Obtener remitos de ingreso del día
            LocalDateTime inicioDia = fecha.atStartOfDay();
            LocalDateTime finDia = fecha.atTime(23, 59, 59);
            
            List<RemitoIngreso> remitosDelDia = remitoIngresoRepository.findByRangoFechasAndEmpresaId(
                inicioDia, finDia, empresaId);
            
            System.out.println("📋 [EXPORTAR INGRESOS] Remitos encontrados: " + remitosDelDia.size());
            
            // Crear workbook
            try (var workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
                var sheet = workbook.createSheet("Ingresos del Día");
                
                // Estilos
                var headerStyle = workbook.createCellStyle();
                var headerFont = workbook.createFont();
                headerFont.setBold(true);
                headerFont.setFontHeightInPoints((short) 12);
                headerStyle.setFont(headerFont);
                headerStyle.setFillForegroundColor(org.apache.poi.ss.usermodel.IndexedColors.LIGHT_GREEN.getIndex());
                headerStyle.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);
                headerStyle.setBorderBottom(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                headerStyle.setBorderTop(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                headerStyle.setBorderRight(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                headerStyle.setBorderLeft(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                
                var dataStyle = workbook.createCellStyle();
                dataStyle.setBorderBottom(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                dataStyle.setBorderTop(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                dataStyle.setBorderRight(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                dataStyle.setBorderLeft(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                
                var totalStyle = workbook.createCellStyle();
                var totalFont = workbook.createFont();
                totalFont.setBold(true);
                totalStyle.setFont(totalFont);
                totalStyle.setFillForegroundColor(org.apache.poi.ss.usermodel.IndexedColors.LIGHT_YELLOW.getIndex());
                totalStyle.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);
                totalStyle.setBorderBottom(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                totalStyle.setBorderTop(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                totalStyle.setBorderRight(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                totalStyle.setBorderLeft(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                
                // Crear estructura de encabezados como en la imagen
                // Primera fila: "N° de Remito" como encabezado principal
                var headerRow1 = sheet.createRow(0);
                var headerRow2 = sheet.createRow(1);
                var headerRow3 = sheet.createRow(2);
                
                // Primera fila - encabezado principal
                var cell0_1 = headerRow1.createCell(0);
                cell0_1.setCellValue("Código");
                cell0_1.setCellStyle(headerStyle);
                
                var cell1_1 = headerRow1.createCell(1);
                cell1_1.setCellValue("Descripción");
                cell1_1.setCellStyle(headerStyle);
                
                // Encabezado principal "N° de Remito" que abarca todas las columnas de remitos
                if (remitosDelDia.size() > 0) {
                    var cell2_1 = headerRow1.createCell(2);
                    cell2_1.setCellValue("N° de Remito");
                    cell2_1.setCellStyle(headerStyle);
                    
                    // Combinar celdas para el encabezado principal si hay múltiples remitos
                    if (remitosDelDia.size() > 1) {
                        sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 2, 1 + remitosDelDia.size()));
                    }
                }
                
                // Segunda fila - números de remito
                var cell0_2 = headerRow2.createCell(0);
                cell0_2.setCellValue("");
                cell0_2.setCellStyle(headerStyle);
                
                var cell1_2 = headerRow2.createCell(1);
                cell1_2.setCellValue("");
                cell1_2.setCellStyle(headerStyle);
                
                // Números de remito en la segunda fila
                for (int i = 0; i < remitosDelDia.size(); i++) {
                    var cell = headerRow2.createCell(2 + i);
                    cell.setCellValue(remitosDelDia.get(i).getNumeroRemito());
                    cell.setCellStyle(headerStyle);
                }
                
                // Tercera fila - nombres de proveedor/empresa
                var cell0_3 = headerRow3.createCell(0);
                cell0_3.setCellValue("");
                cell0_3.setCellStyle(headerStyle);
                
                var cell1_3 = headerRow3.createCell(1);
                cell1_3.setCellValue("");
                cell1_3.setCellStyle(headerStyle);
                
                // Nombres de transporte/proveedor en la tercera fila (usando observaciones de la planilla)
                for (int i = 0; i < remitosDelDia.size(); i++) {
                    var cell = headerRow3.createCell(2 + i);
                    String nombreTransporte = remitosDelDia.get(i).getObservaciones() != null && !remitosDelDia.get(i).getObservaciones().isEmpty() 
                        ? remitosDelDia.get(i).getObservaciones() 
                        : ""; // Sin valor por defecto, solo lo que está en observaciones
                    cell.setCellValue(nombreTransporte);
                    cell.setCellStyle(headerStyle);
                }
                
                // Crear mapa de productos con sus cantidades iniciales
                Map<Long, Integer> productosIniciales = new HashMap<>();
                Map<Long, String> productosNombres = new HashMap<>();
                Map<Long, String> productosCodigos = new HashMap<>();
                
                for (var producto : movimientos.getStockInicial().getProductos()) {
                    productosIniciales.put(producto.getId(), producto.getCantidad());
                    productosNombres.put(producto.getId(), producto.getNombre());
                    productosCodigos.put(producto.getId(), producto.getCodigoPersonalizado());
                }
                
                // Crear mapa de productos por remito
                Map<Long, Map<Long, Integer>> productosPorRemito = new HashMap<>();
                for (RemitoIngreso remito : remitosDelDia) {
                    Map<Long, Integer> productosRemito = new HashMap<>();
                    for (DetalleRemitoIngreso detalle : remito.getDetalles()) {
                        if (detalle.getProducto() != null && detalle.getProducto().getId() != null) {
                            Long productoId = detalle.getProducto().getId();
                            productosRemito.put(productoId, 
                                productosRemito.getOrDefault(productoId, 0) + detalle.getCantidad());
                        }
                    }
                    productosPorRemito.put(remito.getId(), productosRemito);
                }
                
                // Obtener todos los productos únicos
                Set<Long> todosLosProductos = new HashSet<>(productosIniciales.keySet());
                for (Map<Long, Integer> productosRemito : productosPorRemito.values()) {
                    todosLosProductos.addAll(productosRemito.keySet());
                }
                
                // Crear filas de datos (empezando desde la fila 3, ya que tenemos 3 filas de encabezado)
                int rowNum = 3;
                Map<Long, Integer> totalesPorRemito = new HashMap<>();
                
                for (Long productoId : todosLosProductos) {
                    var row = sheet.createRow(rowNum++);
                    
                    // Código personalizado
                    var cell0 = row.createCell(0);
                    String codigo = productosCodigos.get(productoId);
                    cell0.setCellValue(codigo != null ? codigo : "");
                    cell0.setCellStyle(dataStyle);
                    
                    // Nombre del producto
                    var cell1 = row.createCell(1);
                    String nombre = productosNombres.get(productoId);
                    cell1.setCellValue(nombre != null ? nombre : "Producto ID: " + productoId);
                    cell1.setCellStyle(dataStyle);
                    
                    // Cantidades por remito (sin columna de cantidad inicial, como en la imagen)
                    int colIndex = 2;
                    for (RemitoIngreso remito : remitosDelDia) {
                        var cell = row.createCell(colIndex++);
                        Map<Long, Integer> productosRemito = productosPorRemito.get(remito.getId());
                        int cantidadRemito = productosRemito.getOrDefault(productoId, 0);
                        cell.setCellValue(cantidadRemito);
                        cell.setCellStyle(dataStyle);
                        
                        // Acumular total por remito
                        totalesPorRemito.put(remito.getId(), 
                            totalesPorRemito.getOrDefault(remito.getId(), 0) + cantidadRemito);
                    }
                }
                
                // Fila de totales
                var totalRow = sheet.createRow(rowNum++);
                
                var totalCell0 = totalRow.createCell(0);
                totalCell0.setCellValue("TOTALES");
                totalCell0.setCellStyle(totalStyle);
                
                var totalCell1 = totalRow.createCell(1);
                totalCell1.setCellValue("");
                totalCell1.setCellStyle(totalStyle);
                
                // Totales por remito (sin columna de cantidad inicial)
                int colIndex = 2;
                for (RemitoIngreso remito : remitosDelDia) {
                    var cell = totalRow.createCell(colIndex++);
                    int totalRemito = totalesPorRemito.getOrDefault(remito.getId(), 0);
                    cell.setCellValue(totalRemito);
                    cell.setCellStyle(totalStyle);
                }
                
                // Ajustar ancho de columnas
                int totalColumns = 2 + remitosDelDia.size(); // Código + Descripción + columnas de remitos
                for (int i = 0; i < totalColumns; i++) {
                    sheet.setColumnWidth(i, 4000);
                }
                
                // Convertir a bytes
                try (var outputStream = new java.io.ByteArrayOutputStream()) {
                    workbook.write(outputStream);
                    byte[] excelBytes = outputStream.toByteArray();
                    
                    System.out.println("✅ [EXPORTAR INGRESOS] Excel de ingresos generado exitosamente. Tamaño: " + excelBytes.length + " bytes");
                    return excelBytes;
                }
            }
            
        } catch (Exception e) {
            System.err.println("❌ [EXPORTAR INGRESOS] Error al exportar ingresos a Excel: " + e.getMessage());
            e.printStackTrace();
            throw new IOException("Error al exportar ingresos a Excel", e);
        }
    }

    /**
     * Exportar planillas del día a Excel con estructura específica
     * Incluye: código personalizado, productos, cantidades, planillas por día
     */
    @Transactional(readOnly = true)
    public byte[] exportarPlanillasDiaExcel(String fechaStr) throws IOException {
        try {
            Long empresaId = obtenerEmpresaId();
            LocalDate fecha = LocalDate.parse(fechaStr, DATE_FORMATTER);
            
            System.out.println("🔍 [EXPORTAR PLANILLAS] Exportando planillas para empresa: " + empresaId + ", fecha: " + fecha);
            
            // Obtener movimientos del día
            MovimientoDiaDTO movimientos = obtenerMovimientosDia(fechaStr);
            
            // Obtener planillas del día
            LocalDateTime inicioDia = fecha.atStartOfDay();
            LocalDateTime finDia = fecha.atTime(23, 59, 59);
            
            List<PlanillaPedido> planillasDelDia = planillaPedidoRepository.findByEmpresaIdAndFechaPlanillaBetweenOrderByFechaCreacionDesc(
                empresaId, inicioDia, finDia);
            
            System.out.println("📋 [EXPORTAR PLANILLAS] Planillas encontradas: " + planillasDelDia.size());
            
            // Crear workbook
            try (var workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
                var sheet = workbook.createSheet("Planillas del Día");
                
                // Estilos
                var headerStyle = workbook.createCellStyle();
                var headerFont = workbook.createFont();
                headerFont.setBold(true);
                headerFont.setFontHeightInPoints((short) 12);
                headerStyle.setFont(headerFont);
                headerStyle.setFillForegroundColor(org.apache.poi.ss.usermodel.IndexedColors.LIGHT_GREEN.getIndex());
                headerStyle.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);
                headerStyle.setBorderBottom(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                headerStyle.setBorderTop(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                headerStyle.setBorderRight(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                headerStyle.setBorderLeft(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                
                var dataStyle = workbook.createCellStyle();
                dataStyle.setBorderBottom(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                dataStyle.setBorderTop(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                dataStyle.setBorderRight(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                dataStyle.setBorderLeft(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                
                var totalStyle = workbook.createCellStyle();
                var totalFont = workbook.createFont();
                totalFont.setBold(true);
                totalStyle.setFont(totalFont);
                totalStyle.setFillForegroundColor(org.apache.poi.ss.usermodel.IndexedColors.LIGHT_YELLOW.getIndex());
                totalStyle.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);
                totalStyle.setBorderBottom(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                totalStyle.setBorderTop(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                totalStyle.setBorderRight(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                totalStyle.setBorderLeft(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                
                // Crear estructura de encabezados (3 filas: encabezado, números de planilla, patentes)
                var headerRow1 = sheet.createRow(0);
                var headerRow2 = sheet.createRow(1);
                var headerRow3 = sheet.createRow(2);
                
                // Primera fila - encabezado principal
                var cell0_1 = headerRow1.createCell(0);
                cell0_1.setCellValue("Código");
                cell0_1.setCellStyle(headerStyle);
                
                var cell1_1 = headerRow1.createCell(1);
                cell1_1.setCellValue("Descripción");
                cell1_1.setCellStyle(headerStyle);
                
                // Encabezado principal "N° de Planilla" que abarca todas las columnas de planillas
                if (planillasDelDia.size() > 0) {
                    var cell2_1 = headerRow1.createCell(2);
                    cell2_1.setCellValue("N° de Planilla");
                    cell2_1.setCellStyle(headerStyle);
                    
                    // Combinar celdas para el encabezado principal si hay múltiples planillas
                    if (planillasDelDia.size() > 1) {
                        sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 2, 2 + planillasDelDia.size() - 1));
                    }
                }
                
                // Segunda fila - números de planilla
                var cell0_2 = headerRow2.createCell(0);
                cell0_2.setCellValue("");
                cell0_2.setCellStyle(headerStyle);
                
                var cell1_2 = headerRow2.createCell(1);
                cell1_2.setCellValue("");
                cell1_2.setCellStyle(headerStyle);
                
                // Números de planilla en la segunda fila
                for (int i = 0; i < planillasDelDia.size(); i++) {
                    var cell = headerRow2.createCell(2 + i);
                    cell.setCellValue(planillasDelDia.get(i).getNumeroPlanilla());
                    cell.setCellStyle(headerStyle);
                }
                
                // Tercera fila - patentes de vehículos
                var cell0_3 = headerRow3.createCell(0);
                cell0_3.setCellValue("");
                cell0_3.setCellStyle(headerStyle);
                
                var cell1_3 = headerRow3.createCell(1);
                cell1_3.setCellValue("");
                cell1_3.setCellStyle(headerStyle);
                
                // Patentes en la tercera fila
                for (int i = 0; i < planillasDelDia.size(); i++) {
                    var cell = headerRow3.createCell(2 + i);
                    String patente = planillasDelDia.get(i).getTransporte();
                    cell.setCellValue(patente != null && !patente.trim().isEmpty() ? patente : "");
                    cell.setCellStyle(headerStyle);
                }
                
                // Crear mapa de productos con sus cantidades iniciales
                Map<Long, Integer> productosIniciales = new HashMap<>();
                Map<Long, String> productosNombres = new HashMap<>();
                Map<Long, String> productosCodigos = new HashMap<>();
                
                for (var producto : movimientos.getStockInicial().getProductos()) {
                    productosIniciales.put(producto.getId(), producto.getCantidad());
                    productosNombres.put(producto.getId(), producto.getNombre());
                    productosCodigos.put(producto.getId(), producto.getCodigoPersonalizado());
                }
                
                // Crear mapa de productos por planilla
                Map<Long, Map<Long, Integer>> productosPorPlanilla = new HashMap<>();
                for (PlanillaPedido planilla : planillasDelDia) {
                    Map<Long, Integer> productosPlanilla = new HashMap<>();
                    for (DetallePlanillaPedido detalle : planilla.getDetalles()) {
                        if (detalle.getProducto() != null && detalle.getProducto().getId() != null) {
                            Long productoId = detalle.getProducto().getId();
                            productosPlanilla.put(productoId, 
                                productosPlanilla.getOrDefault(productoId, 0) + detalle.getCantidad());
                        }
                    }
                    productosPorPlanilla.put(planilla.getId(), productosPlanilla);
                }
                
                // Obtener todos los productos únicos
                Set<Long> todosLosProductos = new HashSet<>(productosIniciales.keySet());
                for (Map<Long, Integer> productosPlanilla : productosPorPlanilla.values()) {
                    todosLosProductos.addAll(productosPlanilla.keySet());
                }
                
                // Crear filas de datos (empezando desde la fila 3, ya que tenemos 3 filas de encabezado)
                int rowNum = 3;
                Map<Long, Integer> totalesPorPlanilla = new HashMap<>();
                
                for (Long productoId : todosLosProductos) {
                    var row = sheet.createRow(rowNum++);
                    
                    // Código personalizado
                    var cell0 = row.createCell(0);
                    String codigo = productosCodigos.get(productoId);
                    cell0.setCellValue(codigo != null ? codigo : "");
                    cell0.setCellStyle(dataStyle);
                    
                    // Nombre del producto
                    var cell1 = row.createCell(1);
                    String nombre = productosNombres.get(productoId);
                    cell1.setCellValue(nombre != null ? nombre : "Producto ID: " + productoId);
                    cell1.setCellStyle(dataStyle);
                    
                    // Cantidades por planilla
                    int colIndex = 2;
                    for (PlanillaPedido planilla : planillasDelDia) {
                        var cell = row.createCell(colIndex++);
                        Map<Long, Integer> productosPlanilla = productosPorPlanilla.get(planilla.getId());
                        int cantidadPlanilla = productosPlanilla.getOrDefault(productoId, 0);
                        cell.setCellValue(cantidadPlanilla);
                        cell.setCellStyle(dataStyle);
                        
                        // Acumular total por planilla
                        totalesPorPlanilla.put(planilla.getId(), 
                            totalesPorPlanilla.getOrDefault(planilla.getId(), 0) + cantidadPlanilla);
                    }
                }
                
                // Fila de totales
                var totalRow = sheet.createRow(rowNum++);
                
                var totalCell0 = totalRow.createCell(0);
                totalCell0.setCellValue("TOTALES");
                totalCell0.setCellStyle(totalStyle);
                
                var totalCell1 = totalRow.createCell(1);
                totalCell1.setCellValue("");
                totalCell1.setCellStyle(totalStyle);
                
                // Totales por planilla
                int colIndex = 2;
                for (PlanillaPedido planilla : planillasDelDia) {
                    var cell = totalRow.createCell(colIndex++);
                    int totalPlanilla = totalesPorPlanilla.getOrDefault(planilla.getId(), 0);
                    cell.setCellValue(totalPlanilla);
                    cell.setCellStyle(totalStyle);
                }
                
                // Ajustar ancho de columnas
                int totalColumns = 2 + planillasDelDia.size(); // Código + Descripción + columnas de planillas
                for (int i = 0; i < totalColumns; i++) {
                    sheet.setColumnWidth(i, 4000);
                }
                
                // Convertir a bytes
                try (var outputStream = new java.io.ByteArrayOutputStream()) {
                    workbook.write(outputStream);
                    byte[] excelBytes = outputStream.toByteArray();
                    
                    System.out.println("✅ [EXPORTAR PLANILLAS] Excel de planillas generado exitosamente. Tamaño: " + excelBytes.length + " bytes");
                    return excelBytes;
                }
            }
            
        } catch (Exception e) {
            System.err.println("❌ [EXPORTAR PLANILLAS] Error al exportar planillas a Excel: " + e.getMessage());
            e.printStackTrace();
            throw new IOException("Error al exportar planillas a Excel", e);
        }
    }

    /**
     * Exportar devoluciones del día a Excel con estructura específica
     * Incluye: código personalizado, productos, cantidades, planillas de devolución por día
     */
    @Transactional(readOnly = true)
    public byte[] exportarDevolucionesDiaExcel(String fechaStr) throws IOException {
        try {
            Long empresaId = obtenerEmpresaId();
            LocalDate fecha = LocalDate.parse(fechaStr, DATE_FORMATTER);
            
            System.out.println("🔍 [EXPORTAR DEVOLUCIONES] Exportando devoluciones para empresa: " + empresaId + ", fecha: " + fecha);
            
            // Obtener movimientos del día
            MovimientoDiaDTO movimientos = obtenerMovimientosDia(fechaStr);
            
            // Obtener planillas de devolución del día
            LocalDateTime inicioDia = fecha.atStartOfDay();
            LocalDateTime finDia = fecha.atTime(23, 59, 59);
            
            List<PlanillaDevolucion> devolucionesDelDia = planillaDevolucionRepository.findByEmpresaIdAndFechaPlanillaBetweenOrderByFechaCreacionDesc(
                empresaId, inicioDia, finDia);
            
            System.out.println("📋 [EXPORTAR DEVOLUCIONES] Devoluciones encontradas: " + devolucionesDelDia.size());
            
            // Crear workbook
            try (var workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook()) {
                var sheet = workbook.createSheet("Devoluciones del Día");
                
                // Estilos
                var headerStyle = workbook.createCellStyle();
                var headerFont = workbook.createFont();
                headerFont.setBold(true);
                headerFont.setFontHeightInPoints((short) 12);
                headerStyle.setFont(headerFont);
                headerStyle.setFillForegroundColor(org.apache.poi.ss.usermodel.IndexedColors.LIGHT_GREEN.getIndex());
                headerStyle.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);
                headerStyle.setBorderBottom(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                headerStyle.setBorderTop(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                headerStyle.setBorderRight(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                headerStyle.setBorderLeft(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                
                var dataStyle = workbook.createCellStyle();
                dataStyle.setBorderBottom(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                dataStyle.setBorderTop(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                dataStyle.setBorderRight(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                dataStyle.setBorderLeft(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                
                var totalStyle = workbook.createCellStyle();
                var totalFont = workbook.createFont();
                totalFont.setBold(true);
                totalStyle.setFont(totalFont);
                totalStyle.setFillForegroundColor(org.apache.poi.ss.usermodel.IndexedColors.LIGHT_YELLOW.getIndex());
                totalStyle.setFillPattern(org.apache.poi.ss.usermodel.FillPatternType.SOLID_FOREGROUND);
                totalStyle.setBorderBottom(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                totalStyle.setBorderTop(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                totalStyle.setBorderRight(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                totalStyle.setBorderLeft(org.apache.poi.ss.usermodel.BorderStyle.THIN);
                
                // Crear estructura de encabezados (solo 2 filas, sin observaciones)
                var headerRow1 = sheet.createRow(0);
                var headerRow2 = sheet.createRow(1);
                
                // Primera fila - encabezado principal
                var cell0_1 = headerRow1.createCell(0);
                cell0_1.setCellValue("Código");
                cell0_1.setCellStyle(headerStyle);
                
                var cell1_1 = headerRow1.createCell(1);
                cell1_1.setCellValue("Descripción");
                cell1_1.setCellStyle(headerStyle);
                
                // Encabezado principal "N° de Planilla" que abarca todas las columnas de devoluciones
                if (devolucionesDelDia.size() > 0) {
                    var cell2_1 = headerRow1.createCell(2);
                    cell2_1.setCellValue("N° de Planilla");
                    cell2_1.setCellStyle(headerStyle);
                    
                    // Combinar celdas para el encabezado principal si hay múltiples devoluciones
                    if (devolucionesDelDia.size() > 1) {
                        sheet.addMergedRegion(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 2, 1 + devolucionesDelDia.size()));
                    }
                }
                
                // Segunda fila - números de planilla de devolución
                var cell0_2 = headerRow2.createCell(0);
                cell0_2.setCellValue("");
                cell0_2.setCellStyle(headerStyle);
                
                var cell1_2 = headerRow2.createCell(1);
                cell1_2.setCellValue("");
                cell1_2.setCellStyle(headerStyle);
                
                // Números de planilla de devolución en la segunda fila
                for (int i = 0; i < devolucionesDelDia.size(); i++) {
                    var cell = headerRow2.createCell(2 + i);
                    String numeroPlanilla = devolucionesDelDia.get(i).getNumeroPlanilla();
                    cell.setCellValue(numeroPlanilla != null ? numeroPlanilla : "Sin N°");
                    cell.setCellStyle(headerStyle);
                }
                
                // Crear mapa de productos con sus cantidades iniciales
                Map<Long, Integer> productosIniciales = new HashMap<>();
                Map<Long, String> productosNombres = new HashMap<>();
                Map<Long, String> productosCodigos = new HashMap<>();
                
                for (var producto : movimientos.getStockInicial().getProductos()) {
                    productosIniciales.put(producto.getId(), producto.getCantidad());
                    productosNombres.put(producto.getId(), producto.getNombre());
                    productosCodigos.put(producto.getId(), producto.getCodigoPersonalizado());
                }
                
                // Crear mapa de productos por devolución
                Map<Long, Map<Long, Integer>> productosPorDevolucion = new HashMap<>();
                for (PlanillaDevolucion devolucion : devolucionesDelDia) {
                    Map<Long, Integer> productosDevolucion = new HashMap<>();
                    for (DetallePlanillaDevolucion detalle : devolucion.getDetalles()) {
                        if (detalle.getProducto() != null && detalle.getProducto().getId() != null) {
                            Long productoId = detalle.getProducto().getId();
                            productosDevolucion.put(productoId, 
                                productosDevolucion.getOrDefault(productoId, 0) + detalle.getCantidad());
                        }
                    }
                    productosPorDevolucion.put(devolucion.getId(), productosDevolucion);
                }
                
                // Obtener todos los productos únicos
                Set<Long> todosLosProductos = new HashSet<>(productosIniciales.keySet());
                for (Map<Long, Integer> productosDevolucion : productosPorDevolucion.values()) {
                    todosLosProductos.addAll(productosDevolucion.keySet());
                }
                
                // Crear filas de datos (empezando desde la fila 2, ya que tenemos 2 filas de encabezado)
                int rowNum = 2;
                Map<Long, Integer> totalesPorDevolucion = new HashMap<>();
                
                for (Long productoId : todosLosProductos) {
                    var row = sheet.createRow(rowNum++);
                    
                    // Código personalizado
                    var cell0 = row.createCell(0);
                    String codigo = productosCodigos.get(productoId);
                    cell0.setCellValue(codigo != null ? codigo : "");
                    cell0.setCellStyle(dataStyle);
                    
                    // Nombre del producto
                    var cell1 = row.createCell(1);
                    String nombre = productosNombres.get(productoId);
                    cell1.setCellValue(nombre != null ? nombre : "Producto ID: " + productoId);
                    cell1.setCellStyle(dataStyle);
                    
                    // Cantidades por devolución
                    int colIndex = 2;
                    for (PlanillaDevolucion devolucion : devolucionesDelDia) {
                        var cell = row.createCell(colIndex++);
                        Map<Long, Integer> productosDevolucion = productosPorDevolucion.get(devolucion.getId());
                        int cantidadDevolucion = productosDevolucion.getOrDefault(productoId, 0);
                        cell.setCellValue(cantidadDevolucion);
                        cell.setCellStyle(dataStyle);
                        
                        // Acumular total por devolución
                        totalesPorDevolucion.put(devolucion.getId(), 
                            totalesPorDevolucion.getOrDefault(devolucion.getId(), 0) + cantidadDevolucion);
                    }
                }
                
                // Fila de totales
                var totalRow = sheet.createRow(rowNum++);
                
                var totalCell0 = totalRow.createCell(0);
                totalCell0.setCellValue("TOTALES");
                totalCell0.setCellStyle(totalStyle);
                
                var totalCell1 = totalRow.createCell(1);
                totalCell1.setCellValue("");
                totalCell1.setCellStyle(totalStyle);
                
                // Totales por devolución
                int colIndex = 2;
                for (PlanillaDevolucion devolucion : devolucionesDelDia) {
                    var cell = totalRow.createCell(colIndex++);
                    int totalDevolucion = totalesPorDevolucion.getOrDefault(devolucion.getId(), 0);
                    cell.setCellValue(totalDevolucion);
                    cell.setCellStyle(totalStyle);
                }
                
                // Ajustar ancho de columnas
                int totalColumns = 2 + devolucionesDelDia.size(); // Código + Descripción + columnas de devoluciones
                for (int i = 0; i < totalColumns; i++) {
                    sheet.setColumnWidth(i, 4000);
                }
                
                // Convertir a bytes
                try (var outputStream = new java.io.ByteArrayOutputStream()) {
                    workbook.write(outputStream);
                    byte[] excelBytes = outputStream.toByteArray();
                    
                    System.out.println("✅ [EXPORTAR DEVOLUCIONES] Excel de devoluciones generado exitosamente. Tamaño: " + excelBytes.length + " bytes");
                    return excelBytes;
                }
            }
            
        } catch (Exception e) {
            System.err.println("❌ [EXPORTAR DEVOLUCIONES] Error al exportar devoluciones a Excel: " + e.getMessage());
            e.printStackTrace();
            throw new IOException("Error al exportar devoluciones a Excel", e);
        }
    }

    /**
     * Exportar stock inicial del día a Excel
     * Incluye: código personalizado, descripción, cantidad inicial, total
     */
    @Transactional(readOnly = true)
    public byte[] exportarStockInicialExcel(String fechaStr) throws IOException {
        // Configurar sistema para modo headless ANTES de cualquier operación
        configurarModoHeadless();
        
        System.out.println("🔍 [SERVICE] Exportando stock inicial a Excel para fecha: " + fechaStr);
        
        try {
            return exportarStockInicialExcelCompleto(fechaStr);
        } catch (Exception e) {
            System.err.println("❌ [SERVICE] Error en stock inicial Excel, usando versión CSV: " + e.getMessage());
            // Fallback a CSV
            return exportarStockInicialCSV(fechaStr);
        }
    }
    
    /**
     * Versión completa del stock inicial a Excel
     */
    private byte[] exportarStockInicialExcelCompleto(String fechaStr) throws IOException {
        
        // Obtener movimientos del día
        MovimientoDiaDTO movimientos;
        try {
            System.out.println("🔍 [SERVICE] Llamando a obtenerMovimientosDia con fecha: " + fechaStr);
            movimientos = obtenerMovimientosDia(fechaStr);
            System.out.println("🔍 [SERVICE] Movimientos obtenidos: " + (movimientos != null ? "SÍ" : "NO"));
            
            if (movimientos == null) {
                System.out.println("⚠️ [SERVICE] No hay movimientos para la fecha: " + fechaStr);
                throw new RuntimeException("No hay movimientos disponibles para la fecha especificada");
            }
            
            System.out.println("🔍 [SERVICE] Fecha en movimientos: " + movimientos.getFecha());
            System.out.println("🔍 [SERVICE] Stock inicial: " + (movimientos.getStockInicial() != null ? "NO NULL" : "NULL"));
            
            if (movimientos.getStockInicial() == null) {
                System.out.println("⚠️ [SERVICE] Stock inicial es null para la fecha: " + fechaStr);
            } else {
                System.out.println("🔍 [SERVICE] Cantidad total stock inicial: " + movimientos.getStockInicial().getCantidadTotal());
                if (movimientos.getStockInicial().getProductos() == null) {
                    System.out.println("⚠️ [SERVICE] Productos de stock inicial es null para la fecha: " + fechaStr);
                } else {
                    System.out.println("🔍 [SERVICE] Productos de stock inicial: " + movimientos.getStockInicial().getProductos().size());
                }
            }
            
            if (movimientos.getStockInicial() == null || movimientos.getStockInicial().getProductos() == null || movimientos.getStockInicial().getProductos().isEmpty()) {
                System.out.println("⚠️ [SERVICE] No hay stock inicial para exportar en la fecha: " + fechaStr + ", generando Excel vacío");
            }
        } catch (Exception e) {
            System.err.println("❌ [SERVICE] Error al obtener movimientos: " + e.getMessage());
            e.printStackTrace();
            throw new IOException("Error al obtener movimientos del día: " + e.getMessage(), e);
        }
        
        // Crear workbook de Excel con inicialización segura
        org.apache.poi.xssf.usermodel.XSSFWorkbook workbook = null;
        try {
            // Inicialización diferida y segura
            workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook();
            System.out.println("🔍 [SERVICE] Creando workbook de Excel");
            Sheet sheet = workbook.createSheet("Stock Inicial");
            System.out.println("🔍 [SERVICE] Sheet creado: " + sheet.getSheetName());
            
            // Crear estilos
            System.out.println("🔍 [SERVICE] Creando estilos");
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
            
            // Título principal
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("STOCK INICIAL - " + fechaStr);
            titleCell.setCellStyle(headerStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 3));
            
            // Información de la fecha
            Row fechaRow = sheet.createRow(1);
            fechaRow.createCell(0).setCellValue("Fecha:");
            fechaRow.createCell(1).setCellValue(fechaStr);
            sheet.addMergedRegion(new CellRangeAddress(1, 1, 1, 3));
            
            // Línea en blanco
            int rowNum = 2;
            
            // Encabezados de la tabla
            Row headerRow = sheet.createRow(rowNum++);
            String[] headers = {"Código", "Descripción", "Cantidad Inicial"};
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }
            
            // Datos de productos
            List<MovimientoDiaDTO.ProductoStockDTO> productos = movimientos.getStockInicial() != null ? movimientos.getStockInicial().getProductos() : new ArrayList<>();
            int totalCantidad = 0;
            
            if (productos.isEmpty()) {
                // Si no hay productos, agregar una fila indicando que no hay datos
                Row noDataRow = sheet.createRow(rowNum++);
                Cell noDataCell = noDataRow.createCell(0);
                noDataCell.setCellValue("No hay productos en stock inicial para esta fecha");
                noDataCell.setCellStyle(dataStyle);
                sheet.addMergedRegion(new CellRangeAddress(rowNum-1, rowNum-1, 0, 2));
            } else {
                for (MovimientoDiaDTO.ProductoStockDTO producto : productos) {
                    Row dataRow = sheet.createRow(rowNum++);
                    
                    // Código personalizado
                    Cell codigoCell = dataRow.createCell(0);
                    codigoCell.setCellValue(producto.getCodigoPersonalizado() != null ? producto.getCodigoPersonalizado() : "");
                    codigoCell.setCellStyle(dataStyle);
                    
                    // Descripción
                    Cell descripcionCell = dataRow.createCell(1);
                    descripcionCell.setCellValue(producto.getNombre());
                    descripcionCell.setCellStyle(dataStyle);
                    
                    // Cantidad inicial
                    Cell cantidadCell = dataRow.createCell(2);
                    Integer cantidadInicial = producto.getCantidadInicial();
                    cantidadCell.setCellValue(cantidadInicial != null ? cantidadInicial : 0);
                    cantidadCell.setCellStyle(dataStyle);
                    
                    totalCantidad += (cantidadInicial != null ? cantidadInicial : 0);
                }
            }
            
            // Fila de total
            Row totalRow = sheet.createRow(rowNum++);
            Cell totalLabelCell = totalRow.createCell(0);
            totalLabelCell.setCellValue("TOTAL:");
            totalLabelCell.setCellStyle(headerStyle);
            
            Cell totalValueCell = totalRow.createCell(2);
            totalValueCell.setCellValue(totalCantidad);
            totalValueCell.setCellStyle(headerStyle);
            
            // Establecer anchos de columnas fijos (evita errores de fuentes en headless)
            establecerAnchosColumnas(sheet, 15, 30, 12); // Código, Descripción, Cantidad
            
            // Convertir a bytes
            try (var outputStream = new java.io.ByteArrayOutputStream()) {
                workbook.write(outputStream);
                byte[] workbookBytes = outputStream.toByteArray();
                
                System.out.println("✅ [SERVICE] Excel de stock inicial generado exitosamente. Tamaño: " + workbookBytes.length + " bytes");
                System.out.println("📊 [SERVICE] Productos exportados: " + productos.size() + ", Total cantidad: " + totalCantidad);
                
                return workbookBytes;
            }
        } finally {
            if (workbook != null) {
                try {
                    workbook.close();
                } catch (Exception e) {
                    System.err.println("⚠️ [SERVICE] Error al cerrar workbook: " + e.getMessage());
                }
            }
        }
    }
    
    /**
     * Versión CSV del stock inicial como fallback
     */
    private byte[] exportarStockInicialCSV(String fechaStr) {
        try {
            System.out.println("🔍 [SERVICE] Generando stock inicial CSV para fecha: " + fechaStr);
            
            StringBuilder csv = new StringBuilder();
            csv.append("STOCK INICIAL - ").append(fechaStr).append("\n");
            csv.append("Empresa ID,").append(obtenerEmpresaId()).append("\n");
            csv.append("Fecha,").append(fechaStr).append("\n");
            csv.append("Estado,FUNCIONANDO (CSV)\n");
            csv.append("\n");
            
            // Obtener movimientos del día
            MovimientoDiaDTO movimientos = obtenerMovimientosDia(fechaStr);
            if (movimientos != null && movimientos.getStockInicial() != null && movimientos.getStockInicial().getProductos() != null) {
                csv.append("Código,Descripción,Cantidad\n");
                for (var producto : movimientos.getStockInicial().getProductos()) {
                    csv.append(producto.getCodigoPersonalizado()).append(",");
                    csv.append(producto.getNombre()).append(",");
                    csv.append(producto.getCantidad()).append("\n");
                }
            } else {
                csv.append("No hay stock inicial para esta fecha\n");
            }
            
            byte[] csvBytes = csv.toString().getBytes("UTF-8");
            System.out.println("✅ [SERVICE] Stock inicial CSV generado. Tamaño: " + csvBytes.length + " bytes");
            return csvBytes;
            
        } catch (Exception e) {
            System.err.println("❌ [SERVICE] Error en stock inicial CSV: " + e.getMessage());
            e.printStackTrace();
            return "Error generando stock inicial".getBytes();
        }
    }

    /**
     * Obtener empresa ID del contexto de seguridad
     */
    /**
     * Exportar reporte completo del día a Excel con 6 pestañas
     * Pestañas: Ingresos, Planillas, Retornos, Pérdidas, Inventario, Stock Final
     */
    @Transactional(readOnly = true)
    public byte[] exportarReporteCompletoExcel(String fechaStr) {
        // VERSIÓN COMPLETA CON 6 PESTAÑAS
        try {
            return exportarReporteCompletoExcelCompleto(fechaStr);
        } catch (Exception e) {
            System.err.println("❌ [SERVICE] Error en reporte completo, usando versión simple: " + e.getMessage());
            // Fallback a versión simple si falla la completa
            try {
                return exportarReporteCompletoExcelSimple(fechaStr);
            } catch (Exception e2) {
                System.err.println("❌ [SERVICE] Error en reporte simple, usando versión CSV: " + e2.getMessage());
                // Fallback final a CSV
                return exportarReporteCompletoCSV(fechaStr);
            }
        }
    }
    
    /**
     * Versión simplificada del reporte para debug
     */
    @Transactional(readOnly = true)
    private byte[] exportarReporteCompletoExcelSimple(String fechaStr) {
        try {
            System.out.println("🔍 [SERVICE] Generando reporte SIMPLE para fecha: " + fechaStr);
            
            // Crear workbook simple con inicialización diferida
            org.apache.poi.xssf.usermodel.XSSFWorkbook workbook = null;
            try {
                // Inicialización diferida y segura
                workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook();
                Sheet sheet = workbook.createSheet("Prueba");
                
                // Datos básicos
                Row row1 = sheet.createRow(0);
                row1.createCell(0).setCellValue("Fecha");
                row1.createCell(1).setCellValue(fechaStr);
                
                Row row2 = sheet.createRow(1);
                row2.createCell(0).setCellValue("Empresa ID");
                row2.createCell(1).setCellValue(obtenerEmpresaId());
                
                Row row3 = sheet.createRow(2);
                row3.createCell(0).setCellValue("Estado");
                row3.createCell(1).setCellValue("FUNCIONANDO");
                
                // Establecer anchos de columnas fijos
                establecerAnchosColumnas(sheet, 20, 15);
                
                // Convertir a bytes
                try (var outputStream = new java.io.ByteArrayOutputStream()) {
                    workbook.write(outputStream);
                    byte[] excelBytes = outputStream.toByteArray();
                    
                    System.out.println("✅ [SERVICE] Reporte SIMPLE generado. Tamaño: " + excelBytes.length + " bytes");
                    return excelBytes;
                }
            } finally {
                if (workbook != null) {
                    try {
                        workbook.close();
                    } catch (Exception e) {
                        System.err.println("⚠️ [SERVICE] Error al cerrar workbook: " + e.getMessage());
                    }
                }
            }
            
        } catch (Exception e) {
            System.err.println("❌ [SERVICE] Error en reporte SIMPLE: " + e.getMessage());
            e.printStackTrace();
            return null;
        }
    }
    
    /**
     * Versión CSV del reporte como fallback final
     */
    @Transactional(readOnly = true)
    private byte[] exportarReporteCompletoCSV(String fechaStr) {
        try {
            System.out.println("🔍 [SERVICE] Generando reporte CSV para fecha: " + fechaStr);
            
            StringBuilder csv = new StringBuilder();
            csv.append("REPORTE COMPLETO - ").append(fechaStr).append("\n");
            csv.append("Empresa ID,").append(obtenerEmpresaId()).append("\n");
            csv.append("Fecha,").append(fechaStr).append("\n");
            csv.append("Estado,FUNCIONANDO (CSV)\n");
            csv.append("\n");
            
            // Obtener movimientos del día
            MovimientoDiaDTO movimientos = obtenerMovimientosDia(fechaStr);
            if (movimientos != null) {
                csv.append("=== INGRESOS ===\n");
                if (movimientos.getIngresos() != null && movimientos.getIngresos().getProductos() != null && !movimientos.getIngresos().getProductos().isEmpty()) {
                    csv.append("Código,Descripción,Cantidad\n");
                    for (var ingreso : movimientos.getIngresos().getProductos()) {
                        csv.append(ingreso.getCodigoPersonalizado()).append(",");
                        csv.append(ingreso.getNombre()).append(",");
                        csv.append(ingreso.getCantidad()).append("\n");
                    }
                } else {
                    csv.append("No hay ingresos para esta fecha\n");
                }
                
                csv.append("\n=== SALIDAS ===\n");
                if (movimientos.getSalidas() != null && movimientos.getSalidas().getProductos() != null && !movimientos.getSalidas().getProductos().isEmpty()) {
                    csv.append("Código,Descripción,Cantidad\n");
                    for (var salida : movimientos.getSalidas().getProductos()) {
                        csv.append(salida.getCodigoPersonalizado()).append(",");
                        csv.append(salida.getNombre()).append(",");
                        csv.append(salida.getCantidad()).append("\n");
                    }
                } else {
                    csv.append("No hay salidas para esta fecha\n");
                }
                
                csv.append("\n=== STOCK INICIAL ===\n");
                if (movimientos.getStockInicial() != null && movimientos.getStockInicial().getProductos() != null) {
                    csv.append("Código,Descripción,Cantidad\n");
                    for (var producto : movimientos.getStockInicial().getProductos()) {
                        csv.append(producto.getCodigoPersonalizado()).append(",");
                        csv.append(producto.getNombre()).append(",");
                        csv.append(producto.getCantidad()).append("\n");
                    }
                } else {
                    csv.append("No hay stock inicial para esta fecha\n");
                }
            } else {
                csv.append("No hay movimientos para esta fecha\n");
            }
            
            byte[] csvBytes = csv.toString().getBytes("UTF-8");
            System.out.println("✅ [SERVICE] Reporte CSV generado. Tamaño: " + csvBytes.length + " bytes");
            return csvBytes;
            
        } catch (Exception e) {
            System.err.println("❌ [SERVICE] Error en reporte CSV: " + e.getMessage());
            e.printStackTrace();
            return "Error generando reporte".getBytes();
        }
    }
    
    /**
     * Versión completa del reporte (temporalmente deshabilitada)
     */
    @Transactional(readOnly = true)
    public byte[] exportarReporteCompletoExcelCompleto(String fechaStr) {
        // Configurar sistema para modo headless ANTES de cualquier operación
        configurarModoHeadless();
        
        try {
            
            System.out.println("🔍 [SERVICE] Generando reporte completo para fecha: " + fechaStr);
            System.out.println("🔍 [SERVICE] Empresa ID: " + obtenerEmpresaId());
            
            // Obtener datos de movimientos
            MovimientoDiaDTO movimientos = obtenerMovimientosDia(fechaStr);
            System.out.println("🔍 [SERVICE] Movimientos obtenidos: " + (movimientos != null ? "SÍ" : "NO"));
            
            // Crear workbook con try-with-resources y inicialización segura
            org.apache.poi.xssf.usermodel.XSSFWorkbook workbook = null;
            try {
                // Inicialización diferida y segura
                workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook();
            
            // Crear estilos
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setFontHeightInPoints((short) 12);
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setBorderTop(BorderStyle.THIN);
            headerStyle.setBorderBottom(BorderStyle.THIN);
            headerStyle.setBorderLeft(BorderStyle.THIN);
            headerStyle.setBorderRight(BorderStyle.THIN);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            
            CellStyle dataStyle = workbook.createCellStyle();
            dataStyle.setBorderTop(BorderStyle.THIN);
            dataStyle.setBorderBottom(BorderStyle.THIN);
            dataStyle.setBorderLeft(BorderStyle.THIN);
            dataStyle.setBorderRight(BorderStyle.THIN);
            
            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleStyle.setFont(titleFont);
            titleStyle.setAlignment(HorizontalAlignment.CENTER);
            
            // 1. PESTAÑA INGRESOS
            crearPestanaIngresos(workbook, movimientos, fechaStr, headerStyle, dataStyle, titleStyle);
            
            // 2. PESTAÑA PLANILLAS
            crearPestanaPlanillas(workbook, movimientos, fechaStr, headerStyle, dataStyle, titleStyle);
            
            // 3. PESTAÑA RETORNOS
            crearPestanaRetornos(workbook, movimientos, fechaStr, headerStyle, dataStyle, titleStyle);
            
            // 4. PESTAÑA PÉRDIDAS
            crearPestanaPerdidas(workbook, movimientos, fechaStr, headerStyle, dataStyle, titleStyle);
            
            // 5. PESTAÑA INVENTARIO (antes Stock)
            crearPestanaStock(workbook, movimientos, fechaStr, headerStyle, dataStyle, titleStyle);
            
            // 6. PESTAÑA STOCK FINAL (nueva)
            crearPestanaStockFinal(workbook, movimientos, fechaStr, headerStyle, dataStyle, titleStyle);
            
                // Convertir a bytes
                try (var outputStream = new java.io.ByteArrayOutputStream()) {
                    workbook.write(outputStream);
                    byte[] excelBytes = outputStream.toByteArray();
                    
                    System.out.println("✅ [SERVICE] Reporte completo generado exitosamente. Tamaño: " + excelBytes.length + " bytes");
                    
                    return excelBytes;
                }
            } finally {
                if (workbook != null) {
                    try {
                        workbook.close();
                    } catch (Exception e) {
                        System.err.println("⚠️ [SERVICE] Error al cerrar workbook: " + e.getMessage());
                    }
                }
            }
            
        } catch (Exception e) {
            System.err.println("❌ [SERVICE] Error al generar reporte completo: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error al generar reporte completo", e);
        }
    }
    
    /**
     * Crear pestaña de Ingresos
     */
    private void crearPestanaIngresos(Workbook workbook, MovimientoDiaDTO movimientos, String fechaStr, 
                                    CellStyle headerStyle, CellStyle dataStyle, CellStyle titleStyle) {
        try {
            System.out.println("🔍 [INGRESOS] Iniciando creación de pestaña Ingresos");
            Sheet sheet = workbook.createSheet("Ingresos");
            
            // Título
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("INGRESOS - " + fechaStr);
            titleCell.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 10));
            
            // Obtener remitos de ingresos del día
            System.out.println("🔍 [INGRESOS] Obteniendo remitos para fecha: " + fechaStr);
            List<RemitoIngreso> remitos = remitoIngresoRepository.findByRangoFechasAndEmpresaId(
                LocalDate.parse(fechaStr).atStartOfDay(),
                LocalDate.parse(fechaStr).atTime(23, 59, 59),
                obtenerEmpresaId()
            );
            System.out.println("🔍 [INGRESOS] Remitos encontrados: " + remitos.size());
        
        // Obtener TODOS los productos del stock inicial (igual que en el modal)
        Set<Producto> productosUnicos = new HashSet<>();
        if (movimientos.getStockInicial() != null && movimientos.getStockInicial().getProductos() != null) {
            for (MovimientoDiaDTO.ProductoStockDTO productoStock : movimientos.getStockInicial().getProductos()) {
                Producto producto = productoRepository.findById(productoStock.getId()).orElse(null);
                if (producto != null) {
                    productosUnicos.add(producto);
                }
            }
        }
        
        // Agregar productos de remitos que no estén en stock inicial
        for (RemitoIngreso remito : remitos) {
            List<DetalleRemitoIngreso> detalles = detalleRemitoIngresoRepository.findByRemitoIngresoIdOrderByFechaCreacionAsc(remito.getId());
            for (DetalleRemitoIngreso detalle : detalles) {
                productosUnicos.add(detalle.getProducto());
            }
        }
        
        // Crear encabezados
        Row headerRow = sheet.createRow(2);
        headerRow.createCell(0).setCellValue("Código");
        headerRow.createCell(1).setCellValue("Descripción");
        headerRow.createCell(2).setCellValue("Cantidad Inicial");
        
        // Encabezados de remitos
        int colIndex = 3;
        for (RemitoIngreso remito : remitos) {
            Cell remitoCell = headerRow.createCell(colIndex++);
            remitoCell.setCellValue(remito.getNumeroRemito());
            remitoCell.setCellStyle(headerStyle);
        }
        
        // Aplicar estilos a encabezados
        for (int i = 0; i < colIndex; i++) {
            headerRow.getCell(i).setCellStyle(headerStyle);
        }
        
        // Fila de observaciones (transporte) - debajo de los números de remito
        Row obsRow = sheet.createRow(3);
        obsRow.createCell(0).setCellValue("");
        obsRow.createCell(1).setCellValue("");
        obsRow.createCell(2).setCellValue("");
        
        // Observaciones de remitos (transporte)
        System.out.println("🔍 [INGRESOS] Procesando observaciones de " + remitos.size() + " remitos");
        int obsColIndex = 3;
        for (RemitoIngreso remito : remitos) {
            Cell obsCell = obsRow.createCell(obsColIndex++);
            String observacion = "";
            try {
                System.out.println("🔍 [INGRESOS] Procesando remito: " + remito.getNumeroRemito());
                // Intentar obtener observaciones de diferentes formas
                if (remito.getObservaciones() != null) {
                    observacion = remito.getObservaciones();
                    System.out.println("🔍 [INGRESOS] Observación encontrada: " + observacion);
                } else {
                    observacion = "";
                    System.out.println("🔍 [INGRESOS] Sin observación para remito: " + remito.getNumeroRemito());
                }
            } catch (Exception e) {
                System.err.println("❌ [INGRESOS] Error al obtener observaciones del remito " + remito.getNumeroRemito() + ": " + e.getMessage());
                e.printStackTrace();
                observacion = "";
            }
            obsCell.setCellValue(observacion);
            obsCell.setCellStyle(headerStyle);
        }
        
        // Datos de productos
        int rowIndex = 4;
        for (Producto producto : productosUnicos) {
            Row dataRow = sheet.createRow(rowIndex++);
            
            // Código personalizado
            dataRow.createCell(0).setCellValue(producto.getCodigoPersonalizado() != null ? producto.getCodigoPersonalizado() : "");
            
            // Descripción
            dataRow.createCell(1).setCellValue(producto.getNombre());
            
            // Cantidad inicial
            int cantidadInicial = 0;
            if (movimientos.getStockInicial() != null && movimientos.getStockInicial().getProductos() != null) {
                for (MovimientoDiaDTO.ProductoStockDTO productoStock : movimientos.getStockInicial().getProductos()) {
                    if (productoStock.getId().equals(producto.getId())) {
                        cantidadInicial = productoStock.getCantidadInicial() != null ? productoStock.getCantidadInicial() : 0;
                        break;
                    }
                }
            }
            dataRow.createCell(2).setCellValue(cantidadInicial);
            
            // Cantidades por remito
            colIndex = 3;
            for (RemitoIngreso remito : remitos) {
                int cantidad = 0;
                List<DetalleRemitoIngreso> detalles = detalleRemitoIngresoRepository.findByRemitoIngresoIdOrderByFechaCreacionAsc(remito.getId());
                for (DetalleRemitoIngreso detalle : detalles) {
                    if (detalle.getProducto().getId().equals(producto.getId())) {
                        cantidad += detalle.getCantidad();
                    }
                }
                dataRow.createCell(colIndex++).setCellValue(cantidad);
            }
            
            // Aplicar estilos a la fila
            for (int i = 0; i < colIndex; i++) {
                if (dataRow.getCell(i) != null) {
                    dataRow.getCell(i).setCellStyle(dataStyle);
                }
            }
        }
        
        // Crear estilo para la fila de totales
        CellStyle totalStyle = workbook.createCellStyle();
        Font totalFont = workbook.createFont();
        totalFont.setBold(true);
        totalStyle.setFont(totalFont);
        totalStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        totalStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        totalStyle.setBorderTop(BorderStyle.THICK);
        totalStyle.setBorderBottom(BorderStyle.THICK);
        totalStyle.setBorderLeft(BorderStyle.THIN);
        totalStyle.setBorderRight(BorderStyle.THIN);
        
        // Agregar fila de totales solo si hay productos
        if (rowIndex > 3) { // Verificar que hay al menos una fila de datos (rowIndex 3 = primera fila de datos)
            Row totalRow = sheet.createRow(rowIndex);
            totalRow.createCell(0).setCellValue("TOTALES:");
            totalRow.createCell(1).setCellValue("");
            
            // Total de Stock Inicial (columna C)
            Cell stockInicialTotalCell = totalRow.createCell(2);
            String stockInicialFormula = "SUM(C4:C" + (rowIndex - 1) + ")";
            stockInicialTotalCell.setCellFormula(stockInicialFormula);
            
            // Totales por remito
            colIndex = 3;
            for (int i = 0; i < remitos.size(); i++) {
                Cell totalCell = totalRow.createCell(colIndex);
                String totalFormula = "SUM(" + getColumnLetter(colIndex) + "4:" + getColumnLetter(colIndex) + (rowIndex - 1) + ")";
                totalCell.setCellFormula(totalFormula);
                colIndex++;
            }
            
            // Aplicar estilos a la fila de totales
            for (int i = 0; i < colIndex; i++) {
                if (totalRow.getCell(i) != null) {
                    totalRow.getCell(i).setCellStyle(totalStyle);
                }
            }
        }
        
        // Establecer anchos de columnas fijos (evita errores de fuentes en headless)
        establecerAnchosColumnas(sheet, 15, 30, 12, 15, 15); // Ajustar según número de columnas
        
        // Congelar paneles para mantener encabezados visibles
        sheet.createFreezePane(0, 4);
        
        System.out.println("✅ [INGRESOS] Pestaña Ingresos creada exitosamente con fila de totales");
        
        } catch (Exception e) {
            System.err.println("❌ [INGRESOS] Error al crear pestaña Ingresos: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    /**
     * Crear pestaña de Planillas
     */
    private void crearPestanaPlanillas(Workbook workbook, MovimientoDiaDTO movimientos, String fechaStr, 
                                     CellStyle headerStyle, CellStyle dataStyle, CellStyle titleStyle) {
        Sheet sheet = workbook.createSheet("Planillas");
        
        // Título
        Row titleRow = sheet.createRow(0);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("PLANILLAS - " + fechaStr);
        titleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 10));
        
        // Obtener planillas del día
        List<PlanillaPedido> planillas = planillaPedidoRepository.findByEmpresaIdAndFechaPlanillaBetweenOrderByFechaCreacionDesc(
            obtenerEmpresaId(), 
            LocalDate.parse(fechaStr).atStartOfDay(),
            LocalDate.parse(fechaStr).atTime(23, 59, 59)
        );
        
        // Obtener TODOS los productos de la empresa (no solo los que tienen movimientos)
        List<Producto> todosLosProductos = productoRepository.findByEmpresaIdAndActivoTrue(obtenerEmpresaId());
        // Ordenar por código personalizado
        todosLosProductos.sort((p1, p2) -> {
            String codigo1 = p1.getCodigoPersonalizado() != null ? p1.getCodigoPersonalizado() : "";
            String codigo2 = p2.getCodigoPersonalizado() != null ? p2.getCodigoPersonalizado() : "";
            return codigo1.compareTo(codigo2);
        });
        
        // Crear encabezados
        Row headerRow = sheet.createRow(2);
        headerRow.createCell(0).setCellValue("Código");
        headerRow.createCell(1).setCellValue("Descripción");
        
        // Encabezados de planillas
        int colIndex = 2;
        for (PlanillaPedido planilla : planillas) {
            Cell planillaCell = headerRow.createCell(colIndex++);
            planillaCell.setCellValue(planilla.getNumeroPlanilla());
            planillaCell.setCellStyle(headerStyle);
        }
        
        // Aplicar estilos a encabezados
        for (int i = 0; i < colIndex; i++) {
            headerRow.getCell(i).setCellStyle(headerStyle);
        }
        
        // Crear fila de transportistas debajo de los encabezados de planillas
        Row transportistaRow = sheet.createRow(3);
        transportistaRow.createCell(0).setCellValue(""); // Celda vacía para código
        transportistaRow.createCell(1).setCellValue(""); // Celda vacía para descripción
        
        // Transportistas por planilla
        colIndex = 2;
        for (PlanillaPedido planilla : planillas) {
            Cell transportistaCell = transportistaRow.createCell(colIndex++);
            String transportista = planilla.getTransporte() != null && !planilla.getTransporte().trim().isEmpty() 
                ? planilla.getTransporte() 
                : "Sin transportista";
            transportistaCell.setCellValue(transportista);
            transportistaCell.setCellStyle(headerStyle);
        }
        
        // Aplicar estilos a la fila de transportistas
        for (int i = 0; i < colIndex; i++) {
            if (transportistaRow.getCell(i) != null) {
                transportistaRow.getCell(i).setCellStyle(headerStyle);
            }
        }
        
        // Datos de TODOS los productos
        int rowIndex = 4; // Aumentado porque agregamos la fila de transportistas
        for (Producto producto : todosLosProductos) {
            Row dataRow = sheet.createRow(rowIndex++);
            
            // Código personalizado
            dataRow.createCell(0).setCellValue(producto.getCodigoPersonalizado() != null ? producto.getCodigoPersonalizado() : "");
            
            // Descripción
            dataRow.createCell(1).setCellValue(producto.getNombre());
            
            // Cantidades por planilla (solo se llenan si el producto tuvo movimientos)
            colIndex = 2;
            for (PlanillaPedido planilla : planillas) {
                int cantidad = 0;
                List<DetallePlanillaPedido> detalles = detallePlanillaPedidoRepository.findByPlanillaPedidoIdOrderByFechaCreacionAsc(planilla.getId());
                for (DetallePlanillaPedido detalle : detalles) {
                    if (detalle.getProducto().getId().equals(producto.getId())) {
                        cantidad += detalle.getCantidad();
                    }
                }
                // Solo mostrar cantidad si es mayor a 0, sino dejar vacío
                if (cantidad > 0) {
                    dataRow.createCell(colIndex).setCellValue(cantidad);
                } else {
                    dataRow.createCell(colIndex).setCellValue("");
                }
                colIndex++;
            }
            
            // Aplicar estilos a la fila
            for (int i = 0; i < colIndex; i++) {
                if (dataRow.getCell(i) != null) {
                    dataRow.getCell(i).setCellStyle(dataStyle);
                }
            }
        }
        
        // Agregar fila de totales
        Row totalRow = sheet.createRow(rowIndex);
        totalRow.createCell(0).setCellValue("TOTALES:");
        totalRow.createCell(1).setCellValue("");
        
        // Totales por planilla
        colIndex = 2;
        for (int i = 0; i < planillas.size(); i++) {
            Cell totalCell = totalRow.createCell(colIndex++);
            String totalFormula = "SUM(" + getColumnLetter(colIndex - 1) + "4:" + getColumnLetter(colIndex - 1) + (rowIndex - 1) + ")";
            totalCell.setCellFormula(totalFormula);
        }
        
        // Estilo para la fila de totales
        CellStyle totalStyle = workbook.createCellStyle();
        Font totalFont = workbook.createFont();
        totalFont.setBold(true);
        totalStyle.setFont(totalFont);
        totalStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        totalStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        totalStyle.setBorderTop(BorderStyle.THICK);
        totalStyle.setBorderBottom(BorderStyle.THICK);
        totalStyle.setBorderLeft(BorderStyle.THIN);
        totalStyle.setBorderRight(BorderStyle.THIN);
        
        for (int i = 0; i < colIndex; i++) {
            if (totalRow.getCell(i) != null) {
                totalRow.getCell(i).setCellStyle(totalStyle);
            }
        }
        
        // Establecer anchos de columnas fijos (evita errores de fuentes en headless)
        establecerAnchosColumnas(sheet, 15, 30, 12, 15, 15); // Ajustar según número de columnas
        
        // Congelar paneles para mantener encabezados visibles (incluyendo la fila de transportistas)
        sheet.createFreezePane(0, 4);
    }
    
    /**
     * Crear pestaña de Retornos
     */
    private void crearPestanaRetornos(Workbook workbook, MovimientoDiaDTO movimientos, String fechaStr, 
                                    CellStyle headerStyle, CellStyle dataStyle, CellStyle titleStyle) {
        Sheet sheet = workbook.createSheet("Retornos");
        
        // Título
        Row titleRow = sheet.createRow(0);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("RETORNOS - " + fechaStr);
        titleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 10));
        
        // Obtener planillas de devolución del día
        List<PlanillaDevolucion> planillas = planillaDevolucionRepository.findByEmpresaIdAndFechaPlanillaBetweenOrderByFechaCreacionDesc(
            obtenerEmpresaId(), 
            LocalDate.parse(fechaStr).atStartOfDay(),
            LocalDate.parse(fechaStr).atTime(23, 59, 59)
        );
        
        // Obtener TODOS los productos de la empresa (no solo los que tienen movimientos)
        List<Producto> todosLosProductos = productoRepository.findByEmpresaIdAndActivoTrue(obtenerEmpresaId());
        // Ordenar por código personalizado
        todosLosProductos.sort((p1, p2) -> {
            String codigo1 = p1.getCodigoPersonalizado() != null ? p1.getCodigoPersonalizado() : "";
            String codigo2 = p2.getCodigoPersonalizado() != null ? p2.getCodigoPersonalizado() : "";
            return codigo1.compareTo(codigo2);
        });
        
        // Crear encabezados
        Row headerRow = sheet.createRow(2);
        headerRow.createCell(0).setCellValue("Código");
        headerRow.createCell(1).setCellValue("Descripción");
        
        // Encabezados de planillas de devolución
        int colIndex = 2;
        for (PlanillaDevolucion planilla : planillas) {
            Cell planillaCell = headerRow.createCell(colIndex++);
            planillaCell.setCellValue(planilla.getNumeroPlanilla());
            planillaCell.setCellStyle(headerStyle);
        }
        
        // Aplicar estilos a encabezados
        for (int i = 0; i < colIndex; i++) {
            headerRow.getCell(i).setCellStyle(headerStyle);
        }
        
        // Crear fila de transportistas debajo de los encabezados de planillas de devolución
        Row transportistaRow = sheet.createRow(3);
        transportistaRow.createCell(0).setCellValue(""); // Celda vacía para código
        transportistaRow.createCell(1).setCellValue(""); // Celda vacía para descripción
        
        // Transportistas por planilla de devolución
        colIndex = 2;
        for (PlanillaDevolucion planilla : planillas) {
            Cell transportistaCell = transportistaRow.createCell(colIndex++);
            String transportista = planilla.getTransporte() != null && !planilla.getTransporte().trim().isEmpty() 
                ? planilla.getTransporte() 
                : "Sin transportista";
            transportistaCell.setCellValue(transportista);
            transportistaCell.setCellStyle(headerStyle);
        }
        
        // Aplicar estilos a la fila de transportistas
        for (int i = 0; i < colIndex; i++) {
            if (transportistaRow.getCell(i) != null) {
                transportistaRow.getCell(i).setCellStyle(headerStyle);
            }
        }
        
        // Datos de TODOS los productos
        int rowIndex = 4; // Aumentado porque agregamos la fila de transportistas
        for (Producto producto : todosLosProductos) {
            Row dataRow = sheet.createRow(rowIndex++);
            
            // Código personalizado
            dataRow.createCell(0).setCellValue(producto.getCodigoPersonalizado() != null ? producto.getCodigoPersonalizado() : "");
            
            // Descripción
            dataRow.createCell(1).setCellValue(producto.getNombre());
            
            // Cantidades por planilla de devolución (solo se llenan si el producto tuvo movimientos)
            colIndex = 2;
            for (PlanillaDevolucion planilla : planillas) {
                int cantidad = 0;
                List<DetallePlanillaDevolucion> detalles = detallePlanillaDevolucionRepository.findByPlanillaDevolucionIdOrderByFechaCreacionAsc(planilla.getId());
                for (DetallePlanillaDevolucion detalle : detalles) {
                    if (detalle.getProducto().getId().equals(producto.getId())) {
                        // Solo sumar productos en BUEN_ESTADO para el reporte
                        // Si no tiene estado definido (productos existentes), considerarlo como BUEN_ESTADO
                        DetallePlanillaDevolucion.EstadoProducto estado = detalle.getEstadoProducto();
                        if (estado == null || estado == DetallePlanillaDevolucion.EstadoProducto.BUEN_ESTADO) {
                            cantidad += detalle.getCantidad();
                        }
                    }
                }
                // Solo mostrar cantidad si es mayor a 0, sino dejar vacío
                if (cantidad > 0) {
                    dataRow.createCell(colIndex).setCellValue(cantidad);
                } else {
                    dataRow.createCell(colIndex).setCellValue("");
                }
                colIndex++;
            }
            
            // Aplicar estilos a la fila
            for (int i = 0; i < colIndex; i++) {
                if (dataRow.getCell(i) != null) {
                    dataRow.getCell(i).setCellStyle(dataStyle);
                }
            }
        }
        
        // Agregar fila de totales solo si hay productos
        if (rowIndex > 3) { // Verificar que hay al menos una fila de datos
            Row totalRow = sheet.createRow(rowIndex);
            totalRow.createCell(0).setCellValue("TOTALES:");
            totalRow.createCell(1).setCellValue("");
            
            // Totales por planilla de devolución
            colIndex = 2;
            for (int i = 0; i < planillas.size(); i++) {
                Cell totalCell = totalRow.createCell(colIndex++);
                String totalFormula = "SUM(" + getColumnLetter(colIndex - 1) + "4:" + getColumnLetter(colIndex - 1) + (rowIndex - 1) + ")";
                totalCell.setCellFormula(totalFormula);
            }
            
            // Estilo para la fila de totales
            CellStyle totalStyle = workbook.createCellStyle();
            Font totalFont = workbook.createFont();
            totalFont.setBold(true);
            totalStyle.setFont(totalFont);
            totalStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            totalStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            totalStyle.setBorderTop(BorderStyle.THICK);
            totalStyle.setBorderBottom(BorderStyle.THICK);
            totalStyle.setBorderLeft(BorderStyle.THIN);
            totalStyle.setBorderRight(BorderStyle.THIN);
            
            for (int i = 0; i < colIndex; i++) {
                if (totalRow.getCell(i) != null) {
                    totalRow.getCell(i).setCellStyle(totalStyle);
                }
            }
        }
        
        // Establecer anchos de columnas fijos (evita errores de fuentes en headless)
        establecerAnchosColumnas(sheet, 15, 30, 12, 15, 15); // Ajustar según número de columnas
        
        // Congelar paneles para mantener encabezados visibles (incluyendo la fila de transportistas)
        sheet.createFreezePane(0, 4);
    }
    
    /**
     * Crear pestaña de Pérdidas
     */
    private void crearPestanaPerdidas(Workbook workbook, MovimientoDiaDTO movimientos, String fechaStr, 
                                    CellStyle headerStyle, CellStyle dataStyle, CellStyle titleStyle) {
        Sheet sheet = workbook.createSheet("Pérdidas");
        
        // Título
        Row titleRow = sheet.createRow(0);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("PÉRDIDAS - " + fechaStr);
        titleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 3));
        
        // Obtener roturas y pérdidas del día
        List<RoturaPerdida> perdidas = roturaPerdidaRepository.findByEmpresaIdAndFechaBetweenOrderByFechaCreacionDesc(
            obtenerEmpresaId(), 
            LocalDate.parse(fechaStr).atStartOfDay(),
            LocalDate.parse(fechaStr).atTime(23, 59, 59)
        );
        System.out.println("🔍 [PÉRDIDAS] Total pérdidas encontradas: " + perdidas.size());
        
        // Crear encabezados
        Row headerRow = sheet.createRow(2);
        headerRow.createCell(0).setCellValue("Código");
        headerRow.createCell(1).setCellValue("Descripción");
        headerRow.createCell(2).setCellValue("Cantidad Pérdida");
        headerRow.createCell(3).setCellValue("Observación");
        
        // Aplicar estilos a encabezados
        for (int i = 0; i < 4; i++) {
            headerRow.getCell(i).setCellStyle(headerStyle);
        }
        
        // Datos de pérdidas
        int rowIndex = 3;
        for (RoturaPerdida perdida : perdidas) {
            Row dataRow = sheet.createRow(rowIndex++);
            
            // Código personalizado
            dataRow.createCell(0).setCellValue(perdida.getProducto().getCodigoPersonalizado() != null ? 
                perdida.getProducto().getCodigoPersonalizado() : "");
            
            // Descripción
            dataRow.createCell(1).setCellValue(perdida.getProducto().getNombre());
            
            // Cantidad pérdida
            Cell cantidadCell = dataRow.createCell(2);
            cantidadCell.setCellValue(perdida.getCantidad());
            cantidadCell.setCellType(CellType.NUMERIC); // Asegurar que sea tratado como número
            System.out.println("🔍 [PÉRDIDAS] Agregando pérdida - Fila: " + (rowIndex-1) + ", Cantidad: " + perdida.getCantidad());
            
            // Observación
            dataRow.createCell(3).setCellValue(perdida.getObservaciones() != null ? perdida.getObservaciones() : "");
            
            // Aplicar estilos a la fila
            for (int i = 0; i < 4; i++) {
                if (dataRow.getCell(i) != null) {
                    dataRow.getCell(i).setCellStyle(dataStyle);
                }
            }
        }
        
        // Agregar fila de totales solo si hay pérdidas
        if (rowIndex > 3) { // Verificar que hay al menos una fila de datos
            Row totalRow = sheet.createRow(rowIndex);
            totalRow.createCell(0).setCellValue("TOTALES:");
            totalRow.createCell(1).setCellValue("");
            
            // Total de cantidad pérdida (columna C)
            Cell totalCantidadCell = totalRow.createCell(2);
            String totalCantidadFormula = "SUM(C3:C" + (rowIndex - 1) + ")";
            totalCantidadCell.setCellFormula(totalCantidadFormula);
            System.out.println("🔍 [PÉRDIDAS] Fórmula de totales: " + totalCantidadFormula + " (rowIndex: " + rowIndex + ")");
            
            totalRow.createCell(3).setCellValue(""); // Columna de observación vacía
            
            // Estilo para la fila de totales
            CellStyle totalStyle = workbook.createCellStyle();
            Font totalFont = workbook.createFont();
            totalFont.setBold(true);
            totalStyle.setFont(totalFont);
            totalStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            totalStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            totalStyle.setBorderTop(BorderStyle.THICK);
            totalStyle.setBorderBottom(BorderStyle.THICK);
            totalStyle.setBorderLeft(BorderStyle.THIN);
            totalStyle.setBorderRight(BorderStyle.THIN);
            
            // Aplicar estilos a la fila de totales
            for (int i = 0; i < 4; i++) {
                if (totalRow.getCell(i) != null) {
                    totalRow.getCell(i).setCellStyle(totalStyle);
                }
            }
        }
        
        // Establecer anchos de columnas fijos (evita errores de fuentes en headless)
        establecerAnchosColumnas(sheet, 15, 30, 12, 15);
    }
    
    /**
     * Crear pestaña de Inventario
     */
    private void crearPestanaStock(Workbook workbook, MovimientoDiaDTO movimientos, String fechaStr, 
                                 CellStyle headerStyle, CellStyle dataStyle, CellStyle titleStyle) {
        Sheet sheet = workbook.createSheet("Inventario");
        
        // Título
        Row titleRow = sheet.createRow(0);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("INVENTARIO POR SECTORES - " + fechaStr);
        titleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 9)); // Aumentado para 9 columnas
        
        // Información sobre el uso de fórmulas
        Row infoRow = sheet.createRow(1);
        Cell infoCell = infoRow.createCell(0);
        infoCell.setCellValue("💡 Ingrese el recuento real en cada sector - la diferencia total se calculará automáticamente");
        CellStyle infoStyle = workbook.createCellStyle();
        Font infoFont = workbook.createFont();
        infoFont.setItalic(true);
        infoFont.setFontHeightInPoints((short) 10);
        infoStyle.setFont(infoFont);
        infoStyle.setFillForegroundColor(IndexedColors.LIGHT_YELLOW.getIndex());
        infoStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        infoCell.setCellStyle(infoStyle);
        sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, 9)); // Aumentado para 9 columnas
        
        // Definir sectores
        String[] sectores = {"Esmeralda", "Catena", "Tinglado", "1er Piso", "Jaula", "Cosechas Antiguas", "Sotano"};
        
        // Crear encabezados
        Row headerRow = sheet.createRow(2);
        headerRow.createCell(0).setCellValue("Código");
        headerRow.createCell(1).setCellValue("Descripción");
        headerRow.createCell(2).setCellValue("Saldo de Cuenta");
        
        // Encabezados de sectores
        int colIndex = 3;
        for (String sector : sectores) {
            headerRow.createCell(colIndex++).setCellValue(sector);
        }
        
        // Columna de diferencia total
        headerRow.createCell(colIndex).setCellValue("Diferencia Total");
        
        // Aplicar estilos a encabezados
        for (int i = 0; i <= colIndex; i++) {
            headerRow.getCell(i).setCellStyle(headerStyle);
        }
        
        // Obtener productos del balance final
        List<MovimientoDiaDTO.ProductoStockDTO> productos = new ArrayList<>();
        if (movimientos.getBalanceFinal() != null && movimientos.getBalanceFinal().getProductos() != null) {
            productos = movimientos.getBalanceFinal().getProductos();
        }
        
        // Datos de stock
        int rowIndex = 3;
        for (MovimientoDiaDTO.ProductoStockDTO productoStock : productos) {
            Row dataRow = sheet.createRow(rowIndex++);
            
            // Código personalizado
            dataRow.createCell(0).setCellValue(productoStock.getCodigoPersonalizado() != null ? 
                productoStock.getCodigoPersonalizado() : "");
            
            // Descripción
            dataRow.createCell(1).setCellValue(productoStock.getNombre());
            
            // Saldo de cuenta (cantidad final) - Columna C
            int saldoCuenta = productoStock.getCantidad() != null ? productoStock.getCantidad() : 0;
            Cell saldoCell = dataRow.createCell(2);
            saldoCell.setCellValue(saldoCuenta);
            saldoCell.setCellStyle(dataStyle);
            
            // Crear estilo para celdas de sectores (editable)
            CellStyle sectorStyle = workbook.createCellStyle();
            sectorStyle.cloneStyleFrom(dataStyle);
            sectorStyle.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
            sectorStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            
            // Columnas de sectores (inicializadas en 0, editables)
            int currentColIndex = 3;
            for (int i = 0; i < sectores.length; i++) {
                Cell sectorCell = dataRow.createCell(currentColIndex++);
                sectorCell.setCellValue(0); // Inicializar en 0
                sectorCell.setCellStyle(sectorStyle);
            }
            
            // Diferencia total (suma de todos los sectores - saldo) - Columna final con FÓRMULA
            Cell diferenciaCell = dataRow.createCell(currentColIndex);
            
            // Crear fórmula que sume todas las columnas de sectores menos el saldo de cuenta
            // Fórmula: =SUM(D3:J3)-C3 (Suma de todos los sectores - Saldo de Cuenta)
            String sectorColumns = "D" + rowIndex + ":J" + rowIndex; // D a J = 7 sectores
            String formula = "SUM(" + sectorColumns + ")-C" + rowIndex;
            diferenciaCell.setCellFormula(formula);
            
            // Estilo para la celda de diferencia
            CellStyle diferenciaStyle = workbook.createCellStyle();
            diferenciaStyle.cloneStyleFrom(dataStyle);
            diferenciaStyle.setFillForegroundColor(IndexedColors.LIGHT_ORANGE.getIndex());
            diferenciaStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            diferenciaCell.setCellStyle(diferenciaStyle);
            
            // Aplicar estilos a las celdas de texto
            dataRow.getCell(0).setCellStyle(dataStyle);
            dataRow.getCell(1).setCellStyle(dataStyle);
        }
        
        // Agregar fila de totales
        Row totalRow = sheet.createRow(rowIndex);
        totalRow.createCell(0).setCellValue("TOTALES:");
        totalRow.createCell(1).setCellValue("");
        
        // Total de saldo de cuenta
        Cell totalSaldoCell = totalRow.createCell(2);
        String totalSaldoFormula = "SUM(C3:C" + (rowIndex - 1) + ")";
        totalSaldoCell.setCellFormula(totalSaldoFormula);
        
        // Totales por sector
        int totalColIndex = 3;
        for (int i = 0; i < sectores.length; i++) {
            Cell totalSectorCell = totalRow.createCell(totalColIndex++);
            String colLetter = getColumnLetter(totalColIndex - 1);
            String totalSectorFormula = "SUM(" + colLetter + "3:" + colLetter + (rowIndex - 1) + ")";
            totalSectorCell.setCellFormula(totalSectorFormula);
        }
        
        // Total de diferencia
        Cell totalDiferenciaCell = totalRow.createCell(totalColIndex);
        String totalDiferenciaFormula = "SUM(K3:K" + (rowIndex - 1) + ")"; // K = columna de diferencia total
        totalDiferenciaCell.setCellFormula(totalDiferenciaFormula);
        
        // Estilo para la fila de totales
        CellStyle totalStyle = workbook.createCellStyle();
        Font totalFont = workbook.createFont();
        totalFont.setBold(true);
        totalStyle.setFont(totalFont);
        totalStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        totalStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        totalStyle.setBorderTop(BorderStyle.THICK);
        totalStyle.setBorderBottom(BorderStyle.THICK);
        totalStyle.setBorderLeft(BorderStyle.THIN);
        totalStyle.setBorderRight(BorderStyle.THIN);
        
        for (int i = 0; i <= totalColIndex; i++) {
            if (totalRow.getCell(i) != null) {
                totalRow.getCell(i).setCellStyle(totalStyle);
            }
        }
        
        // Establecer anchos de columnas fijos (evita errores de fuentes en headless)
        // Ajustado para 10 columnas: Código, Descripción, Saldo, 7 sectores, Diferencia
        establecerAnchosColumnas(sheet, 15, 30, 12, 10, 10, 10, 10, 10, 10, 10, 15);
        
        // Congelar paneles para mantener encabezados visibles
        sheet.createFreezePane(0, 3);
    }

    /**
     * Crear pestaña de Stock Final (formato compatible con importación)
     */
    private void crearPestanaStockFinal(Workbook workbook, MovimientoDiaDTO movimientos, String fechaStr, 
                                      CellStyle headerStyle, CellStyle dataStyle, CellStyle titleStyle) {
        Sheet sheet = workbook.createSheet("Stock Final");
        
        // Título
        Row titleRow = sheet.createRow(0);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue("STOCK FINAL - " + fechaStr);
        titleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 3));
        
        // Información sobre el uso
        Row infoRow = sheet.createRow(1);
        Cell infoCell = infoRow.createCell(0);
        infoCell.setCellValue("💡 Esta pestaña contiene el stock real después del recuento físico - Formato compatible con importación");
        CellStyle infoStyle = workbook.createCellStyle();
        Font infoFont = workbook.createFont();
        infoFont.setItalic(true);
        infoFont.setFontHeightInPoints((short) 10);
        infoStyle.setFont(infoFont);
        infoStyle.setFillForegroundColor(IndexedColors.LIGHT_YELLOW.getIndex());
        infoStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        infoCell.setCellStyle(infoStyle);
        sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, 3));
        
        // Crear encabezados (formato de importación simplificado)
        Row headerRow = sheet.createRow(2);
        headerRow.createCell(0).setCellValue("Producto");
        headerRow.createCell(1).setCellValue("Descripción");
        headerRow.createCell(2).setCellValue("Stock");
        
        // Aplicar estilos a encabezados
        for (int i = 0; i < 3; i++) {
            headerRow.getCell(i).setCellStyle(headerStyle);
        }
        
        // Obtener productos del balance final
        List<MovimientoDiaDTO.ProductoStockDTO> productos = new ArrayList<>();
        if (movimientos.getBalanceFinal() != null && movimientos.getBalanceFinal().getProductos() != null) {
            productos = movimientos.getBalanceFinal().getProductos();
        }
        
        // Datos de stock final
        int rowIndex = 3;
        for (MovimientoDiaDTO.ProductoStockDTO productoStock : productos) {
            Row dataRow = sheet.createRow(rowIndex++);
            
            // Producto (Código personalizado)
            dataRow.createCell(0).setCellValue(productoStock.getCodigoPersonalizado() != null ? 
                productoStock.getCodigoPersonalizado() : "");
            
            // Descripción
            dataRow.createCell(1).setCellValue(productoStock.getNombre());
            
            // Stock (conectado dinámicamente con la pestaña Inventario)
            // Fórmula que suma todos los sectores de la pestaña Inventario
            Cell stockCell = dataRow.createCell(2);
            // Fórmula: =SUM(Inventario!D{rowIndex}:Inventario!J{rowIndex}) (suma de todos los sectores)
            String formula = "SUM(Inventario!D" + rowIndex + ":Inventario!J" + rowIndex + ")";
            stockCell.setCellFormula(formula);
            
            // Estilo para la celda de stock (conectada dinámicamente)
            CellStyle stockStyle = workbook.createCellStyle();
            stockStyle.cloneStyleFrom(dataStyle);
            stockStyle.setFillForegroundColor(IndexedColors.LIGHT_YELLOW.getIndex());
            stockStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            stockCell.setCellStyle(stockStyle);
            
            // Aplicar estilos a las celdas de texto
            dataRow.getCell(0).setCellStyle(dataStyle);
            dataRow.getCell(1).setCellStyle(dataStyle);
        }
        
        // Agregar fila de totales
        Row totalRow = sheet.createRow(rowIndex);
        totalRow.createCell(0).setCellValue("TOTALES:");
        totalRow.createCell(1).setCellValue("");
        
        // Total de stock (conectado dinámicamente)
        Cell totalStockCell = totalRow.createCell(2);
        String totalStockFormula = "SUM(C3:C" + (rowIndex - 1) + ")";
        totalStockCell.setCellFormula(totalStockFormula);
        
        // Estilo para la fila de totales
        CellStyle totalStyle = workbook.createCellStyle();
        Font totalFont = workbook.createFont();
        totalFont.setBold(true);
        totalStyle.setFont(totalFont);
        totalStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        totalStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        totalStyle.setBorderTop(BorderStyle.THICK);
        totalStyle.setBorderBottom(BorderStyle.THICK);
        totalStyle.setBorderLeft(BorderStyle.THIN);
        totalStyle.setBorderRight(BorderStyle.THIN);
        
        for (int i = 0; i < 3; i++) {
            if (totalRow.getCell(i) != null) {
                totalRow.getCell(i).setCellStyle(totalStyle);
            }
        }
        
        // Establecer anchos de columnas fijos
        establecerAnchosColumnas(sheet, 15, 30, 15);
        
        // Congelar paneles para mantener encabezados visibles
        sheet.createFreezePane(0, 3);
    }

    /**
     * Obtener productos perdidos del día (ROTO, MAL_ESTADO, DEFECTUOSO)
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> obtenerProductosPerdidos(String fechaStr) {
        try {
            System.out.println("🔍 [PRODUCTOS PERDIDOS] Obteniendo productos perdidos para fecha: " + fechaStr);
            
            Long empresaId = obtenerEmpresaId();
            LocalDate fecha = LocalDate.parse(fechaStr);
            LocalDateTime fechaInicio = fecha.atStartOfDay();
            LocalDateTime fechaFin = fecha.atTime(23, 59, 59, 999999999);
            
            List<Map<String, Object>> productosPerdidos = new ArrayList<>();
            
            // 1. Obtener productos perdidos de remitos de ingreso
            List<RemitoIngreso> remitos = remitoIngresoRepository.findByRangoFechasAndEmpresaId(fechaInicio, fechaFin, empresaId);
            for (RemitoIngreso remito : remitos) {
                List<DetalleRemitoIngreso> detalles = detalleRemitoIngresoRepository.findByRemitoIngresoIdOrderByFechaCreacionAsc(remito.getId());
                for (DetalleRemitoIngreso detalle : detalles) {
                    if (detalle.getEstadoProducto() != null && 
                        (detalle.getEstadoProducto() == DetalleRemitoIngreso.EstadoProducto.ROTO ||
                         detalle.getEstadoProducto() == DetalleRemitoIngreso.EstadoProducto.MAL_ESTADO ||
                         detalle.getEstadoProducto() == DetalleRemitoIngreso.EstadoProducto.DEFECTUOSO)) {
                        
                        Map<String, Object> productoPerdido = new HashMap<>();
                        productoPerdido.put("tipo", "INGRESO");
                        productoPerdido.put("numeroDocumento", remito.getNumeroRemito());
                        productoPerdido.put("productoId", detalle.getProducto().getId());
                        productoPerdido.put("codigoPersonalizado", detalle.getProducto().getCodigoPersonalizado());
                        productoPerdido.put("nombre", detalle.getProducto().getNombre());
                        productoPerdido.put("cantidad", detalle.getCantidad());
                        productoPerdido.put("estado", detalle.getEstadoProducto().name());
                        productoPerdido.put("estadoDescripcion", detalle.getEstadoProducto().getDescripcion());
                        productoPerdido.put("observaciones", detalle.getObservaciones());
                        // Enviar fecha como array para mantener consistencia con otros módulos
                        if (detalle.getFechaCreacion() != null) {
                            LocalDateTime fechaCreacion = detalle.getFechaCreacion();
                            int[] fechaArray = {
                                fechaCreacion.getYear(),
                                fechaCreacion.getMonthValue(),
                                fechaCreacion.getDayOfMonth(),
                                fechaCreacion.getHour(),
                                fechaCreacion.getMinute(),
                                fechaCreacion.getSecond(),
                                0 // nanoseconds
                            };
                            productoPerdido.put("fechaCreacion", fechaArray);
                        } else {
                            productoPerdido.put("fechaCreacion", null);
                        }
                        productosPerdidos.add(productoPerdido);
                    }
                }
            }
            
            // 2. Obtener productos perdidos de planillas de devolución
            List<PlanillaDevolucion> devoluciones = planillaDevolucionRepository.findByEmpresaIdAndFechaPlanillaBetweenOrderByFechaCreacionDesc(empresaId, fechaInicio, fechaFin);
            for (PlanillaDevolucion devolucion : devoluciones) {
                List<DetallePlanillaDevolucion> detalles = detallePlanillaDevolucionRepository.findByPlanillaDevolucionIdOrderByFechaCreacionAsc(devolucion.getId());
                for (DetallePlanillaDevolucion detalle : detalles) {
                    if (detalle.getEstadoProducto() != null && 
                        (detalle.getEstadoProducto() == DetallePlanillaDevolucion.EstadoProducto.ROTO ||
                         detalle.getEstadoProducto() == DetallePlanillaDevolucion.EstadoProducto.MAL_ESTADO ||
                         detalle.getEstadoProducto() == DetallePlanillaDevolucion.EstadoProducto.DEFECTUOSO)) {
                        
                        Map<String, Object> productoPerdido = new HashMap<>();
                        productoPerdido.put("tipo", "DEVOLUCION");
                        productoPerdido.put("numeroDocumento", devolucion.getNumeroPlanilla());
                        productoPerdido.put("productoId", detalle.getProducto().getId());
                        productoPerdido.put("codigoPersonalizado", detalle.getProducto().getCodigoPersonalizado());
                        productoPerdido.put("nombre", detalle.getProducto().getNombre());
                        productoPerdido.put("cantidad", detalle.getCantidad());
                        productoPerdido.put("estado", detalle.getEstadoProducto().name());
                        productoPerdido.put("estadoDescripcion", detalle.getEstadoProducto().getDescripcion());
                        productoPerdido.put("observaciones", detalle.getObservaciones());
                        // Enviar fecha como array para mantener consistencia con otros módulos
                        if (detalle.getFechaCreacion() != null) {
                            LocalDateTime fechaCreacion = detalle.getFechaCreacion();
                            int[] fechaArray = {
                                fechaCreacion.getYear(),
                                fechaCreacion.getMonthValue(),
                                fechaCreacion.getDayOfMonth(),
                                fechaCreacion.getHour(),
                                fechaCreacion.getMinute(),
                                fechaCreacion.getSecond(),
                                0 // nanoseconds
                            };
                            productoPerdido.put("fechaCreacion", fechaArray);
                        } else {
                            productoPerdido.put("fechaCreacion", null);
                        }
                        productosPerdidos.add(productoPerdido);
                    }
                }
            }
            
            // 3. Obtener productos perdidos de roturas registradas
            List<RoturaPerdida> roturas = roturaPerdidaRepository.findByEmpresaIdAndFechaBetweenOrderByFechaCreacionDesc(empresaId, fechaInicio, fechaFin);
            for (RoturaPerdida rotura : roturas) {
                Map<String, Object> productoPerdido = new HashMap<>();
                productoPerdido.put("tipo", "ROTURA");
                productoPerdido.put("numeroDocumento", "ROT-" + rotura.getId());
                productoPerdido.put("productoId", rotura.getProducto().getId());
                productoPerdido.put("codigoPersonalizado", rotura.getProducto().getCodigoPersonalizado());
                productoPerdido.put("nombre", rotura.getProducto().getNombre());
                productoPerdido.put("cantidad", rotura.getCantidad());
                productoPerdido.put("estado", "ROTURA");
                productoPerdido.put("estadoDescripcion", "Rotura/Pérdida");
                productoPerdido.put("observaciones", rotura.getObservaciones());
                // Enviar fecha como array para mantener consistencia con otros módulos
                if (rotura.getFechaCreacion() != null) {
                    LocalDateTime fechaCreacion = rotura.getFechaCreacion();
                    int[] fechaArray = {
                        fechaCreacion.getYear(),
                        fechaCreacion.getMonthValue(),
                        fechaCreacion.getDayOfMonth(),
                        fechaCreacion.getHour(),
                        fechaCreacion.getMinute(),
                        fechaCreacion.getSecond(),
                        0 // nanoseconds
                    };
                    productoPerdido.put("fechaCreacion", fechaArray);
                } else {
                    productoPerdido.put("fechaCreacion", null);
                }
                productosPerdidos.add(productoPerdido);
            }
            
            // Ordenar por fecha de creación (más recientes primero)
            productosPerdidos.sort((a, b) -> {
                Object fechaAObj = a.get("fechaCreacion");
                Object fechaBObj = b.get("fechaCreacion");
                
                // Manejar fechas nulas
                if (fechaAObj == null && fechaBObj == null) return 0;
                if (fechaAObj == null) return 1;
                if (fechaBObj == null) return -1;
                
                // Si son arrays de enteros [año, mes, día, hora, minuto, segundo, nanosegundos]
                if (fechaAObj instanceof int[] && fechaBObj instanceof int[]) {
                    int[] fechaA = (int[]) fechaAObj;
                    int[] fechaB = (int[]) fechaBObj;
                    
                    // Comparar año
                    if (fechaB[0] != fechaA[0]) return fechaB[0] - fechaA[0];
                    // Comparar mes
                    if (fechaB[1] != fechaA[1]) return fechaB[1] - fechaA[1];
                    // Comparar día
                    if (fechaB[2] != fechaA[2]) return fechaB[2] - fechaA[2];
                    // Comparar hora
                    if (fechaB[3] != fechaA[3]) return fechaB[3] - fechaA[3];
                    // Comparar minuto
                    if (fechaB[4] != fechaA[4]) return fechaB[4] - fechaA[4];
                    // Comparar segundo
                    return fechaB[5] - fechaA[5];
                }
                
                // Si por alguna razón no son arrays, mantener orden original
                return 0;
            });
            
            System.out.println("✅ [PRODUCTOS PERDIDOS] Encontrados " + productosPerdidos.size() + " productos perdidos");
            return productosPerdidos;
            
        } catch (Exception e) {
            System.err.println("❌ [PRODUCTOS PERDIDOS] Error al obtener productos perdidos: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error al obtener productos perdidos", e);
        }
    }

    /**
     * Método auxiliar para obtener la letra de la columna en Excel
     */
    private String getColumnLetter(int columnIndex) {
        StringBuilder columnLetter = new StringBuilder();
        while (columnIndex >= 0) {
            columnLetter.insert(0, (char) ('A' + (columnIndex % 26)));
            columnIndex = (columnIndex / 26) - 1;
        }
        return columnLetter.toString();
    }

    private Long obtenerEmpresaId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UsuarioPrincipal) {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            return usuarioPrincipal.getEmpresaId();
        }
        throw new RuntimeException("No se pudo obtener el ID de la empresa");
    }
    
    /**
     * Configura el sistema para modo headless de manera robusta
     * Evita errores de fuentes en entornos de servidor sin interfaz gráfica
     */
    private void configurarModoHeadless() {
        try {
            // Configuración básica de headless
            System.setProperty("java.awt.headless", "true");
            System.setProperty("sun.java2d.headless", "true");
            
            // Configuración específica para evitar errores de fuentes
            System.setProperty("java.awt.graphicsenv", "sun.awt.HeadlessGraphicsEnvironment");
            System.setProperty("sun.java2d.noddraw", "true");
            System.setProperty("sun.java2d.d3d", "false");
            System.setProperty("sun.java2d.opengl", "false");
            System.setProperty("sun.java2d.pmoffscreen", "false");
            System.setProperty("sun.java2d.xrender", "false");
            
            // Configuración adicional para Apache POI
            System.setProperty("org.apache.poi.util.POILogger", "org.apache.poi.util.NullLogger");
            
            // Configuración para evitar problemas con fuentes
            System.setProperty("java.awt.fonts", "");
            System.setProperty("sun.java2d.fontpath", "");
            
            System.out.println("✅ [SERVICE] Sistema configurado para modo headless");
        } catch (Exception e) {
            System.err.println("⚠️ [SERVICE] Error configurando modo headless: " + e.getMessage());
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
            System.err.println("⚠️ [SERVICE] Error estableciendo anchos de columna: " + e.getMessage());
        }
    }
}
