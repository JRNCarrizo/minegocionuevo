package com.minegocio.backend.entidades;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDateTime;

/**
 * Entidad que representa los detalles de una planilla de devolución
 */
@Entity
@Table(name = "detalle_planillas_devoluciones")
public class DetallePlanillaDevolucion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "La descripción es obligatoria")
    @Column(length = 500, nullable = false)
    private String descripcion;

    @Min(value = 1, message = "La cantidad debe ser mayor a 0")
    @Column(nullable = false)
    private Integer cantidad;

    // Cantidad original que se sumó al stock al crear la planilla
    @Column(name = "cantidad_original_stock")
    private Integer cantidadOriginalStock;

    @Column(name = "numero_personalizado", length = 100)
    private String numeroPersonalizado;

    @Column(length = 1000)
    private String observaciones;

    // Estado del producto devuelto (opcional para compatibilidad)
    @Enumerated(EnumType.STRING)
    @Column(name = "estado_producto", nullable = true)
    private EstadoProducto estadoProducto;

    // Relación con la planilla de devolución
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "planilla_devolucion_id", nullable = false)
    @JsonIgnore
    private PlanillaDevolucion planillaDevolucion;

    // Relación con el producto (opcional)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id")
    @JsonIgnore
    private Producto producto;

    // Timestamps
    @CreationTimestamp
    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion;

    // Constructores
    public DetallePlanillaDevolucion() {}

    public DetallePlanillaDevolucion(PlanillaDevolucion planillaDevolucion, String descripcion, Integer cantidad) {
        this.planillaDevolucion = planillaDevolucion;
        this.descripcion = descripcion;
        this.cantidad = cantidad;
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }

    public Integer getCantidadOriginalStock() { return cantidadOriginalStock; }
    public void setCantidadOriginalStock(Integer cantidadOriginalStock) { this.cantidadOriginalStock = cantidadOriginalStock; }

    public String getNumeroPersonalizado() { return numeroPersonalizado; }
    public void setNumeroPersonalizado(String numeroPersonalizado) { this.numeroPersonalizado = numeroPersonalizado; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public PlanillaDevolucion getPlanillaDevolucion() { return planillaDevolucion; }
    public void setPlanillaDevolucion(PlanillaDevolucion planillaDevolucion) { this.planillaDevolucion = planillaDevolucion; }

    public Producto getProducto() { return producto; }
    public void setProducto(Producto producto) { this.producto = producto; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public EstadoProducto getEstadoProducto() { 
        return estadoProducto != null ? estadoProducto : EstadoProducto.BUEN_ESTADO; 
    }
    public void setEstadoProducto(EstadoProducto estadoProducto) { 
        this.estadoProducto = estadoProducto != null ? estadoProducto : EstadoProducto.BUEN_ESTADO; 
    }

    /**
     * Enum para el estado del producto devuelto
     */
    public enum EstadoProducto {
        BUEN_ESTADO("Buen Estado"),
        ROTO("Roto"),
        MAL_ESTADO("Mal Estado"),
        DEFECTUOSO("Defectuoso");

        private final String descripcion;

        EstadoProducto(String descripcion) {
            this.descripcion = descripcion;
        }

        public String getDescripcion() {
            return descripcion;
        }
    }
}
