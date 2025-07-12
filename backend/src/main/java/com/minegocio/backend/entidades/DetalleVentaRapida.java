package com.minegocio.backend.entidades;

import jakarta.persistence.*;
import java.math.BigDecimal;

/**
 * Entidad para los detalles de una venta rápida
 */
@Entity
@Table(name = "detalles_venta_rapida")
public class DetalleVentaRapida {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "venta_rapida_id", nullable = false)
    private VentaRapida ventaRapida;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @Column(name = "producto_nombre", nullable = false, length = 200)
    private String productoNombre;

    @Column(name = "cantidad", nullable = false)
    private Integer cantidad;

    @Column(name = "precio_unitario", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioUnitario;

    @Column(name = "subtotal", nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    // Constructores
    public DetalleVentaRapida() {}

    public DetalleVentaRapida(VentaRapida ventaRapida, Producto producto, String productoNombre, 
                             Integer cantidad, BigDecimal precioUnitario, BigDecimal subtotal) {
        this.ventaRapida = ventaRapida;
        this.producto = producto;
        this.productoNombre = productoNombre;
        this.cantidad = cantidad;
        this.precioUnitario = precioUnitario;
        this.subtotal = subtotal;
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public VentaRapida getVentaRapida() { return ventaRapida; }
    public void setVentaRapida(VentaRapida ventaRapida) { this.ventaRapida = ventaRapida; }

    public Producto getProducto() { return producto; }
    public void setProducto(Producto producto) { this.producto = producto; }

    public String getProductoNombre() { return productoNombre; }
    public void setProductoNombre(String productoNombre) { this.productoNombre = productoNombre; }

    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }

    public BigDecimal getPrecioUnitario() { return precioUnitario; }
    public void setPrecioUnitario(BigDecimal precioUnitario) { this.precioUnitario = precioUnitario; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }
} 