package com.minegocio.backend.entidades;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "registros_inventario")
public class RegistroInventario {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventario_completo_id", nullable = false)
    private InventarioCompleto inventarioCompleto;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuarioResponsable;
    
    @Column(name = "nombre_inventario", nullable = false)
    private String nombreInventario;
    
    @Column(name = "fecha_realizacion", nullable = false)
    private LocalDateTime fechaRealizacion;
    
    @Column(name = "fecha_generacion", nullable = false)
    private LocalDateTime fechaGeneracion;
    
    @Column(name = "observaciones", columnDefinition = "TEXT")
    private String observaciones;
    
    @Column(name = "total_productos", nullable = false)
    private Integer totalProductos;
    
    @Column(name = "productos_con_diferencias", nullable = false)
    private Integer productosConDiferencias;
    
    @Column(name = "productos_sin_diferencias", nullable = false)
    private Integer productosSinDiferencias;
    
    @Column(name = "total_sectores", nullable = false)
    private Integer totalSectores;
    
    // Constructores
    public RegistroInventario() {}
    
    public RegistroInventario(InventarioCompleto inventarioCompleto, Usuario usuarioResponsable, 
                            String observaciones, Integer totalProductos, Integer productosConDiferencias,
                            Integer productosSinDiferencias, Integer totalSectores) {
        this.inventarioCompleto = inventarioCompleto;
        this.usuarioResponsable = usuarioResponsable;
        this.observaciones = observaciones;
        this.totalProductos = totalProductos;
        this.productosConDiferencias = productosConDiferencias;
        this.productosSinDiferencias = productosSinDiferencias;
        this.totalSectores = totalSectores;
        this.fechaGeneracion = LocalDateTime.now();
    }
    
    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public InventarioCompleto getInventarioCompleto() { return inventarioCompleto; }
    public void setInventarioCompleto(InventarioCompleto inventarioCompleto) { this.inventarioCompleto = inventarioCompleto; }
    
    public Empresa getEmpresa() { return empresa; }
    public void setEmpresa(Empresa empresa) { this.empresa = empresa; }
    
    public Usuario getUsuarioResponsable() { return usuarioResponsable; }
    public void setUsuarioResponsable(Usuario usuarioResponsable) { this.usuarioResponsable = usuarioResponsable; }
    
    public String getNombreInventario() { return nombreInventario; }
    public void setNombreInventario(String nombreInventario) { this.nombreInventario = nombreInventario; }
    
    public LocalDateTime getFechaRealizacion() { return fechaRealizacion; }
    public void setFechaRealizacion(LocalDateTime fechaRealizacion) { this.fechaRealizacion = fechaRealizacion; }
    
    public LocalDateTime getFechaGeneracion() { return fechaGeneracion; }
    public void setFechaGeneracion(LocalDateTime fechaGeneracion) { this.fechaGeneracion = fechaGeneracion; }
    
    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }
    
    public Integer getTotalProductos() { return totalProductos; }
    public void setTotalProductos(Integer totalProductos) { this.totalProductos = totalProductos; }
    
    public Integer getProductosConDiferencias() { return productosConDiferencias; }
    public void setProductosConDiferencias(Integer productosConDiferencias) { this.productosConDiferencias = productosConDiferencias; }
    
    public Integer getProductosSinDiferencias() { return productosSinDiferencias; }
    public void setProductosSinDiferencias(Integer productosSinDiferencias) { this.productosSinDiferencias = productosSinDiferencias; }
    
    public Integer getTotalSectores() { return totalSectores; }
    public void setTotalSectores(Integer totalSectores) { this.totalSectores = totalSectores; }
}
