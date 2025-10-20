package com.minegocio.backend.entidades;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import com.fasterxml.jackson.annotation.JsonIgnore;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Entidad que representa las planillas de devoluciones realizadas
 */
@Entity
@Table(name = "planillas_devoluciones")
public class PlanillaDevolucion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "numero_planilla", unique = true, nullable = true, length = 8)
    private String numeroPlanilla;

    @Column(length = 1000)
    private String observaciones;

    @Column(length = 500)
    private String transporte;

    @NotNull(message = "La fecha de la planilla es obligatoria")
    @Column(name = "fecha_planilla", nullable = false)
    private LocalDateTime fechaPlanilla;

    @Min(value = 0, message = "El total de productos debe ser mayor o igual a 0")
    @Column(name = "total_productos", nullable = false)
    private Integer totalProductos = 0;

    // Estado de la planilla de devolución
    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false)
    private EstadoPlanilla estado = EstadoPlanilla.PENDIENTE_VERIFICACION;

    // Usuario que verificó la planilla (opcional)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_verificacion_id")
    @JsonIgnore
    private Usuario usuarioVerificacion;

    // Fecha de verificación (opcional)
    @Column(name = "fecha_verificacion")
    private LocalDateTime fechaVerificacion;

    // Relación con empresa
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    @JsonIgnore
    private Empresa empresa;

    // Usuario que creó la planilla
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    @JsonIgnore
    private Usuario usuario;

    // Detalles de la planilla
    @OneToMany(mappedBy = "planillaDevolucion", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<DetallePlanillaDevolucion> detalles = new ArrayList<>();

    // Timestamps
    @CreationTimestamp
    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion;

    @UpdateTimestamp
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    // Constructores
    public PlanillaDevolucion() {}

    public PlanillaDevolucion(Empresa empresa, Usuario usuario, LocalDateTime fechaPlanilla) {
        System.out.println("📋 [ENTITY] Constructor PlanillaDevolucion - Fecha recibida: " + fechaPlanilla);
        this.empresa = empresa;
        this.usuario = usuario;
        this.fechaPlanilla = fechaPlanilla;
        // No generar número de planilla automáticamente - será opcional
        System.out.println("📋 [ENTITY] Fecha asignada a la entidad: " + this.fechaPlanilla);
    }

    // Métodos de utilidad
    public String generarNumeroPlanilla() {
        // Generar número de 8 dígitos basado en timestamp
        long timestamp = System.currentTimeMillis();
        String numero = String.valueOf(timestamp % 100000000); // Últimos 8 dígitos
        return String.format("%08d", Long.parseLong(numero));
    }

    public void calcularTotalProductos() {
        this.totalProductos = detalles.stream()
                .mapToInt(DetallePlanillaDevolucion::getCantidad)
                .sum();
    }

    public void agregarDetalle(DetallePlanillaDevolucion detalle) {
        detalles.add(detalle);
        detalle.setPlanillaDevolucion(this);
        calcularTotalProductos();
    }

    public void removerDetalle(DetallePlanillaDevolucion detalle) {
        detalles.remove(detalle);
        detalle.setPlanillaDevolucion(null);
        calcularTotalProductos();
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNumeroPlanilla() { return numeroPlanilla; }
    public void setNumeroPlanilla(String numeroPlanilla) { this.numeroPlanilla = numeroPlanilla; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public String getTransporte() { return transporte; }
    public void setTransporte(String transporte) { this.transporte = transporte; }

    public LocalDateTime getFechaPlanilla() { return fechaPlanilla; }
    public void setFechaPlanilla(LocalDateTime fechaPlanilla) { this.fechaPlanilla = fechaPlanilla; }

    public Integer getTotalProductos() { return totalProductos; }
    public void setTotalProductos(Integer totalProductos) { this.totalProductos = totalProductos; }

    public Empresa getEmpresa() { return empresa; }
    public void setEmpresa(Empresa empresa) { this.empresa = empresa; }

    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }

    public List<DetallePlanillaDevolucion> getDetalles() { return detalles; }
    public void setDetalles(List<DetallePlanillaDevolucion> detalles) { 
        this.detalles = detalles;
        calcularTotalProductos();
    }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public LocalDateTime getFechaActualizacion() { return fechaActualizacion; }
    public void setFechaActualizacion(LocalDateTime fechaActualizacion) { this.fechaActualizacion = fechaActualizacion; }

    public EstadoPlanilla getEstado() { return estado; }
    public void setEstado(EstadoPlanilla estado) { this.estado = estado; }

    public Usuario getUsuarioVerificacion() { return usuarioVerificacion; }
    public void setUsuarioVerificacion(Usuario usuarioVerificacion) { this.usuarioVerificacion = usuarioVerificacion; }

    public LocalDateTime getFechaVerificacion() { return fechaVerificacion; }
    public void setFechaVerificacion(LocalDateTime fechaVerificacion) { this.fechaVerificacion = fechaVerificacion; }

    /**
     * Enum para el estado de la planilla de devolución
     */
    public enum EstadoPlanilla {
        PENDIENTE_VERIFICACION("Pendiente de Verificación"),
        VERIFICADO("Verificado");

        private final String descripcion;

        EstadoPlanilla(String descripcion) {
            this.descripcion = descripcion;
        }

        public String getDescripcion() {
            return descripcion;
        }
    }
}
