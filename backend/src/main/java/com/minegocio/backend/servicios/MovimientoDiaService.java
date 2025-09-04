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

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MovimientoDiaService {
    
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
    
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
    
    /**
     * Obtener movimientos del día para una fecha específica
     */
    @Transactional(readOnly = true)
    public MovimientoDiaDTO obtenerMovimientosDia(String fechaStr) {
        try {
            Long empresaId = obtenerEmpresaId();
            LocalDate fecha = LocalDate.parse(fechaStr, DATE_FORMATTER);
            LocalDate fechaActual = LocalDate.now();
            
            System.out.println("🔍 [MOVIMIENTOS] Obteniendo movimientos para empresa: " + empresaId + ", fecha: " + fecha);
            
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
                
                return movimientos;
            }
            
        } catch (Exception e) {
            System.err.println("❌ [MOVIMIENTOS] Error al obtener movimientos: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error al obtener movimientos del día", e);
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
        MovimientoDiaDTO.StockInicialDTO balanceFinal = calcularBalanceFinal(stockInicial, ingresos, devoluciones, salidas, roturas);
        
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
                    producto.setCantidad(detalle.getCantidad());
                    producto.setPrecio(null); // Precio no disponible en balance
                    return producto;
                })
                .collect(Collectors.toList());
            
            int cantidadTotal = productos.stream().mapToInt(MovimientoDiaDTO.ProductoStockDTO::getCantidad).sum();
            
            System.out.println("📊 [STOCK INICIAL] Balance final del día anterior - Total: " + cantidadTotal);
            
            return new MovimientoDiaDTO.StockInicialDTO(cantidadTotal, productos);
            
        } else if (fecha.isBefore(fechaActual) || fecha.isEqual(fechaActual)) {
            // CASO 2: No hay cierre del día anterior y es día pasado o actual
            // Calcular stock actual menos movimientos del día actual
            System.out.println("📊 [STOCK INICIAL] Calculando stock actual menos movimientos del día");
            
            // Obtener stock actual
            List<Producto> productosActuales = productoRepository.findByEmpresaId(empresaId);
            Map<Long, Integer> stockActual = productosActuales.stream()
                .collect(Collectors.toMap(Producto::getId, Producto::getStock));
            
            // Obtener movimientos del día actual
            MovimientoDiaDTO.MovimientosDTO ingresos = obtenerIngresos(empresaId, fecha);
            MovimientoDiaDTO.MovimientosDTO devoluciones = obtenerDevoluciones(empresaId, fecha);
            MovimientoDiaDTO.MovimientosDTO salidas = obtenerSalidas(empresaId, fecha);
            MovimientoDiaDTO.MovimientosDTO roturas = obtenerRoturas(empresaId, fecha);
            
            // Calcular stock inicial = stock actual - movimientos del día
            Map<Long, Integer> stockInicial = new HashMap<>(stockActual);
            
            // Restar ingresos SOLO de productos que ya existían al inicio del día
            for (MovimientoDiaDTO.ProductoMovimientoDTO ingreso : ingresos.getProductos()) {
                // Solo restar si el producto ya existía (stock inicial > 0 o el producto ya estaba en la lista)
                Integer stockInicialProducto = stockInicial.get(ingreso.getId());
                if (stockInicialProducto != null && stockInicialProducto > 0) {
                    stockInicial.merge(ingreso.getId(), -ingreso.getCantidad(), Integer::sum);
                }
                // Si stockInicialProducto es null o 0, significa que es un producto nuevo
                // y no debe afectar el stock inicial
            }
            
            // Restar devoluciones (se sumaron al stock actual)
            for (MovimientoDiaDTO.ProductoMovimientoDTO devolucion : devoluciones.getProductos()) {
                stockInicial.merge(devolucion.getId(), -devolucion.getCantidad(), Integer::sum);
            }
            
            // Sumar salidas (se restaron del stock actual)
            for (MovimientoDiaDTO.ProductoMovimientoDTO salida : salidas.getProductos()) {
                stockInicial.merge(salida.getId(), salida.getCantidad(), Integer::sum);
            }
            
            // Sumar roturas (se restaron del stock actual)
            for (MovimientoDiaDTO.ProductoMovimientoDTO rotura : roturas.getProductos()) {
                stockInicial.merge(rotura.getId(), rotura.getCantidad(), Integer::sum);
            }
            
            // Crear DTOs
            List<MovimientoDiaDTO.ProductoStockDTO> productosDTO = productosActuales.stream()
                .map(producto -> {
                    MovimientoDiaDTO.ProductoStockDTO productoDTO = new MovimientoDiaDTO.ProductoStockDTO();
                    productoDTO.setId(producto.getId());
                    productoDTO.setNombre(producto.getNombre());
                    productoDTO.setCodigoPersonalizado(producto.getCodigoPersonalizado());
                    productoDTO.setCantidad(stockInicial.getOrDefault(producto.getId(), 0));
                    productoDTO.setPrecio(producto.getPrecio() != null ? producto.getPrecio().doubleValue() : null);
                    return productoDTO;
                })
                .collect(Collectors.toList());
            
            int cantidadTotal = productosDTO.stream().mapToInt(MovimientoDiaDTO.ProductoStockDTO::getCantidad).sum();
            
            System.out.println("📊 [STOCK INICIAL] Stock actual menos movimientos - Total: " + cantidadTotal);
            
            return new MovimientoDiaDTO.StockInicialDTO(cantidadTotal, productosDTO);
            
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
                    productoDTO.setPrecio(producto.getPrecio() != null ? producto.getPrecio().doubleValue() : null);
                    return productoDTO;
                })
                .collect(Collectors.toList());
            
            int cantidadTotal = productosDTO.stream().mapToInt(MovimientoDiaDTO.ProductoStockDTO::getCantidad).sum();
            
            System.out.println("📊 [STOCK INICIAL] Stock actual para día futuro - Total: " + cantidadTotal);
            
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
     * Fórmula: Balance Final = Stock Inicial + Ingresos + Devoluciones - Salidas - Roturas
     * 
     * Donde:
     * - Stock Inicial = Balance final del día anterior (ya incluye todos los movimientos previos)
     * - Ingresos = Remitos de ingreso del día actual
     * - Devoluciones = Planillas de devolución del día actual
     * - Salidas = Planillas de pedidos del día actual
     * - Roturas = Roturas y pérdidas del día actual
     */
    private MovimientoDiaDTO.StockInicialDTO calcularBalanceFinal(
            MovimientoDiaDTO.StockInicialDTO stockInicial,
            MovimientoDiaDTO.MovimientosDTO ingresos,
            MovimientoDiaDTO.MovimientosDTO devoluciones,
            MovimientoDiaDTO.MovimientosDTO salidas,
            MovimientoDiaDTO.MovimientosDTO roturas) {
        
        // Crear mapa para agrupar productos por ID
        Map<Long, MovimientoDiaDTO.ProductoStockDTO> balanceProductos = new HashMap<>();
        
        // PASO 1: Agregar stock inicial (balance final del día anterior)
        // Este es el stock base que ya incluye todos los movimientos previos
        for (MovimientoDiaDTO.ProductoStockDTO producto : stockInicial.getProductos()) {
            balanceProductos.put(producto.getId(), new MovimientoDiaDTO.ProductoStockDTO(
                producto.getId(),
                producto.getNombre(),
                producto.getCodigoPersonalizado(),
                producto.getCantidad(), // Stock inicial (sin modificaciones)
                producto.getPrecio(),
                producto.getCantidad(), // cantidadInicial = stock inicial
                0, // variacion inicial
                "SIN_CAMBIOS" // tipoVariacion inicial
            ));
        }
        
        // PASO 2: Sumar ingresos del día actual
        // Los ingresos se suman al stock inicial para obtener el stock disponible
        for (MovimientoDiaDTO.ProductoMovimientoDTO producto : ingresos.getProductos()) {
            balanceProductos.computeIfPresent(producto.getId(), (id, balance) -> {
                balance.setCantidad(balance.getCantidad() + producto.getCantidad());
                return balance;
            });
            // Si el producto no existe en el balance, agregarlo
            balanceProductos.computeIfAbsent(producto.getId(), (id) -> {
                return new MovimientoDiaDTO.ProductoStockDTO(
                    producto.getId(),
                    producto.getNombre(),
                    producto.getCodigoPersonalizado(),
                    producto.getCantidad(), // cantidad final
                    null, // precio
                    0, // cantidadInicial (no estaba en stock inicial)
                    producto.getCantidad(), // variacion (todo el ingreso es variacion)
                    "INCREMENTO" // tipoVariacion
                );
            });
        }
        
        // PASO 3: Sumar devoluciones del día actual
        // Las devoluciones se suman al stock (productos que regresan)
        for (MovimientoDiaDTO.ProductoMovimientoDTO producto : devoluciones.getProductos()) {
            balanceProductos.computeIfPresent(producto.getId(), (id, balance) -> {
                balance.setCantidad(balance.getCantidad() + producto.getCantidad());
                return balance;
            });
            // Si el producto no existe en el balance, agregarlo
            balanceProductos.computeIfAbsent(producto.getId(), (id) -> {
                return new MovimientoDiaDTO.ProductoStockDTO(
                    producto.getId(),
                    producto.getNombre(),
                    producto.getCodigoPersonalizado(),
                    producto.getCantidad(), // cantidad final
                    null, // precio
                    0, // cantidadInicial (no estaba en stock inicial)
                    producto.getCantidad(), // variacion (toda la devolucion es variacion)
                    "INCREMENTO" // tipoVariacion
                );
            });
        }
        
        // PASO 4: Restar salidas del día actual
        // Las salidas se restan del stock (productos que salen)
        for (MovimientoDiaDTO.ProductoMovimientoDTO producto : salidas.getProductos()) {
            balanceProductos.computeIfPresent(producto.getId(), (id, balance) -> {
                balance.setCantidad(balance.getCantidad() - producto.getCantidad());
                return balance;
            });
            // Si el producto no existe en el balance, agregarlo
            balanceProductos.computeIfAbsent(producto.getId(), (id) -> {
                return new MovimientoDiaDTO.ProductoStockDTO(
                    producto.getId(),
                    producto.getNombre(),
                    producto.getCodigoPersonalizado(),
                    0, // cantidad final (se restó todo)
                    null, // precio
                    producto.getCantidad(), // cantidadInicial (era lo que se restó)
                    -producto.getCantidad(), // variacion (negativa)
                    "DECREMENTO" // tipoVariacion
                );
            });
        }
        
        // PASO 5: Restar roturas del día actual
        // Las roturas se restan del stock (productos perdidos/deteriorados)
        for (MovimientoDiaDTO.ProductoMovimientoDTO producto : roturas.getProductos()) {
            balanceProductos.computeIfPresent(producto.getId(), (id, balance) -> {
                balance.setCantidad(balance.getCantidad() - producto.getCantidad());
                return balance;
            });
            // Si el producto no existe en el balance, agregarlo
            balanceProductos.computeIfAbsent(producto.getId(), (id) -> {
                return new MovimientoDiaDTO.ProductoStockDTO(
                    producto.getId(),
                    producto.getNombre(),
                    producto.getCodigoPersonalizado(),
                    0, // cantidad final (se restó todo)
                    null, // precio
                    producto.getCantidad(), // cantidadInicial (era lo que se restó)
                    -producto.getCantidad(), // variacion (negativa)
                    "DECREMENTO" // tipoVariacion
                );
            });
        }
        
        // PASO 6: Calcular variación para cada producto
        // La variación es la diferencia entre cantidad final y cantidad inicial
        for (MovimientoDiaDTO.ProductoStockDTO producto : balanceProductos.values()) {
            // Solo recalcular variación si no se estableció previamente (productos que ya estaban en stock inicial)
            if (producto.getTipoVariacion() == null || producto.getTipoVariacion().equals("SIN_CAMBIOS")) {
                int variacion = producto.getCantidad() - producto.getCantidadInicial();
                producto.setVariacion(variacion);
                
                if (variacion > 0) {
                    producto.setTipoVariacion("INCREMENTO");
                } else if (variacion < 0) {
                    producto.setTipoVariacion("DECREMENTO");
                } else {
                    producto.setTipoVariacion("SIN_CAMBIOS");
                }
            }
        }
        
        List<MovimientoDiaDTO.ProductoStockDTO> productosBalance = new ArrayList<>(balanceProductos.values());
        int cantidadTotal = productosBalance.stream().mapToInt(MovimientoDiaDTO.ProductoStockDTO::getCantidad).sum();
        
        // Log para debug
        System.out.println("📊 [BALANCE FINAL] Todos los productos:");
        for (MovimientoDiaDTO.ProductoStockDTO producto : productosBalance) {
            System.out.println("  - " + producto.getCodigoPersonalizado() + " | " + producto.getNombre() + 
                             " | Inicial: " + producto.getCantidadInicial() + 
                             " | Final: " + producto.getCantidad() + 
                             " | Variación: " + producto.getVariacion() + 
                             " | Tipo: " + producto.getTipoVariacion());
        }
        
        System.out.println("📊 [BALANCE FINAL] Productos con cambios:");
        for (MovimientoDiaDTO.ProductoStockDTO producto : productosBalance) {
            if (!"SIN_CAMBIOS".equals(producto.getTipoVariacion())) {
                System.out.println("  - " + producto.getCodigoPersonalizado() + " | " + producto.getNombre() + 
                                 " | Inicial: " + producto.getCantidadInicial() + 
                                 " | Final: " + producto.getCantidad() + 
                                 " | Variación: " + producto.getVariacion() + 
                                 " | Tipo: " + producto.getTipoVariacion());
            }
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
        if (detallesBalance == null) {
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
                producto.getCantidad(),
                producto.getPrecio(),
                producto.getCantidad(), // cantidadInicial
                0, // variacion
                "SIN_CAMBIOS" // tipoVariacion
            ));
        }
        
        // Sumar ingresos
        for (MovimientoDiaDTO.ProductoMovimientoDTO producto : ingresos.getProductos()) {
            if (balanceProductos.containsKey(producto.getId())) {
                MovimientoDiaDTO.ProductoStockDTO existente = balanceProductos.get(producto.getId());
                existente.setCantidad(existente.getCantidad() + producto.getCantidad());
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
                existente.setCantidad(existente.getCantidad() + producto.getCantidad());
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
                existente.setCantidad(existente.getCantidad() - producto.getCantidad());
            }
        }
        
        // Restar roturas
        for (MovimientoDiaDTO.ProductoMovimientoDTO producto : roturas.getProductos()) {
            if (balanceProductos.containsKey(producto.getId())) {
                MovimientoDiaDTO.ProductoStockDTO existente = balanceProductos.get(producto.getId());
                existente.setCantidad(existente.getCantidad() - producto.getCantidad());
            }
        }
        
        // Calcular variaciones
        for (MovimientoDiaDTO.ProductoStockDTO producto : balanceProductos.values()) {
            int cantidadInicial = producto.getCantidadInicial();
            int cantidadFinal = producto.getCantidad();
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
        int cantidadTotal = productos.stream().mapToInt(MovimientoDiaDTO.ProductoStockDTO::getCantidad).sum();
        
        return new MovimientoDiaDTO.StockInicialDTO(cantidadTotal, productos);
    }

    /**
     * Exportar movimientos del día a Excel
     */
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
                    .collect(Collectors.toMap(p -> p.getId(), p -> p.getCantidad()));
                    
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
                    .collect(Collectors.toMap(p -> p.getId(), p -> p.getCantidad()));
                    
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
     * Obtener empresa ID del contexto de seguridad
     */
    private Long obtenerEmpresaId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UsuarioPrincipal) {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            return usuarioPrincipal.getEmpresaId();
        }
        throw new RuntimeException("No se pudo obtener el ID de la empresa");
    }
}
