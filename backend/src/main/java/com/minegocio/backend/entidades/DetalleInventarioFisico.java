package com.minegocio.backend.entidades;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * Entidad que representa el detalle de un producto en un inventario físico
 */
@Entity
@Table(name = "detalle_inventario_fisico")
public class DetalleInventarioFisico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "El inventario físico es obligatorio")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventario_fisico_id", nullable = false)
    private InventarioFisico inventarioFisico;

    @NotNull(message = "El producto es obligatorio")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Column(name = "codigo_producto")
    private String codigoProducto;

    @Column(name = "nombre_producto")
    private String nombreProducto;

    @Column(name = "stock_real")
    private Integer stockReal;

    @Column(name = "stock_escaneado")
    private Integer stockEscaneado;

    @Column(name = "diferencia")
    private Integer diferencia;

    @Column(name = "precio_unitario", precision = 10, scale = 2)
    private BigDecimal precioUnitario;

    @Column(name = "categoria")
    private String categoria;

    @Column(name = "marca")
    private String marca;

    // Constructores
    public DetalleInventarioFisico() {}

    public DetalleInventarioFisico(InventarioFisico inventarioFisico, Producto producto, 
                                  Integer stockReal, Integer stockEscaneado) {
        this.inventarioFisico = inventarioFisico;
        this.producto = producto;
        this.codigoProducto = producto.getCodigoBarras() != null ? producto.getCodigoBarras() : producto.getCodigoPersonalizado();
        this.nombreProducto = producto.getNombre();
        this.stockReal = stockReal;
        this.stockEscaneado = stockEscaneado;
        this.diferencia = stockEscaneado - stockReal;
        this.precioUnitario = producto.getPrecio();
        this.categoria = producto.getCategoria();
        this.marca = producto.getMarca();
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public InventarioFisico getInventarioFisico() { return inventarioFisico; }
    public void setInventarioFisico(InventarioFisico inventarioFisico) { this.inventarioFisico = inventarioFisico; }

    public Producto getProducto() { return producto; }
    public void setProducto(Producto producto) { this.producto = producto; }

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