package com.minegocio.backend.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public class InventarioRequestDTO {

    @NotNull(message = "El ID del producto es obligatorio")
    private Long productoId;

    @NotNull(message = "El tipo de operación es obligatorio")
    private String tipoOperacion; // "INCREMENTO", "DECREMENTO", "AJUSTE", "INVENTARIO_FISICO"

    @NotNull(message = "La cantidad es obligatoria")
    @Min(value = 1, message = "La cantidad debe ser mayor a 0")
    private Integer cantidad;

    @Min(value = 0, message = "El stock anterior no puede ser negativo")
    private Integer stockAnterior;

    @Min(value = 0, message = "El stock nuevo no puede ser negativo")
    private Integer stockNuevo;

    private BigDecimal precioUnitario;

    @Size(max = 500, message = "La observación no puede exceder 500 caracteres")
    private String observacion;

    @Size(max = 50, message = "El código de barras no puede exceder 50 caracteres")
    private String codigoBarras;

    @Size(max = 100, message = "El método de entrada no puede exceder 100 caracteres")
    private String metodoEntrada; // "cámara", "manual", "usb"

    // Estado del producto (solo para operaciones de INCREMENTO)
    private String estadoProducto; // "BUEN_ESTADO", "MAL_ESTADO", "ROTO", "DEFECTUOSO"

    // Constructores
    public InventarioRequestDTO() {}

    public InventarioRequestDTO(Long productoId, String tipoOperacion, Integer cantidad) {
        this.productoId = productoId;
        this.tipoOperacion = tipoOperacion;
        this.cantidad = cantidad;
    }

    // Getters y Setters
    public Long getProductoId() { return productoId; }
    public void setProductoId(Long productoId) { this.productoId = productoId; }

    public String getTipoOperacion() { return tipoOperacion; }
    public void setTipoOperacion(String tipoOperacion) { this.tipoOperacion = tipoOperacion; }

    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }

    public Integer getStockAnterior() { return stockAnterior; }
    public void setStockAnterior(Integer stockAnterior) { this.stockAnterior = stockAnterior; }

    public Integer getStockNuevo() { return stockNuevo; }
    public void setStockNuevo(Integer stockNuevo) { this.stockNuevo = stockNuevo; }

    public BigDecimal getPrecioUnitario() { return precioUnitario; }
    public void setPrecioUnitario(BigDecimal precioUnitario) { this.precioUnitario = precioUnitario; }

    public String getObservacion() { return observacion; }
    public void setObservacion(String observacion) { this.observacion = observacion; }

    public String getCodigoBarras() { return codigoBarras; }
    public void setCodigoBarras(String codigoBarras) { this.codigoBarras = codigoBarras; }

    public String getMetodoEntrada() { return metodoEntrada; }
    public void setMetodoEntrada(String metodoEntrada) { this.metodoEntrada = metodoEntrada; }

    public String getEstadoProducto() { return estadoProducto; }
    public void setEstadoProducto(String estadoProducto) { this.estadoProducto = estadoProducto; }
} 