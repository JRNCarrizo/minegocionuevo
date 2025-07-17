package com.minegocio.backend.entidades;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import jakarta.validation.constraints.Size;

/**
 * Entidad que representa el historial de cambios de inventario
 */
@Entity
@Table(name = "historial_inventario")
public class HistorialInventario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "El producto es obligatorio")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = true)
    private Usuario usuario;

    @NotNull(message = "La empresa es obligatoria")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @NotNull(message = "El tipo de operación es obligatorio")
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_operacion", nullable = false)
    private TipoOperacion tipoOperacion;

    @NotNull(message = "La cantidad es obligatoria")
    @Column(nullable = false)
    private Integer cantidad;

    @Column(name = "stock_anterior")
    private Integer stockAnterior;

    @Column(name = "stock_nuevo")
    private Integer stockNuevo;

    @Column(name = "precio_unitario", precision = 10, scale = 2)
    private BigDecimal precioUnitario;

    @Column(name = "valor_total", precision = 10, scale = 2)
    private BigDecimal valorTotal;

    @Size(max = 500, message = "La observación no puede exceder 500 caracteres")
    @Column(length = 500)
    private String observacion;

    @Size(max = 50, message = "El código de barras no puede exceder 50 caracteres")
    @Column(name = "codigo_barras", length = 50)
    private String codigoBarras;

    @Size(max = 100, message = "El método de entrada no puede exceder 100 caracteres")
    @Column(name = "metodo_entrada", length = 100)
    private String metodoEntrada; // "cámara", "manual", "usb"

    @CreationTimestamp
    @Column(name = "fecha_operacion", updatable = false)
    private LocalDateTime fechaOperacion;

    // Enum para tipos de operación
    public enum TipoOperacion {
        INCREMENTO("Incremento de stock"),
        DECREMENTO("Decremento de stock"),
        AJUSTE("Ajuste de inventario"),
        INVENTARIO_FISICO("Inventario físico");

        private final String descripcion;

        TipoOperacion(String descripcion) {
            this.descripcion = descripcion;
        }

        public String getDescripcion() {
            return descripcion;
        }
    }

    // Constructores
    public HistorialInventario() {}

    public HistorialInventario(Producto producto, Usuario usuario, Empresa empresa, 
                              TipoOperacion tipoOperacion, Integer cantidad, 
                              Integer stockAnterior, Integer stockNuevo) {
        this.producto = producto;
        this.usuario = usuario;
        this.empresa = empresa;
        this.tipoOperacion = tipoOperacion;
        this.cantidad = cantidad;
        this.stockAnterior = stockAnterior;
        this.stockNuevo = stockNuevo;
    }

    // Métodos de utilidad
    public BigDecimal calcularValorTotal() {
        if (precioUnitario != null && cantidad != null) {
            return precioUnitario.multiply(BigDecimal.valueOf(cantidad));
        }
        return BigDecimal.ZERO;
    }

    public String getDescripcionOperacion() {
        return tipoOperacion.getDescripcion();
    }

    public boolean esIncremento() {
        return TipoOperacion.INCREMENTO.equals(tipoOperacion);
    }

    public boolean esDecremento() {
        return TipoOperacion.DECREMENTO.equals(tipoOperacion);
    }

    public boolean esAjuste() {
        return TipoOperacion.AJUSTE.equals(tipoOperacion);
    }

    public boolean esInventarioFisico() {
        return TipoOperacion.INVENTARIO_FISICO.equals(tipoOperacion);
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Producto getProducto() { return producto; }
    public void setProducto(Producto producto) { this.producto = producto; }

    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }

    public Empresa getEmpresa() { return empresa; }
    public void setEmpresa(Empresa empresa) { this.empresa = empresa; }

    public TipoOperacion getTipoOperacion() { return tipoOperacion; }
    public void setTipoOperacion(TipoOperacion tipoOperacion) { this.tipoOperacion = tipoOperacion; }

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