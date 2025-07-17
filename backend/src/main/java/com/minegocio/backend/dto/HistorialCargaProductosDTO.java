package com.minegocio.backend.dto;

import com.minegocio.backend.entidades.HistorialCargaProductos;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class HistorialCargaProductosDTO {
    
    private Long id;
    private Long productoId;
    private String productoNombre;
    private String productoDescripcion;
    private String productoMarca;
    private String productoCategoria;
    private String productoUnidad;
    private String codigoBarras;
    private String codigoPersonalizado;
    
    private Long usuarioId;
    private String usuarioNombre;
    private String usuarioApellidos;
    
    private Long empresaId;
    private String empresaNombre;
    
    private String tipoOperacion;
    private String tipoOperacionDescripcion;
    
    private Integer cantidad;
    private Integer stockAnterior;
    private Integer stockNuevo;
    private BigDecimal precioUnitario;
    private BigDecimal valorTotal;
    
    private String observacion;
    private String metodoEntrada;
    
    private LocalDateTime fechaOperacion;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;
    
    // Constructor vacío
    public HistorialCargaProductosDTO() {}
    
    // Constructor desde entidad
    public HistorialCargaProductosDTO(HistorialCargaProductos historial) {
        this.id = historial.getId();
        
        // Información del producto
        if (historial.getProducto() != null) {
            this.productoId = historial.getProducto().getId();
            this.productoNombre = historial.getProducto().getNombre();
            this.productoDescripcion = historial.getProducto().getDescripcion();
            this.productoMarca = historial.getProducto().getMarca();
            this.productoCategoria = historial.getProducto().getCategoria();
            this.productoUnidad = historial.getProducto().getUnidad();
            this.codigoBarras = historial.getProducto().getCodigoBarras();
            this.codigoPersonalizado = historial.getProducto().getCodigoPersonalizado();
        }
        
        // Información del usuario
        if (historial.getUsuario() != null) {
            this.usuarioId = historial.getUsuario().getId();
            this.usuarioNombre = historial.getUsuario().getNombre();
            this.usuarioApellidos = historial.getUsuario().getApellidos();
        }
        
        // Información de la empresa
        if (historial.getEmpresa() != null) {
            this.empresaId = historial.getEmpresa().getId();
            this.empresaNombre = historial.getEmpresa().getNombre();
        }
        
        // Información de la operación
        this.tipoOperacion = historial.getTipoOperacion().name();
        this.tipoOperacionDescripcion = historial.getTipoOperacion().getDescripcion();
        this.cantidad = historial.getCantidad();
        this.stockAnterior = historial.getStockAnterior();
        this.stockNuevo = historial.getStockNuevo();
        this.precioUnitario = historial.getPrecioUnitario();
        this.valorTotal = historial.getValorTotal();
        this.observacion = historial.getObservacion();
        this.metodoEntrada = historial.getMetodoEntrada();
        this.codigoBarras = historial.getCodigoBarras();
        
        // Fechas
        this.fechaOperacion = historial.getFechaOperacion();
        this.fechaCreacion = historial.getFechaCreacion();
        this.fechaActualizacion = historial.getFechaActualizacion();
    }
    
    // Getters y Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getProductoId() {
        return productoId;
    }
    
    public void setProductoId(Long productoId) {
        this.productoId = productoId;
    }
    
    public String getProductoNombre() {
        return productoNombre;
    }
    
    public void setProductoNombre(String productoNombre) {
        this.productoNombre = productoNombre;
    }
    
    public String getProductoDescripcion() {
        return productoDescripcion;
    }
    
    public void setProductoDescripcion(String productoDescripcion) {
        this.productoDescripcion = productoDescripcion;
    }
    
    public String getProductoMarca() {
        return productoMarca;
    }
    
    public void setProductoMarca(String productoMarca) {
        this.productoMarca = productoMarca;
    }
    
    public String getProductoCategoria() {
        return productoCategoria;
    }
    
    public void setProductoCategoria(String productoCategoria) {
        this.productoCategoria = productoCategoria;
    }
    
    public String getProductoUnidad() {
        return productoUnidad;
    }
    
    public void setProductoUnidad(String productoUnidad) {
        this.productoUnidad = productoUnidad;
    }
    
    public String getCodigoBarras() {
        return codigoBarras;
    }
    
    public void setCodigoBarras(String codigoBarras) {
        this.codigoBarras = codigoBarras;
    }
    
    public String getCodigoPersonalizado() {
        return codigoPersonalizado;
    }
    
    public void setCodigoPersonalizado(String codigoPersonalizado) {
        this.codigoPersonalizado = codigoPersonalizado;
    }
    
    public Long getUsuarioId() {
        return usuarioId;
    }
    
    public void setUsuarioId(Long usuarioId) {
        this.usuarioId = usuarioId;
    }
    
    public String getUsuarioNombre() {
        return usuarioNombre;
    }
    
    public void setUsuarioNombre(String usuarioNombre) {
        this.usuarioNombre = usuarioNombre;
    }
    
    public String getUsuarioApellidos() {
        return usuarioApellidos;
    }
    
    public void setUsuarioApellidos(String usuarioApellidos) {
        this.usuarioApellidos = usuarioApellidos;
    }
    
    public Long getEmpresaId() {
        return empresaId;
    }
    
    public void setEmpresaId(Long empresaId) {
        this.empresaId = empresaId;
    }
    
    public String getEmpresaNombre() {
        return empresaNombre;
    }
    
    public void setEmpresaNombre(String empresaNombre) {
        this.empresaNombre = empresaNombre;
    }
    
    public String getTipoOperacion() {
        return tipoOperacion;
    }
    
    public void setTipoOperacion(String tipoOperacion) {
        this.tipoOperacion = tipoOperacion;
    }
    
    public String getTipoOperacionDescripcion() {
        return tipoOperacionDescripcion;
    }
    
    public void setTipoOperacionDescripcion(String tipoOperacionDescripcion) {
        this.tipoOperacionDescripcion = tipoOperacionDescripcion;
    }
    
    public Integer getCantidad() {
        return cantidad;
    }
    
    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }
    
    public Integer getStockAnterior() {
        return stockAnterior;
    }
    
    public void setStockAnterior(Integer stockAnterior) {
        this.stockAnterior = stockAnterior;
    }
    
    public Integer getStockNuevo() {
        return stockNuevo;
    }
    
    public void setStockNuevo(Integer stockNuevo) {
        this.stockNuevo = stockNuevo;
    }
    
    public BigDecimal getPrecioUnitario() {
        return precioUnitario;
    }
    
    public void setPrecioUnitario(BigDecimal precioUnitario) {
        this.precioUnitario = precioUnitario;
    }
    
    public BigDecimal getValorTotal() {
        return valorTotal;
    }
    
    public void setValorTotal(BigDecimal valorTotal) {
        this.valorTotal = valorTotal;
    }
    
    public String getObservacion() {
        return observacion;
    }
    
    public void setObservacion(String observacion) {
        this.observacion = observacion;
    }
    
    public String getMetodoEntrada() {
        return metodoEntrada;
    }
    
    public void setMetodoEntrada(String metodoEntrada) {
        this.metodoEntrada = metodoEntrada;
    }
    
    public LocalDateTime getFechaOperacion() {
        return fechaOperacion;
    }
    
    public void setFechaOperacion(LocalDateTime fechaOperacion) {
        this.fechaOperacion = fechaOperacion;
    }
    
    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }
    
    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }
    
    public LocalDateTime getFechaActualizacion() {
        return fechaActualizacion;
    }
    
    public void setFechaActualizacion(LocalDateTime fechaActualizacion) {
        this.fechaActualizacion = fechaActualizacion;
    }
} 