package com.minegocio.backend.dto;

import com.minegocio.backend.entidades.HistorialInventario;
import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class HistorialInventarioDTO {

    private Long id;
    private Long productoId;
    private String productoNombre;
    private String productoCodigoBarras;
    private Long usuarioId;
    private String usuarioNombre;
    private String tipoOperacion;
    private String descripcionOperacion;
    private Integer cantidad;
    private Integer stockAnterior;
    private Integer stockNuevo;
    private BigDecimal precioUnitario;
    private BigDecimal valorTotal;
    private String observacion;
    private String codigoBarras;
    private String metodoEntrada;
    
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime fechaOperacion;

    // Constructores
    public HistorialInventarioDTO() {}

    public HistorialInventarioDTO(HistorialInventario historial) {
        this.id = historial.getId();
        this.productoId = historial.getProducto().getId();
        this.productoNombre = historial.getProducto().getNombre();
        this.productoCodigoBarras = historial.getProducto().getCodigoBarras();
        this.usuarioId = historial.getUsuario().getId();
        this.usuarioNombre = historial.getUsuario().getNombreCompleto();
        this.tipoOperacion = historial.getTipoOperacion().name();
        this.descripcionOperacion = historial.getDescripcionOperacion();
        this.cantidad = historial.getCantidad();
        this.stockAnterior = historial.getStockAnterior();
        this.stockNuevo = historial.getStockNuevo();
        this.precioUnitario = historial.getPrecioUnitario();
        this.valorTotal = historial.getValorTotal();
        this.observacion = historial.getObservacion();
        this.codigoBarras = historial.getCodigoBarras();
        this.metodoEntrada = historial.getMetodoEntrada();
        this.fechaOperacion = historial.getFechaOperacion();
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProductoId() { return productoId; }
    public void setProductoId(Long productoId) { this.productoId = productoId; }

    public String getProductoNombre() { return productoNombre; }
    public void setProductoNombre(String productoNombre) { this.productoNombre = productoNombre; }

    public String getProductoCodigoBarras() { return productoCodigoBarras; }
    public void setProductoCodigoBarras(String productoCodigoBarras) { this.productoCodigoBarras = productoCodigoBarras; }

    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }

    public String getUsuarioNombre() { return usuarioNombre; }
    public void setUsuarioNombre(String usuarioNombre) { this.usuarioNombre = usuarioNombre; }

    public String getTipoOperacion() { return tipoOperacion; }
    public void setTipoOperacion(String tipoOperacion) { this.tipoOperacion = tipoOperacion; }

    public String getDescripcionOperacion() { return descripcionOperacion; }
    public void setDescripcionOperacion(String descripcionOperacion) { this.descripcionOperacion = descripcionOperacion; }

    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }

    public Integer getStockAnterior() { return stockAnterior; }
    public void setStockAnterior(Integer stockAnterior) { this.stockAnterior = stockAnterior; }

    public Integer getStockNuevo() { return stockNuevo; }
    public void setStockNuevo(Integer stockNuevo) { this.stockNuevo = stockNuevo; }

    public BigDecimal getPrecioUnitario() { return precioUnitario; }
    public void setPrecioUnitario(BigDecimal precioUnitario) { this.precioUnitario = precioUnitario; }

    public BigDecimal getValorTotal() { return valorTotal; }
    public void setValorTotal(BigDecimal valorTotal) { this.valorTotal = valorTotal; }

    public String getObservacion() { return observacion; }
    public void setObservacion(String observacion) { this.observacion = observacion; }

    public String getCodigoBarras() { return codigoBarras; }
    public void setCodigoBarras(String codigoBarras) { this.codigoBarras = codigoBarras; }

    public String getMetodoEntrada() { return metodoEntrada; }
    public void setMetodoEntrada(String metodoEntrada) { this.metodoEntrada = metodoEntrada; }

    public LocalDateTime getFechaOperacion() { return fechaOperacion; }
    public void setFechaOperacion(LocalDateTime fechaOperacion) { this.fechaOperacion = fechaOperacion; }
} 