package com.minegocio.backend.entidades;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "remitos_ingreso", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"numero_remito", "empresa_id"})
})
public class RemitoIngreso {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "numero_remito", nullable = false)
    private String numeroRemito;
    
    @Column(name = "fecha_remito", nullable = false)
    private LocalDateTime fechaRemito;
    
    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;
    
    @Column(name = "total_productos", nullable = false)
    private Integer totalProductos;
    
    @CreationTimestamp
    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion;
    
    @UpdateTimestamp
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;
    
    @OneToMany(mappedBy = "remitoIngreso", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DetalleRemitoIngreso> detalles;
    
    // Constructores
    public RemitoIngreso() {}
    
    public RemitoIngreso(String numeroRemito, LocalDateTime fechaRemito, String observaciones, 
                        Integer totalProductos, Empresa empresa) {
        this.numeroRemito = numeroRemito;
        this.fechaRemito = fechaRemito;
        this.observaciones = observaciones;
        this.totalProductos = totalProductos;
        this.empresa = empresa;
    }
    
    // Getters y Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getNumeroRemito() {
        return numeroRemito;
    }
    
    public void setNumeroRemito(String numeroRemito) {
        this.numeroRemito = numeroRemito;
    }
    
    public LocalDateTime getFechaRemito() {
        return fechaRemito;
    }
    
    public void setFechaRemito(LocalDateTime fechaRemito) {
        this.fechaRemito = fechaRemito;
    }
    
    public String getObservaciones() {
        return observaciones;
    }
    
    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }
    
    public Integer getTotalProductos() {
        return totalProductos;
    }
    
    public void setTotalProductos(Integer totalProductos) {
        this.totalProductos = totalProductos;
    }
    
    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }
    
    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }
    
    public LocalDateTime getFechaActualizacion() {
        return fechaActualizacion;
    }
    
    public void setFechaActualizacion(LocalDateTime fechaActualizacion) {
        this.fechaActualizacion = fechaActualizacion;
    }
    
    public Empresa getEmpresa() {
        return empresa;
    }
    
    public void setEmpresa(Empresa empresa) {
        this.empresa = empresa;
    }
    
    public Usuario getUsuario() {
        return usuario;
    }
    
    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }
    
    public List<DetalleRemitoIngreso> getDetalles() {
        return detalles;
    }
    
    public void setDetalles(List<DetalleRemitoIngreso> detalles) {
        this.detalles = detalles;
    }
    
    // Métodos de utilidad
    // Los timestamps se manejan automáticamente con @CreationTimestamp y @UpdateTimestamp
}
