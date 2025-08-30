package com.minegocio.backend.entidades;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDateTime;

/**
 * Entidad que representa el detalle de cada producto en un remito de ingreso
 */
@Entity
@Table(name = "detalles_remito_ingreso")
public class DetalleRemitoIngreso {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "La cantidad es requerida")
    @Min(value = 1, message = "La cantidad debe ser al menos 1")
    @Column(nullable = false)
    private Integer cantidad;

    @Column(name = "codigo_personalizado", length = 100)
    private String codigoPersonalizado;

    @Column(name = "descripcion", length = 1000)
    private String descripcion;

    @Column(length = 500)
    private String observaciones;

    // Relación con remito de ingreso
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "remito_ingreso_id", nullable = false)
    @JsonIgnore
    private RemitoIngreso remitoIngreso;

    // Relación con producto
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = true)
    @JsonIgnore
    private Producto producto;

    // Información del producto al momento del remito (para historial)
    @Column(name = "nombre_producto", nullable = true)
    private String nombreProducto;

    @Column(name = "descripcion_producto", length = 1000)
    private String descripcionProducto;

    @Column(name = "categoria_producto")
    private String categoriaProducto;

    @Column(name = "marca_producto")
    private String marcaProducto;

    // Timestamp
    @CreationTimestamp
    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion;

    // Constructores
    public DetalleRemitoIngreso() {}

    public DetalleRemitoIngreso(RemitoIngreso remitoIngreso, Producto producto, Integer cantidad) {
        this.remitoIngreso = remitoIngreso;
        this.producto = producto;
        this.cantidad = cantidad;
        this.nombreProducto = producto.getNombre();
        this.descripcionProducto = producto.getDescripcion();
        this.categoriaProducto = producto.getCategoria();
        this.marcaProducto = producto.getMarca();
    }

    @PrePersist
    @PreUpdate
    public void prePersist() {
        if (this.nombreProducto == null && this.producto != null) {
            this.nombreProducto = this.producto.getNombre();
            this.descripcionProducto = this.producto.getDescripcion();
            this.categoriaProducto = this.producto.getCategoria();
            this.marcaProducto = this.producto.getMarca();
        } else if (this.producto == null) {
            // Si no hay producto, usar valores por defecto o de la descripción
            if (this.nombreProducto == null && this.descripcion != null) {
                this.nombreProducto = this.descripcion;
            }
        }
    }

    // Getters y Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

    public String getCodigoPersonalizado() {
        return codigoPersonalizado;
    }

    public void setCodigoPersonalizado(String codigoPersonalizado) {
        this.codigoPersonalizado = codigoPersonalizado;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    public RemitoIngreso getRemitoIngreso() {
        return remitoIngreso;
    }

    public void setRemitoIngreso(RemitoIngreso remitoIngreso) {
        this.remitoIngreso = remitoIngreso;
    }

    public Producto getProducto() {
        return producto;
    }

    public void setProducto(Producto producto) {
        this.producto = producto;
    }

    public String getNombreProducto() {
        return nombreProducto;
    }

    public void setNombreProducto(String nombreProducto) {
        this.nombreProducto = nombreProducto;
    }

    public String getDescripcionProducto() {
        return descripcionProducto;
    }

    public void setDescripcionProducto(String descripcionProducto) {
        this.descripcionProducto = descripcionProducto;
    }

    public String getCategoriaProducto() {
        return categoriaProducto;
    }

    public void setCategoriaProducto(String categoriaProducto) {
        this.categoriaProducto = categoriaProducto;
    }

    public String getMarcaProducto() {
        return marcaProducto;
    }

    public void setMarcaProducto(String marcaProducto) {
        this.marcaProducto = marcaProducto;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }
}
