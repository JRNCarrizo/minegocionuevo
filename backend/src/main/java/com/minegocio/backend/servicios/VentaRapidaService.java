package com.minegocio.backend.servicios;

import com.minegocio.backend.dto.VentaRapidaDTO;
import com.minegocio.backend.dto.VentaRapidaHistorialDTO;
import com.minegocio.backend.dto.InventarioRequestDTO;
import com.minegocio.backend.entidades.*;
import com.minegocio.backend.repositorios.ClienteRepository;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.ProductoRepository;
import com.minegocio.backend.repositorios.VentaRapidaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.Map;

/**
 * Servicio para manejar las ventas rápidas desde la caja
 */
@Service
public class VentaRapidaService {
    
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    @Autowired
    private VentaRapidaRepository ventaRapidaRepository;

    @Autowired
    private ProductoRepository productoRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private EmpresaRepository empresaRepository;
    
    @Autowired
    private NotificacionService notificacionService;
    
    @Autowired
    private HistorialInventarioService historialInventarioService;
    
    @Autowired
    private StockSincronizacionService stockSincronizacionService;

    /**
     * Procesa una venta rápida y la guarda en el historial
     */
    @Transactional
    public VentaRapida procesarVentaRapida(Long empresaId, VentaRapidaDTO ventaDTO, Long usuarioId) {
        // Obtener la empresa
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));

        // Buscar o crear cliente
        Cliente cliente = buscarOCrearCliente(empresa, ventaDTO.getClienteNombre(), ventaDTO.getClienteEmail());

        // Crear la venta rápida
        VentaRapida ventaRapida = new VentaRapida();
        ventaRapida.setEmpresa(empresa);
        ventaRapida.setCliente(cliente);
        ventaRapida.setClienteNombre(ventaDTO.getClienteNombre());
        ventaRapida.setClienteEmail(ventaDTO.getClienteEmail());
        ventaRapida.setTotal(ventaDTO.getTotal());
        ventaRapida.setSubtotal(ventaDTO.getSubtotal());
        ventaRapida.setMetodoPago(ventaDTO.getMetodoPago());
        ventaRapida.setMontoRecibido(ventaDTO.getMontoRecibido());
        ventaRapida.setVuelto(ventaDTO.getVuelto());
        ventaRapida.setObservaciones(ventaDTO.getObservaciones());
        
        // Usar la fecha del DTO si está disponible, sino usar la fecha actual
        LocalDateTime fechaVenta;
        if (ventaDTO.getFechaVenta() != null && !ventaDTO.getFechaVenta().isEmpty()) {
            try {
                fechaVenta = LocalDateTime.parse(ventaDTO.getFechaVenta(), DATETIME_FORMATTER);
                System.out.println("📅 [VENTA RAPIDA] Usando fecha del DTO: " + fechaVenta);
            } catch (Exception e) {
                System.out.println("⚠️ [VENTA RAPIDA] Error al parsear fecha del DTO, usando fecha actual: " + e.getMessage());
                fechaVenta = LocalDateTime.now();
            }
        } else {
            fechaVenta = LocalDateTime.now();
            System.out.println("📅 [VENTA RAPIDA] Usando fecha actual: " + fechaVenta);
        }
        ventaRapida.setFechaVenta(fechaVenta);
        
        // Generar número de comprobante usando la fecha del usuario
        String numeroComprobante = "VR-" + (fechaVenta.getHour() * 100 + fechaVenta.getMinute());
        ventaRapida.setNumeroComprobante(numeroComprobante);

        // Agregar detalles de la venta
        for (VentaRapidaDTO.DetalleVentaRapidaDTO detalleDTO : ventaDTO.getDetalles()) {
            Producto producto = productoRepository.findById(detalleDTO.getProductoId())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + detalleDTO.getProductoId()));

            // Verificar stock total disponible (incluyendo sectores)
            Map<String, Object> detalleStock = stockSincronizacionService.obtenerDetalleStockDisponible(empresaId, detalleDTO.getProductoId());
            Integer stockTotalDisponible = (Integer) detalleStock.get("stockTotal");
            if (stockTotalDisponible < detalleDTO.getCantidad()) {
                throw new RuntimeException("Stock insuficiente para " + producto.getNombre() + 
                    ". Disponible: " + stockTotalDisponible + ", Solicitado: " + detalleDTO.getCantidad());
            }

            // Crear detalle de la venta rápida
            DetalleVentaRapida detalle = new DetalleVentaRapida();
            detalle.setVentaRapida(ventaRapida);
            detalle.setProducto(producto);
            detalle.setProductoNombre(producto.getNombre());
            detalle.setCantidad(detalleDTO.getCantidad());
            detalle.setPrecioUnitario(detalleDTO.getPrecioUnitario());
            detalle.setSubtotal(detalleDTO.getSubtotal());

            // Descontar stock usando la estrategia híbrida inteligente
            try {
                Map<String, Object> resultadoDescuento = stockSincronizacionService.descontarStockInteligente(
                    empresaId, 
                    detalleDTO.getProductoId(), 
                    detalleDTO.getCantidad(), 
                    "Venta rápida - " + ventaRapida.getNumeroComprobante()
                );
                System.out.println("✅ STOCK SINCRONIZACIÓN - Stock descontado para venta rápida: " + resultadoDescuento);
            } catch (Exception e) {
                System.err.println("❌ STOCK SINCRONIZACIÓN - Error al descontar stock: " + e.getMessage());
                throw new RuntimeException("Error al procesar el descuento de stock: " + e.getMessage());
            }

            // Registrar la operación de decremento en el historial de inventario
            if (usuarioId != null) {
                try {
                    InventarioRequestDTO request = new InventarioRequestDTO();
                    request.setProductoId(detalleDTO.getProductoId());
                    request.setTipoOperacion("DECREMENTO");
                    request.setCantidad(detalleDTO.getCantidad());
                    request.setPrecioUnitario(detalleDTO.getPrecioUnitario());
                    request.setObservacion("Venta rápida - " + ventaRapida.getNumeroComprobante());
                    request.setCodigoBarras(producto.getCodigoBarras());
                    request.setMetodoEntrada("VENTA_RAPIDA");
                    
                    historialInventarioService.registrarOperacionInventario(request, usuarioId, empresaId, false);
                } catch (Exception e) {
                    // Log del error pero no fallar la operación principal
                    System.err.println("Error al registrar historial de inventario en venta rápida: " + e.getMessage());
                }
            }

            ventaRapida.agregarDetalle(detalle);
        }

        // Guardar la venta rápida
        VentaRapida ventaGuardada = ventaRapidaRepository.save(ventaRapida);
        
        // Crear notificación de venta rápida
        notificacionService.crearNotificacionVentaRapida(empresaId, ventaDTO.getTotal().doubleValue(), ventaDTO.getMetodoPago());
        
        return ventaGuardada;
    }
    
    /**
     * Método sobrecargado para compatibilidad hacia atrás
     */
    @Transactional
    public VentaRapida procesarVentaRapida(Long empresaId, VentaRapidaDTO ventaDTO) {
        return procesarVentaRapida(empresaId, ventaDTO, null);
    }

    /**
     * Busca un cliente existente o crea uno nuevo para la venta rápida
     */
    private Cliente buscarOCrearCliente(Empresa empresa, String nombre, String email) {
        // Si no hay email o es muy genérico, crear cliente local
        if (email == null || email.trim().isEmpty() || 
            email.contains("venta.local") || email.contains("cliente.local")) {
            email = "venta.local@" + empresa.getSubdominio() + ".com";
        }

        // Buscar cliente existente por email
        Optional<Cliente> clienteExistente = clienteRepository.findByEmailAndEmpresaIdAndActivoTrue(email, empresa.getId());
        
        if (clienteExistente.isPresent()) {
            Cliente cliente = clienteExistente.get();
            // Actualizar el nombre si es diferente (por si el cliente ya existía con otro nombre)
            if (!cliente.getNombre().equals(nombre)) {
                cliente.setNombre(nombre);
                clienteRepository.save(cliente);
            }
            return cliente;
        }

        // Crear nuevo cliente
        Cliente nuevoCliente = new Cliente();
        nuevoCliente.setEmpresa(empresa);
        nuevoCliente.setNombre(nombre);
        nuevoCliente.setApellidos("Cliente Local"); // Apellidos por defecto para ventas rápidas
        nuevoCliente.setEmail(email);
        nuevoCliente.setTipo(Cliente.TipoCliente.REGULAR);
        nuevoCliente.setActivo(true);
        nuevoCliente.setAceptaMarketing(false);
        nuevoCliente.setEmailVerificado(false);

        return clienteRepository.save(nuevoCliente);
    }

    /**
     * Busca un cliente por email en la empresa específica
     */
    public Optional<Cliente> buscarClientePorEmail(Long empresaId, String email) {
        if (email == null || email.trim().isEmpty()) {
            return Optional.empty();
        }
        return clienteRepository.findByEmailAndEmpresaIdAndActivoTrue(email, empresaId);
    }

    /**
     * Crea un cliente usando información del usuario autenticado
     */
    public Cliente crearClienteDesdeUsuario(Empresa empresa, String nombreUsuario, String emailUsuario) {
        // Buscar si ya existe un cliente con ese email
        Optional<Cliente> clienteExistente = clienteRepository.findByEmailAndEmpresaIdAndActivoTrue(emailUsuario, empresa.getId());
        
        if (clienteExistente.isPresent()) {
            return clienteExistente.get();
        }

        // Crear nuevo cliente con información del usuario
        Cliente nuevoCliente = new Cliente();
        nuevoCliente.setEmpresa(empresa);
        nuevoCliente.setNombre(nombreUsuario);
        nuevoCliente.setApellidos("Usuario"); // Apellidos por defecto
        nuevoCliente.setEmail(emailUsuario);
        nuevoCliente.setTipo(Cliente.TipoCliente.REGULAR);
        nuevoCliente.setActivo(true);
        nuevoCliente.setAceptaMarketing(false);
        nuevoCliente.setEmailVerificado(true); // Si viene del usuario autenticado, asumimos que está verificado

        return clienteRepository.save(nuevoCliente);
    }

    /**
     * Obtiene el historial de ventas rápidas por empresa
     */
    public List<VentaRapidaHistorialDTO> obtenerHistorialVentasRapidas(Long empresaId) {
        List<VentaRapida> ventas = ventaRapidaRepository.findByEmpresaIdOrderByFechaVentaDesc(empresaId);
        return ventas.stream()
                .map(this::convertirAVentaRapidaHistorialDTO)
                .collect(java.util.stream.Collectors.toList());
    }

    /**
     * Convierte una entidad VentaRapida a VentaRapidaHistorialDTO
     */
    private VentaRapidaHistorialDTO convertirAVentaRapidaHistorialDTO(VentaRapida venta) {
        VentaRapidaHistorialDTO dto = new VentaRapidaHistorialDTO(
            venta.getId(),
            venta.getClienteNombre(),
            venta.getClienteEmail(),
            venta.getTotal(),
            venta.getSubtotal(),
            venta.getMetodoPago(),
            venta.getMontoRecibido(),
            venta.getVuelto(),
            venta.getObservaciones(),
            venta.getNumeroComprobante(),
            venta.getFechaVenta()
        );

        // Convertir detalles
        List<VentaRapidaHistorialDTO.DetalleVentaRapidaHistorialDTO> detallesDTO = 
            venta.getDetalles().stream()
                .map(this::convertirADetalleHistorialDTO)
                .collect(java.util.stream.Collectors.toList());
        
        dto.setDetalles(detallesDTO);
        return dto;
    }

    /**
     * Convierte una entidad DetalleVentaRapida a DetalleVentaRapidaHistorialDTO
     */
    private VentaRapidaHistorialDTO.DetalleVentaRapidaHistorialDTO convertirADetalleHistorialDTO(DetalleVentaRapida detalle) {
        return new VentaRapidaHistorialDTO.DetalleVentaRapidaHistorialDTO(
            detalle.getId(),
            detalle.getProductoNombre(),
            detalle.getCantidad(),
            detalle.getPrecioUnitario(),
            detalle.getSubtotal()
        );
    }

    /**
     * Obtiene ventas rápidas por rango de fechas
     */
    public List<VentaRapidaHistorialDTO> obtenerVentasPorFecha(Long empresaId, LocalDate fechaInicio, LocalDate fechaFin) {
        LocalDateTime inicio = fechaInicio.atStartOfDay();
        LocalDateTime fin = fechaFin.atTime(LocalTime.MAX);
        List<VentaRapida> ventas = ventaRapidaRepository.findByEmpresaIdAndFechaVentaBetweenOrderByFechaVentaDesc(empresaId, inicio, fin);
        return ventas.stream()
                .map(this::convertirAVentaRapidaHistorialDTO)
                .collect(java.util.stream.Collectors.toList());
    }

    /**
     * Obtiene ventas rápidas por método de pago
     */
    public List<VentaRapidaHistorialDTO> obtenerVentasPorMetodoPago(Long empresaId, String metodoPago) {
        List<VentaRapida> ventas = ventaRapidaRepository.findByEmpresaIdAndMetodoPagoOrderByFechaVentaDesc(empresaId, metodoPago);
        return ventas.stream()
                .map(this::convertirAVentaRapidaHistorialDTO)
                .collect(java.util.stream.Collectors.toList());
    }

    /**
     * Obtiene estadísticas de ventas rápidas para una empresa
     */
    public VentaRapidaEstadisticas obtenerEstadisticasVentasRapidas(Long empresaId, LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        System.out.println("=== DEBUG ESTADISTICAS VENTAS RAPIDAS CON FECHAS ===");
        System.out.println("🔍 Buscando ventas para empresa ID: " + empresaId);
        System.out.println("📅 Fecha inicio: " + fechaInicio);
        System.out.println("📅 Fecha fin: " + fechaFin);
        
        List<VentaRapida> ventas = ventaRapidaRepository.findByEmpresaIdAndFechaVentaBetweenOrderByFechaVentaDesc(
            empresaId, fechaInicio, fechaFin);
        
        System.out.println("📊 Ventas encontradas en rango: " + ventas.size());

        BigDecimal totalVentas = ventas.stream()
                .map(VentaRapida::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalTransacciones = ventas.size();

        int totalProductos = ventas.stream()
                .mapToInt(venta -> venta.getDetalles().size())
                .sum();

        // Calcular total de unidades vendidas
        int totalUnidadesVendidas = ventas.stream()
                .flatMapToInt(venta -> venta.getDetalles().stream()
                        .mapToInt(detalle -> detalle.getCantidad()))
                .sum();

        System.out.println("💰 Total ventas en rango: " + totalVentas);
        System.out.println("🔄 Total transacciones en rango: " + totalTransacciones);
        System.out.println("📦 Total productos en rango: " + totalProductos);
        System.out.println("📊 Total unidades vendidas en rango: " + totalUnidadesVendidas);
        System.out.println("=== FIN DEBUG ESTADISTICAS VENTAS RAPIDAS CON FECHAS ===");

        return new VentaRapidaEstadisticas(totalVentas, totalTransacciones, totalProductos, ventas.size(), totalUnidadesVendidas);
    }

    /**
     * Obtiene estadísticas de ventas rápidas para una empresa (todas las ventas)
     */
    public VentaRapidaEstadisticas obtenerEstadisticasVentasRapidas(Long empresaId) {
        System.out.println("=== DEBUG ESTADISTICAS VENTAS RAPIDAS ===");
        System.out.println("🔍 Buscando ventas para empresa ID: " + empresaId);
        
        List<VentaRapida> ventas = ventaRapidaRepository.findByEmpresaIdOrderByFechaVentaDesc(empresaId);
        
        System.out.println("📊 Ventas encontradas: " + ventas.size());
        
        if (!ventas.isEmpty()) {
            System.out.println("📋 Primera venta: ID=" + ventas.get(0).getId() + ", Total=" + ventas.get(0).getTotal());
            System.out.println("📋 Última venta: ID=" + ventas.get(ventas.size()-1).getId() + ", Total=" + ventas.get(ventas.size()-1).getTotal());
        }

        BigDecimal totalVentas = ventas.stream()
                .map(VentaRapida::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalTransacciones = ventas.size();

        int totalProductos = ventas.stream()
                .mapToInt(venta -> venta.getDetalles().size())
                .sum();

        // Calcular total de unidades vendidas
        int totalUnidadesVendidas = ventas.stream()
                .flatMapToInt(venta -> venta.getDetalles().stream()
                        .mapToInt(detalle -> detalle.getCantidad()))
                .sum();

        System.out.println("💰 Total ventas: " + totalVentas);
        System.out.println("🔄 Total transacciones: " + totalTransacciones);
        System.out.println("📦 Total productos: " + totalProductos);
        System.out.println("📊 Total unidades vendidas: " + totalUnidadesVendidas);
        System.out.println("=== FIN DEBUG ESTADISTICAS VENTAS RAPIDAS ===");

        return new VentaRapidaEstadisticas(totalVentas, totalTransacciones, totalProductos, ventas.size(), totalUnidadesVendidas);
    }

    /**
     * Obtiene estadísticas diarias de ventas
     */
    public VentaRapidaEstadisticas obtenerEstadisticasDiarias(Long empresaId, LocalDate fecha) {
        LocalDateTime inicio = fecha.atStartOfDay();
        LocalDateTime fin = fecha.atTime(LocalTime.MAX);
        return obtenerEstadisticasVentasRapidas(empresaId, inicio, fin);
    }

    /**
     * Obtiene estadísticas mensuales de ventas
     */
    public VentaRapidaEstadisticas obtenerEstadisticasMensuales(Long empresaId, int año, int mes) {
        LocalDateTime inicio = LocalDateTime.of(año, mes, 1, 0, 0);
        LocalDateTime fin = inicio.plusMonths(1).minusSeconds(1);
        return obtenerEstadisticasVentasRapidas(empresaId, inicio, fin);
    }

    /**
     * Obtiene estadísticas anuales de ventas
     */
    public VentaRapidaEstadisticas obtenerEstadisticasAnuales(Long empresaId, int año) {
        LocalDateTime inicio = LocalDateTime.of(año, 1, 1, 0, 0);
        LocalDateTime fin = LocalDateTime.of(año, 12, 31, 23, 59, 59);
        return obtenerEstadisticasVentasRapidas(empresaId, inicio, fin);
    }

    /**
     * Obtiene una venta rápida por ID
     */
    public Optional<VentaRapida> obtenerVentaRapidaPorId(Long ventaId) {
        return ventaRapidaRepository.findById(ventaId);
    }

    /**
     * Clase para estadísticas de ventas rápidas
     */
    public static class VentaRapidaEstadisticas {
        private final BigDecimal totalVentas;
        private final int totalTransacciones;
        private final int totalProductos;
        private final int cantidadVentas;
        private final int totalUnidadesVendidas;

        public VentaRapidaEstadisticas(BigDecimal totalVentas, int totalTransacciones, int totalProductos, int cantidadVentas, int totalUnidadesVendidas) {
            this.totalVentas = totalVentas;
            this.totalTransacciones = totalTransacciones;
            this.totalProductos = totalProductos;
            this.cantidadVentas = cantidadVentas;
            this.totalUnidadesVendidas = totalUnidadesVendidas;
        }

        // Getters
        public BigDecimal getTotalVentas() { return totalVentas; }
        public int getTotalTransacciones() { return totalTransacciones; }
        public int getTotalProductos() { return totalProductos; }
        public int getCantidadVentas() { return cantidadVentas; }
        public int getTotalUnidadesVendidas() { return totalUnidadesVendidas; }
    }
} 