package com.minegocio.backend.entidades;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "stock_por_sector", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"producto_id", "sector_id"})
})
public class StockPorSector {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto_id", nullable = false)
    private Producto producto;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sector_id", nullable = false)
    private Sector sector;
    
    @Column(name = "cantidad", nullable = false)
    private Integer cantidad = 0;
    
    @Column(name = "fecha_actualizacion", nullable = false)
    private LocalDateTime fechaActualizacion;
    
    // Constructor
    public StockPorSector() {
        this.fechaActualizacion = LocalDateTime.now();
        this.cantidad = 0;
    }
    
    public StockPorSector(Producto producto, Sector sector, Integer cantidad) {
        this();
        this.producto = producto;
        this.sector = sector;
        this.cantidad = cantidad;
    }
    
    // Getters y Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Producto getProducto() {
        return producto;
    }
    
    public void setProducto(Producto producto) {
        this.producto = producto;
    }
    
    public Sector getSector() {
        return sector;
    }
    
    public void setSector(Sector sector) {
        this.sector = sector;
    }
    
    public Integer getCantidad() {
        return cantidad;
    }
    
    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
        this.fechaActualizacion = LocalDateTime.now();
    }
    
    public LocalDateTime getFechaActualizacion() {
        return fechaActualizacion;
    }
    
    public void setFechaActualizacion(LocalDateTime fechaActualizacion) {
        this.fechaActualizacion = fechaActualizacion;
    }
    
    @PreUpdate
    public void preUpdate() {
        this.fechaActualizacion = LocalDateTime.now();
    }
}


