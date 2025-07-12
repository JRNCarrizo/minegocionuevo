package com.minegocio.backend.entidades;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entidad para registrar ventas rápidas desde la caja
 */
@Entity
@Table(name = "ventas_rapidas")
public class VentaRapida {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;

    @Column(name = "cliente_nombre", nullable = false, length = 100)
    private String clienteNombre;

    @Column(name = "cliente_email", length = 100)
    private String clienteEmail;

    @Column(name = "total", nullable = false, precision = 10, scale = 2)
    private BigDecimal total;

    @Column(name = "subtotal", nullable = false, precision = 10, scale = 2)
    private BigDecimal subtotal;

    @Column(name = "metodo_pago", nullable = false, length = 20)
    private String metodoPago;

    @Column(name = "monto_recibido", precision = 10, scale = 2)
    private BigDecimal montoRecibido;

    @Column(name = "vuelto", precision = 10, scale = 2)
    private BigDecimal vuelto;

    @Column(name = "observaciones", length = 500)
    private String observaciones;

    @Column(name = "numero_comprobante", unique = true, nullable = false)
    private String numeroComprobante;

    @Column(name = "fecha_venta", nullable = false)
    private LocalDateTime fechaVenta;

    @OneToMany(mappedBy = "ventaRapida", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DetalleVentaRapida> detalles = new ArrayList<>();

    // Constructores
    public VentaRapida() {
        this.fechaVenta = LocalDateTime.now();
    }

    public VentaRapida(Empresa empresa, String clienteNombre, String clienteEmail, 
                      BigDecimal total, BigDecimal subtotal, String metodoPago) {
        this();
        this.empresa = empresa;
        this.clienteNombre = clienteNombre;
        this.clienteEmail = clienteEmail;
        this.total = total;
        this.subtotal = subtotal;
        this.metodoPago = metodoPago;
        this.numeroComprobante = generarNumeroComprobante();
    }

    // Métodos
    private String generarNumeroComprobante() {
        return "VR-" + System.currentTimeMillis();
    }

    public void agregarDetalle(DetalleVentaRapida detalle) {
        detalles.add(detalle);
        detalle.setVentaRapida(this);
    }

    public void removerDetalle(DetalleVentaRapida detalle) {
        detalles.remove(detalle);
        detalle.setVentaRapida(null);
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Empresa getEmpresa() { return empresa; }
    public void setEmpresa(Empresa empresa) { this.empresa = empresa; }

    public Cliente getCliente() { return cliente; }
    public void setCliente(Cliente cliente) { this.cliente = cliente; }

    public String getClienteNombre() { return clienteNombre; }
    public void setClienteNombre(String clienteNombre) { this.clienteNombre = clienteNombre; }

    public String getClienteEmail() { return clienteEmail; }
    public void setClienteEmail(String clienteEmail) { this.clienteEmail = clienteEmail; }

    public BigDecimal getTotal() { return total; }
    public void setTotal(BigDecimal total) { this.total = total; }

    public BigDecimal getSubtotal() { return subtotal; }
    public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }

    public String getMetodoPago() { return metodoPago; }
    public void setMetodoPago(String metodoPago) { this.metodoPago = metodoPago; }

    public BigDecimal getMontoRecibido() { return montoRecibido; }
    public void setMontoRecibido(BigDecimal montoRecibido) { this.montoRecibido = montoRecibido; }

    public BigDecimal getVuelto() { return vuelto; }
    public void setVuelto(BigDecimal vuelto) { this.vuelto = vuelto; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public String getNumeroComprobante() { return numeroComprobante; }
    public void setNumeroComprobante(String numeroComprobante) { this.numeroComprobante = numeroComprobante; }

    public LocalDateTime getFechaVenta() { return fechaVenta; }
    public void setFechaVenta(LocalDateTime fechaVenta) { this.fechaVenta = fechaVenta; }

    public List<DetalleVentaRapida> getDetalles() { return detalles; }
    public void setDetalles(List<DetalleVentaRapida> detalles) { this.detalles = detalles; }
} 