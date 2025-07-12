package com.minegocio.backend.servicios;

import com.minegocio.backend.dto.DetallePedidoDTO;
import com.minegocio.backend.dto.PedidoDTO;
import com.minegocio.backend.dto.ClienteDTO;
import com.minegocio.backend.entidades.Cliente;
import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Pedido;
import com.minegocio.backend.entidades.DetallePedido;
import com.minegocio.backend.entidades.Producto;
import com.minegocio.backend.repositorios.ClienteRepository;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.PedidoRepository;
import com.minegocio.backend.repositorios.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class PedidoService {
    @Autowired
    private PedidoRepository pedidoRepository;
    @Autowired
    private ClienteRepository clienteRepository;
    @Autowired
    private EmpresaRepository empresaRepository;
    @Autowired
    private ProductoRepository productoRepository;

    @Transactional
    public PedidoDTO crearPedido(Long empresaId, PedidoDTO pedidoDTO) {
        System.out.println("=== DEBUG CREAR PEDIDO ===");
        System.out.println("EmpresaId: " + empresaId);
        System.out.println("ClienteId: " + pedidoDTO.getClienteId());
        System.out.println("Total: " + pedidoDTO.getTotal());
        
        // Buscar empresa
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        System.out.println("Empresa encontrada: " + empresa.getNombre());
        
        // Buscar cliente (puede ser null para pedidos públicos)
        Cliente cliente = null;
        if (pedidoDTO.getClienteId() != null) {
            cliente = clienteRepository.findById(pedidoDTO.getClienteId())
                    .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
            System.out.println("Cliente encontrado: " + cliente.getNombre() + " " + cliente.getApellidos());
        } else {
            System.out.println("Pedido público - sin cliente registrado");
        }
        
        // Crear entidad Pedido
        Pedido pedido = new Pedido();
        pedido.setEmpresa(empresa);
        pedido.setCliente(cliente); // Puede ser null para pedidos públicos
        pedido.setDireccionEntrega(pedidoDTO.getDireccionEntrega());
        pedido.setEstado(Pedido.EstadoPedido.PENDIENTE);
        pedido.setObservaciones(pedidoDTO.getNotas());
        pedido.setNumeroPedido(pedido.generarNumeroPedido());
        
        System.out.println("Pedido creado con número: " + pedido.getNumeroPedido());
        
        // Detalles
        List<DetallePedido> detalles = pedidoDTO.getDetalles().stream().map(detalleDTO -> {
            Producto producto = productoRepository.findById(detalleDTO.getProductoId())
                    .orElseThrow(() -> new RuntimeException("Producto no encontrado: " + detalleDTO.getProductoId()));
            System.out.println("DEBUG Pedido: productoId=" + producto.getId() + ", nombre=" + producto.getNombre() + ", precio=" + producto.getPrecio());
            System.out.println("DEBUG DetalleDTO: productoId=" + detalleDTO.getProductoId() + ", cantidad=" + detalleDTO.getCantidad() + ", precioUnitario=" + detalleDTO.getPrecioUnitario());

            // Validar precio
            BigDecimal precioFinal = producto.getPrecio();
            if (precioFinal == null || precioFinal.compareTo(BigDecimal.ZERO) <= 0) {
                // Si el precio en la base es null o <= 0, usa el del DTO (frontend)
                if (detalleDTO.getPrecioUnitario() != null && detalleDTO.getPrecioUnitario().compareTo(BigDecimal.ZERO) > 0) {
                    precioFinal = detalleDTO.getPrecioUnitario();
                    System.out.println("ATENCIÓN: Usando precio del DTO porque el producto en la base no tiene precio válido.");
                } else {
                    throw new RuntimeException("El producto '" + producto.getNombre() + "' no tiene precio asignado ni en la base ni en el pedido.");
                }
            }

            // Descontar stock
            if (producto.getStock() < detalleDTO.getCantidad()) {
                throw new RuntimeException("Stock insuficiente para el producto: " + producto.getNombre());
            }
            producto.setStock(producto.getStock() - detalleDTO.getCantidad());
            productoRepository.save(producto);

            DetallePedido detalle = new DetallePedido();
            detalle.setPedido(pedido);
            detalle.setProducto(producto);
            detalle.setCantidad(detalleDTO.getCantidad());
            detalle.setPrecioUnitario(precioFinal);
            detalle.setNombreProducto(producto.getNombre());
            detalle.setDescripcionProducto(producto.getDescripcion());
            detalle.setCategoriaProducto(producto.getCategoria());
            detalle.calcularPrecioTotal();
            return detalle;
        }).collect(Collectors.toList());
        pedido.setDetalles(detalles);
        pedido.calcularTotal();
        
        System.out.println("Pedido calculado - Total: " + pedido.getTotal() + ", Detalles: " + pedido.getDetalles().size());
        
        // Guardar pedido y detalles
        Pedido guardado = pedidoRepository.save(pedido);
        System.out.println("Pedido guardado con ID: " + guardado.getId());
        
        // Verificar que se guardó correctamente
        if (cliente != null) {
            List<Pedido> pedidosVerificacion = pedidoRepository.findByClienteAndEmpresa(cliente, empresa);
            System.out.println("Pedidos del cliente después de guardar: " + pedidosVerificacion.size());
        } else {
            System.out.println("Pedido público guardado - sin cliente asociado");
        }
        
        // Devolver DTO
        PedidoDTO resultado = convertirADTO(guardado);
        System.out.println("=== FIN DEBUG CREAR PEDIDO ===");
        return resultado;
    }

    public List<PedidoDTO> obtenerPedidosPorEmpresa(Long empresaId) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        return pedidoRepository.findByEmpresaOrderByFechaCreacionDesc(empresa)
                .stream().map(this::convertirADTO).collect(Collectors.toList());
    }

    public List<PedidoDTO> obtenerPedidosPorCliente(Long clienteId) {
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        return pedidoRepository.findByClienteOrderByFechaCreacionDesc(cliente)
                .stream().map(this::convertirADTO).collect(Collectors.toList());
    }

    /**
     * Obtiene pedidos de un cliente específico en una empresa específica
     */
    public List<PedidoDTO> obtenerPedidosPorClienteYEmpresa(Long clienteId, Long empresaId) {
        System.out.println("=== DEBUG PEDIDO SERVICE - obtenerPedidosPorClienteYEmpresa ===");
        System.out.println("ClienteId: " + clienteId);
        System.out.println("EmpresaId: " + empresaId);
        
        Cliente cliente = clienteRepository.findById(clienteId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        System.out.println("Cliente encontrado: " + cliente.getNombre() + " " + cliente.getApellidos());
        
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        System.out.println("Empresa encontrada: " + empresa.getNombre());
        
        List<Pedido> pedidos = pedidoRepository.findPedidosCompletosPorCliente(cliente, empresa);
        System.out.println("Pedidos encontrados en BD: " + pedidos.size());
        
        List<PedidoDTO> pedidosDTO = pedidos.stream().map(this::convertirADTO).collect(Collectors.toList());
        System.out.println("Pedidos convertidos a DTO: " + pedidosDTO.size());
        System.out.println("=== FIN DEBUG PEDIDO SERVICE ===");
        
        return pedidosDTO;
    }

    /**
     * Actualiza el estado de un pedido
     */
    @Transactional
    public PedidoDTO actualizarEstadoPedido(Long empresaId, Long pedidoId, String nuevoEstado) {
        System.out.println("=== DEBUG ACTUALIZAR ESTADO PEDIDO ===");
        System.out.println("EmpresaId: " + empresaId);
        System.out.println("PedidoId: " + pedidoId);
        System.out.println("Nuevo estado: " + nuevoEstado);
        
        // Buscar empresa
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        
        // Buscar pedido por ID y empresa (seguridad multi-tenant)
        Pedido pedido = pedidoRepository.findByIdAndEmpresa(pedidoId, empresa)
                .orElseThrow(() -> new RuntimeException("Pedido no encontrado"));
        
        System.out.println("Pedido encontrado: " + pedido.getNumeroPedido() + " - Estado actual: " + pedido.getEstado());
        
        // Validar y convertir el nuevo estado
        Pedido.EstadoPedido estado;
        try {
            estado = Pedido.EstadoPedido.valueOf(nuevoEstado.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Estado inválido: " + nuevoEstado);
        }
        
        // Validar transiciones de estado permitidas
        if (!esTransicionValida(pedido.getEstado(), estado)) {
            throw new RuntimeException("No se puede cambiar de " + pedido.getEstado() + " a " + estado);
        }
        
        // Actualizar estado
        pedido.setEstado(estado);
        
        // Si se marca como entregado, establecer fecha de entrega real
        if (estado == Pedido.EstadoPedido.ENTREGADO) {
            pedido.setFechaEntregaReal(LocalDateTime.now());
        }
        
        // Si se cancela el pedido, restaurar el stock de los productos
        if (estado == Pedido.EstadoPedido.CANCELADO) {
            System.out.println("Restaurando stock de productos por cancelación del pedido");
            for (DetallePedido detalle : pedido.getDetalles()) {
                Producto producto = detalle.getProducto();
                int cantidadRestaurada = detalle.getCantidad();
                producto.setStock(producto.getStock() + cantidadRestaurada);
                productoRepository.save(producto);
                System.out.println("Stock restaurado para producto " + producto.getNombre() + ": +" + cantidadRestaurada);
            }
        }
        
        // Guardar cambios
        Pedido pedidoActualizado = pedidoRepository.save(pedido);
        System.out.println("Estado actualizado exitosamente a: " + pedidoActualizado.getEstado());
        System.out.println("=== FIN DEBUG ACTUALIZAR ESTADO PEDIDO ===");
        
        return convertirADTO(pedidoActualizado);
    }

    /**
     * Valida si la transición de estado es permitida
     */
    private boolean esTransicionValida(Pedido.EstadoPedido estadoActual, Pedido.EstadoPedido nuevoEstado) {
        // Definir transiciones permitidas
        Map<Pedido.EstadoPedido, List<Pedido.EstadoPedido>> transicionesPermitidas = Map.of(
            Pedido.EstadoPedido.PENDIENTE, List.of(Pedido.EstadoPedido.CONFIRMADO, Pedido.EstadoPedido.CANCELADO),
            Pedido.EstadoPedido.CONFIRMADO, List.of(Pedido.EstadoPedido.PREPARANDO, Pedido.EstadoPedido.CANCELADO),
            Pedido.EstadoPedido.PREPARANDO, List.of(Pedido.EstadoPedido.ENVIADO, Pedido.EstadoPedido.CANCELADO),
            Pedido.EstadoPedido.ENVIADO, List.of(Pedido.EstadoPedido.ENTREGADO, Pedido.EstadoPedido.CANCELADO),
            Pedido.EstadoPedido.ENTREGADO, List.of(), // No se puede cambiar desde entregado
            Pedido.EstadoPedido.CANCELADO, List.of()  // No se puede cambiar desde cancelado
        );
        
        List<Pedido.EstadoPedido> estadosPermitidos = transicionesPermitidas.get(estadoActual);
        return estadosPermitidos != null && estadosPermitidos.contains(nuevoEstado);
    }

    private PedidoDTO convertirADTO(Pedido pedido) {
        PedidoDTO dto = new PedidoDTO();
        dto.setId(pedido.getId());
        dto.setClienteId(pedido.getCliente().getId());
        dto.setClienteNombre(pedido.getCliente().getNombreCompleto());
        dto.setClienteEmail(pedido.getCliente().getEmail());
        dto.setFechaCreacion(pedido.getFechaCreacion());
        dto.setEstado(pedido.getEstado());
        dto.setTotal(pedido.getTotal());
        dto.setDireccionEntrega(pedido.getDireccionEntrega());
        dto.setNotas(pedido.getObservaciones());
        dto.setEmpresaId(pedido.getEmpresa().getId());
        dto.setEmpresaNombre(pedido.getEmpresa().getNombre());
        dto.setNumeroPedido(pedido.getNumeroPedido());
        
        // Crear objeto cliente para el modal
        ClienteDTO clienteDTO = new ClienteDTO();
        clienteDTO.setId(pedido.getCliente().getId());
        clienteDTO.setNombre(pedido.getCliente().getNombre());
        clienteDTO.setApellidos(pedido.getCliente().getApellidos());
        clienteDTO.setEmail(pedido.getCliente().getEmail());
        clienteDTO.setTelefono(pedido.getCliente().getTelefono());
        dto.setCliente(clienteDTO);
        
        dto.setDetalles(pedido.getDetalles().stream().map(det -> {
            DetallePedidoDTO d = new DetallePedidoDTO();
            d.setId(det.getId());
            d.setProductoId(det.getProducto().getId());
            d.setProductoNombre(det.getNombreProducto());
            d.setProductoDescripcion(det.getDescripcionProducto());
            d.setProductoCategoria(det.getCategoriaProducto());
            d.setProductoMarca(det.getMarcaProducto());
            
            // Obtener la imagen principal del producto
            String imagenPrincipal = "";
            if (det.getProducto().getImagenes() != null && !det.getProducto().getImagenes().isEmpty()) {
                imagenPrincipal = det.getProducto().getImagenes().get(0);
            }
            d.setProductoImagen(imagenPrincipal);
            
            d.setCantidad(det.getCantidad());
            d.setPrecioUnitario(det.getPrecioUnitario());
            d.setSubtotal(det.getPrecioTotal());
            return d;
        }).collect(Collectors.toList()));
        return dto;
    }
    
    /**
     * Obtiene el total de ventas de una empresa
     */
    public Double obtenerTotalVentasPorEmpresa(Long empresaId) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        
        return pedidoRepository.sumaTotalVentasPorEmpresa(empresa);
    }

    /**
     * Clase interna para estadísticas de pedidos
     */
    public static class PedidoEstadisticas {
        private final BigDecimal totalPedidos;
        private final int totalTransacciones;
        private final int totalProductos;
        private final int cantidadPedidos;

        public PedidoEstadisticas(BigDecimal totalPedidos, int totalTransacciones, int totalProductos, int cantidadPedidos) {
            this.totalPedidos = totalPedidos;
            this.totalTransacciones = totalTransacciones;
            this.totalProductos = totalProductos;
            this.cantidadPedidos = cantidadPedidos;
        }

        public BigDecimal getTotalPedidos() { return totalPedidos; }
        public int getTotalTransacciones() { return totalTransacciones; }
        public int getTotalProductos() { return totalProductos; }
        public int getCantidadPedidos() { return cantidadPedidos; }
    }

    /**
     * Obtiene estadísticas generales de pedidos por empresa
     */
    public PedidoEstadisticas obtenerEstadisticasPedidos(Long empresaId) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        
        List<Pedido> pedidos = pedidoRepository.findByEmpresaOrderByFechaCreacionDesc(empresa);
        
        BigDecimal totalPedidos = pedidos.stream()
                .filter(pedido -> pedido.getEstado() == Pedido.EstadoPedido.ENTREGADO)
                .map(Pedido::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        int totalTransacciones = (int) pedidos.stream()
                .filter(pedido -> pedido.getEstado() == Pedido.EstadoPedido.ENTREGADO)
                .count();
        
        int totalProductos = pedidos.stream()
                .filter(pedido -> pedido.getEstado() == Pedido.EstadoPedido.ENTREGADO)
                .flatMapToInt(pedido -> pedido.getDetalles().stream().mapToInt(DetallePedido::getCantidad))
                .sum();
        
        int cantidadPedidos = pedidos.size();
        
        return new PedidoEstadisticas(totalPedidos, totalTransacciones, totalProductos, cantidadPedidos);
    }

    /**
     * Obtiene estadísticas de pedidos por rango de fechas
     */
    public PedidoEstadisticas obtenerEstadisticasPedidosPorFecha(Long empresaId, LocalDateTime fechaInicio, LocalDateTime fechaFin) {
        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
        
        List<Pedido> pedidos = pedidoRepository.findByEmpresaAndFechaCreacionBetween(empresa, fechaInicio, fechaFin);
        
        BigDecimal totalPedidos = pedidos.stream()
                .filter(pedido -> pedido.getEstado() == Pedido.EstadoPedido.ENTREGADO)
                .map(Pedido::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        int totalTransacciones = (int) pedidos.stream()
                .filter(pedido -> pedido.getEstado() == Pedido.EstadoPedido.ENTREGADO)
                .count();
        
        int totalProductos = pedidos.stream()
                .filter(pedido -> pedido.getEstado() == Pedido.EstadoPedido.ENTREGADO)
                .flatMapToInt(pedido -> pedido.getDetalles().stream().mapToInt(DetallePedido::getCantidad))
                .sum();
        
        int cantidadPedidos = pedidos.size();
        
        return new PedidoEstadisticas(totalPedidos, totalTransacciones, totalProductos, cantidadPedidos);
    }

    /**
     * Obtiene estadísticas diarias de pedidos
     */
    public PedidoEstadisticas obtenerEstadisticasDiarias(Long empresaId, LocalDateTime fecha) {
        LocalDateTime inicio = fecha.toLocalDate().atStartOfDay();
        LocalDateTime fin = fecha.toLocalDate().atTime(23, 59, 59);
        return obtenerEstadisticasPedidosPorFecha(empresaId, inicio, fin);
    }

    /**
     * Obtiene estadísticas mensuales de pedidos
     */
    public PedidoEstadisticas obtenerEstadisticasMensuales(Long empresaId, int año, int mes) {
        LocalDateTime inicio = LocalDateTime.of(año, mes, 1, 0, 0, 0);
        LocalDateTime fin = inicio.plusMonths(1).minusSeconds(1);
        return obtenerEstadisticasPedidosPorFecha(empresaId, inicio, fin);
    }

    /**
     * Obtiene estadísticas anuales de pedidos
     */
    public PedidoEstadisticas obtenerEstadisticasAnuales(Long empresaId, int año) {
        LocalDateTime inicio = LocalDateTime.of(año, 1, 1, 0, 0, 0);
        LocalDateTime fin = LocalDateTime.of(año, 12, 31, 23, 59, 59);
        return obtenerEstadisticasPedidosPorFecha(empresaId, inicio, fin);
    }
}
