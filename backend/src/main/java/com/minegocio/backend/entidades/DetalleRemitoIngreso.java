package com.minegocio.backend.entidades;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "detalles_remito_ingreso")
public class DetalleRemitoIngreso {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "remito_ingreso_id", nullable = false)
    private RemitoIngreso remitoIngreso;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "producto_id")
    private Producto producto;
    
    @Column(name = "codigo_personalizado")
    private String codigoPersonalizado;
    
    @Column(name = "descripcion", nullable = false)
    private String descripcion;
    
    @Column(name = "cantidad", nullable = false)
    private Integer cantidad;
    
    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;
    
    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion;
    
    // Constructores
    public DetalleRemitoIngreso() {}
    
    public DetalleRemitoIngreso(RemitoIngreso remitoIngreso, Producto producto, String codigoPersonalizado,
                               String descripcion, Integer cantidad, String observaciones) {
        this.remitoIngreso = remitoIngreso;
        this.producto = producto;
        this.codigoPersonalizado = codigoPersonalizado;
        this.descripcion = descripcion;
        this.cantidad = cantidad;
        this.observaciones = observaciones;
        this.fechaCreacion = LocalDateTime.now();
    }
    
    // Getters y Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
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
    
    public Integer getCantidad() {
        return cantidad;
    }
    
    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }
    
    public String getObservaciones() {
        return observaciones;
    }
    
    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }
    
    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }
    
    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }
    
    // Métodos de utilidad
    @PrePersist
    protected void onCreate() {
        this.fechaCreacion = LocalDateTime.now();
    }
}
