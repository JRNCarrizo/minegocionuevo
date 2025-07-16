package com.minegocio.backend.dto;

import com.minegocio.backend.entidades.DetalleInventarioFisico;

import java.math.BigDecimal;

public class DetalleInventarioFisicoDTO {

    private Long id;
    private Long productoId;
    private String codigoProducto;
    private String nombreProducto;
    private Integer stockReal;
    private Integer stockEscaneado;
    private Integer diferencia;
    private BigDecimal precioUnitario;
    private String categoria;
    private String marca;

    // Constructores
    public DetalleInventarioFisicoDTO() {}

    public DetalleInventarioFisicoDTO(DetalleInventarioFisico detalle) {
        this.id = detalle.getId();
        this.productoId = detalle.getProducto().getId();
        this.codigoProducto = detalle.getCodigoProducto();
        this.nombreProducto = detalle.getNombreProducto();
        this.stockReal = detalle.getStockReal();
        this.stockEscaneado = detalle.getStockEscaneado();
        this.diferencia = detalle.getDiferencia();
        this.precioUnitario = detalle.getPrecioUnitario();
        this.categoria = detalle.getCategoria();
        this.marca = detalle.getMarca();
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getProductoId() { return productoId; }
    public void setProductoId(Long productoId) { this.productoId = productoId; }

    public String getCodigoProducto() { return codigoProducto; }
    public void setCodigoProducto(String codigoProducto) { this.codigoProducto = codigoProducto; }

    public String getNombreProducto() { return nombreProducto; }
    public void setNombreProducto(String nombreProducto) { this.nombreProducto = nombreProducto; }

    public Integer getStockReal() { return stockReal; }
    public void setStockReal(Integer stockReal) { this.stockReal = stockReal; }

    public Integer getStockEscaneado() { return stockEscaneado; }
    public void setStockEscaneado(Integer stockEscaneado) { this.stockEscaneado = stockEscaneado; }

    public Integer getDiferencia() { return diferencia; }
    public void setDiferencia(Integer diferencia) { this.diferencia = diferencia; }

    public BigDecimal getPrecioUnitario() { return precioUnitario; }
    public void setPrecioUnitario(BigDecimal precioUnitario) { this.precioUnitario = precioUnitario; }

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public String getMarca() { return marca; }
    public void setMarca(String marca) { this.marca = marca; }
} 