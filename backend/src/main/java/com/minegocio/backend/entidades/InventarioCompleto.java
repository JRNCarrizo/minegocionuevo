package com.minegocio.backend.entidades;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Entidad que representa un inventario completo con doble verificación
 */
@Entity
@Table(name = "inventario_completo")
public class InventarioCompleto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "El nombre es obligatorio")
    @Column(name = "nombre", nullable = false)
    private String nombre;

    @Column(name = "descripcion", length = 1000)
    private String descripcion;

    @NotNull(message = "La empresa es obligatoria")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Empresa empresa;

    @NotNull(message = "El usuario administrador es obligatorio")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_admin_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Usuario usuarioAdministrador;

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

    @Column(name = "total_sectores")
    private Integer totalSectores;

    @Column(name = "sectores_completados")
    private Integer sectoresCompletados;

    @Column(name = "sectores_en_progreso")
    private Integer sectoresEnProgreso;

    @Column(name = "sectores_pendientes")
    private Integer sectoresPendientes;

    @Column(name = "porcentaje_completado")
    private Double porcentajeCompletado;

    @Column(name = "observaciones", length = 1000)
    private String observaciones;

    @OneToMany(mappedBy = "inventarioCompleto", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private List<ConteoSector> conteosSectores;

    // Enum para estados del inventario
    public enum EstadoInventario {
        PENDIENTE("Pendiente"),
        EN_PROGRESO("En Progreso"),
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
    public InventarioCompleto() {
        this.estado = EstadoInventario.PENDIENTE;
        this.sectoresCompletados = 0;
        this.sectoresEnProgreso = 0;
        this.sectoresPendientes = 0;
        this.porcentajeCompletado = 0.0;
    }

    public InventarioCompleto(String nombre, Empresa empresa, Usuario usuarioAdministrador) {
        this();
        this.nombre = nombre;
        this.empresa = empresa;
        this.usuarioAdministrador = usuarioAdministrador;
        this.fechaInicio = LocalDateTime.now();
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public Empresa getEmpresa() { return empresa; }
    public void setEmpresa(Empresa empresa) { this.empresa = empresa; }

    public Usuario getUsuarioAdministrador() { return usuarioAdministrador; }
    public void setUsuarioAdministrador(Usuario usuarioAdministrador) { this.usuarioAdministrador = usuarioAdministrador; }

    public LocalDateTime getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(LocalDateTime fechaInicio) { this.fechaInicio = fechaInicio; }

    public LocalDateTime getFechaActualizacion() { return fechaActualizacion; }
    public void setFechaActualizacion(LocalDateTime fechaActualizacion) { this.fechaActualizacion = fechaActualizacion; }

    public LocalDateTime getFechaFinalizacion() { return fechaFinalizacion; }
    public void setFechaFinalizacion(LocalDateTime fechaFinalizacion) { this.fechaFinalizacion = fechaFinalizacion; }

    public EstadoInventario getEstado() { return estado; }
    public void setEstado(EstadoInventario estado) { this.estado = estado; }

    public Integer getTotalSectores() { return totalSectores; }
    public void setTotalSectores(Integer totalSectores) { this.totalSectores = totalSectores; }

    public Integer getSectoresCompletados() { return sectoresCompletados; }
    public void setSectoresCompletados(Integer sectoresCompletados) { this.sectoresCompletados = sectoresCompletados; }

    public Integer getSectoresEnProgreso() { return sectoresEnProgreso; }
    public void setSectoresEnProgreso(Integer sectoresEnProgreso) { this.sectoresEnProgreso = sectoresEnProgreso; }

    public Integer getSectoresPendientes() { return sectoresPendientes; }
    public void setSectoresPendientes(Integer sectoresPendientes) { this.sectoresPendientes = sectoresPendientes; }

    public Double getPorcentajeCompletado() { return porcentajeCompletado; }
    public void setPorcentajeCompletado(Double porcentajeCompletado) { this.porcentajeCompletado = porcentajeCompletado; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public List<ConteoSector> getConteosSectores() { return conteosSectores; }
    public void setConteosSectores(List<ConteoSector> conteosSectores) { this.conteosSectores = conteosSectores; }
}
