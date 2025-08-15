package com.minegocio.backend.entidades;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Entidad que representa el detalle de cada producto en una planilla de pedidos
 */
@Entity
@Table(name = "detalle_planillas_pedidos")
public class DetallePlanillaPedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_personalizado", length = 50)
    private String numeroPersonalizado;

    @NotNull(message = "La descripción es obligatoria")
    @Column(name = "descripcion", nullable = false, length = 500)
    private String descripcion;

    @Min(value = 1, message = "La cantidad debe ser al menos 1")
    @Column(nullable = false)
    private Integer cantidad;

    @Column(length = 500)
    private String observaciones;

    // Relación con planilla de pedido
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "planilla_pedido_id", nullable = false)
    private PlanillaPedido planillaPedido;

    // Relación opcional con producto (para referenciar productos existentes)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = true)
    private Producto producto;

    // Timestamp
    @CreationTimestamp
    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion;

    // Constructores
    public DetallePlanillaPedido() {}

    public DetallePlanillaPedido(PlanillaPedido planillaPedido, String descripcion, Integer cantidad) {
        this.planillaPedido = planillaPedido;
        this.descripcion = descripcion;
        this.cantidad = cantidad;
    }

    public DetallePlanillaPedido(PlanillaPedido planillaPedido, Producto producto, Integer cantidad) {
        this.planillaPedido = planillaPedido;
        this.producto = producto;
        this.numeroPersonalizado = producto.getCodigoPersonalizado();
        this.descripcion = producto.getNombre();
        this.cantidad = cantidad;
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNumeroPersonalizado() { return numeroPersonalizado; }
    public void setNumeroPersonalizado(String numeroPersonalizado) { this.numeroPersonalizado = numeroPersonalizado; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public PlanillaPedido getPlanillaPedido() { return planillaPedido; }
    public void setPlanillaPedido(PlanillaPedido planillaPedido) { this.planillaPedido = planillaPedido; }

    public Producto getProducto() { return producto; }
    public void setProducto(Producto producto) { this.producto = producto; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }
}
