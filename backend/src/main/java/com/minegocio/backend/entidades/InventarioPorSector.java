package com.minegocio.backend.entidades;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Entidad que representa un inventario específico por sector
 */
@Entity
@Table(name = "inventario_por_sector")
public class InventarioPorSector {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "La empresa es obligatoria")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @NotNull(message = "El sector es obligatorio")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sector_id", nullable = false)
    private Sector sector;

    @NotNull(message = "El usuario administrador es obligatorio")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_admin_id", nullable = false)
    private Usuario usuarioAdministrador;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_asignado_1_id")
    private Usuario usuarioAsignado1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_asignado_2_id")
    private Usuario usuarioAsignado2;

    @CreationTimestamp
    @Column(name = "fecha_inicio", updatable = false)
    private LocalDateTime fechaInicio;

    @UpdateTimestamp
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    @Column(name = "fecha_finalizacion")
    private LocalDateTime fechaFinalizacion;

    @Enumerated(EnumType.STRING)
    @Column(name = "estado")
    private EstadoInventario estado;

    @Column(name = "total_productos")
    private Integer totalProductos;

    @Column(name = "productos_contados")
    private Integer productosContados;

    @Column(name = "productos_con_diferencias")
    private Integer productosConDiferencias;

    @Column(name = "intentos_reconteo")
    private Integer intentosReconteo;

    @Column(name = "porcentaje_completado")
    private Double porcentajeCompletado;

    @Column(name = "observaciones", length = 1000)
    private String observaciones;

    @OneToMany(mappedBy = "inventarioPorSector", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<DetalleConteo> detallesConteo;

    // Enum para estados del inventario
    public enum EstadoInventario {
        PENDIENTE("Pendiente"),
        EN_PROGRESO("En Progreso"),
        ESPERANDO_VERIFICACION("Esperando Verificación"),
        CON_DIFERENCIAS("Con Diferencias"),
        COMPLETADO("Completado"),
        CANCELADO("Cancelado");

        private final String descripcion;

        EstadoInventario(String descripcion) {
            this.descripcion = descripcion;
        }

        public String getDescripcion() {
            return descripcion;
        }
    }

    // Constructores
    public InventarioPorSector() {
        this.estado = EstadoInventario.PENDIENTE;
        this.productosContados = 0;
        this.productosConDiferencias = 0;
        this.intentosReconteo = 0;
        this.porcentajeCompletado = 0.0;
    }

    public InventarioPorSector(Empresa empresa, Sector sector, Usuario usuarioAdministrador) {
        this();
        this.empresa = empresa;
        this.sector = sector;
        this.usuarioAdministrador = usuarioAdministrador;
        this.fechaInicio = LocalDateTime.now();
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Empresa getEmpresa() { return empresa; }
    public void setEmpresa(Empresa empresa) { this.empresa = empresa; }

    public Sector getSector() { return sector; }
    public void setSector(Sector sector) { this.sector = sector; }

    public Usuario getUsuarioAdministrador() { return usuarioAdministrador; }
    public void setUsuarioAdministrador(Usuario usuarioAdministrador) { this.usuarioAdministrador = usuarioAdministrador; }

    public Usuario getUsuarioAsignado1() { return usuarioAsignado1; }
    public void setUsuarioAsignado1(Usuario usuarioAsignado1) { this.usuarioAsignado1 = usuarioAsignado1; }

    public Usuario getUsuarioAsignado2() { return usuarioAsignado2; }
    public void setUsuarioAsignado2(Usuario usuarioAsignado2) { this.usuarioAsignado2 = usuarioAsignado2; }

    public LocalDateTime getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(LocalDateTime fechaInicio) { this.fechaInicio = fechaInicio; }

    public LocalDateTime getFechaActualizacion() { return fechaActualizacion; }
    public void setFechaActualizacion(LocalDateTime fechaActualizacion) { this.fechaActualizacion = fechaActualizacion; }

    public LocalDateTime getFechaFinalizacion() { return fechaFinalizacion; }
    public void setFechaFinalizacion(LocalDateTime fechaFinalizacion) { this.fechaFinalizacion = fechaFinalizacion; }

    public EstadoInventario getEstado() { return estado; }
    public void setEstado(EstadoInventario estado) { this.estado = estado; }

    public Integer getTotalProductos() { return totalProductos; }
    public void setTotalProductos(Integer totalProductos) { this.totalProductos = totalProductos; }

    public Integer getProductosContados() { return productosContados; }
    public void setProductosContados(Integer productosContados) { this.productosContados = productosContados; }

    public Integer getProductosConDiferencias() { return productosConDiferencias; }
    public void setProductosConDiferencias(Integer productosConDiferencias) { this.productosConDiferencias = productosConDiferencias; }

    public Integer getIntentosReconteo() { return intentosReconteo; }
    public void setIntentosReconteo(Integer intentosReconteo) { this.intentosReconteo = intentosReconteo; }

    public Double getPorcentajeCompletado() { return porcentajeCompletado; }
    public void setPorcentajeCompletado(Double porcentajeCompletado) { this.porcentajeCompletado = porcentajeCompletado; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public List<DetalleConteo> getDetallesConteo() { return detallesConteo; }
    public void setDetallesConteo(List<DetalleConteo> detallesConteo) { this.detallesConteo = detallesConteo; }
}



















