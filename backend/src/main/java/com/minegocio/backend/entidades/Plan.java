package com.minegocio.backend.entidades;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import jakarta.validation.constraints.Size;

/**
 * Entidad que representa un plan de suscripción
 */
@Entity
@Table(name = "planes")
public class Plan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El nombre del plan es obligatorio")
    @Size(max = 100, message = "El nombre no puede exceder 100 caracteres")
    @Column(nullable = false, length = 100)
    private String nombre;

    @Size(max = 500, message = "La descripción no puede exceder 500 caracteres")
    @Column(length = 500)
    private String descripcion;

    @NotNull(message = "El precio es obligatorio")
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal precio;

    @Enumerated(EnumType.STRING)
    @Column(name = "periodo", nullable = false)
    private PeriodoPlan periodo = PeriodoPlan.MENSUAL;

    @Column(name = "activo")
    private Boolean activo = true;

    @Column(name = "destacado")
    private Boolean destacado = false;

    @Column(name = "orden")
    private Integer orden = 0;

    // Límites del plan
    @Column(name = "max_productos")
    private Integer maxProductos;

    @Column(name = "max_usuarios")
    private Integer maxUsuarios;

    @Column(name = "max_clientes")
    private Integer maxClientes;

    @Column(name = "max_almacenamiento_gb")
    private Integer maxAlmacenamientoGB;

    // Características del plan
    @Column(name = "personalizacion_completa")
    private Boolean personalizacionCompleta = false;

    @Column(name = "estadisticas_avanzadas")
    private Boolean estadisticasAvanzadas = false;

    @Column(name = "soporte_prioritario")
    private Boolean soportePrioritario = false;

    @Column(name = "integraciones_avanzadas")
    private Boolean integracionesAvanzadas = false;

    @Column(name = "backup_automatico")
    private Boolean backupAutomatico = false;

    @Column(name = "dominio_personalizado")
    private Boolean dominioPersonalizado = false;

    @Column(name = "plan_por_defecto")
    private Boolean planPorDefecto = false;

    // Relaciones
    @OneToMany(mappedBy = "plan", cascade = CascadeType.ALL)
    private Set<Suscripcion> suscripciones = new HashSet<>();

    // Timestamps
    @CreationTimestamp
    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion;

    @UpdateTimestamp
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    // Constructores
    public Plan() {}

    public Plan(String nombre, String descripcion, BigDecimal precio, PeriodoPlan periodo) {
        this.nombre = nombre;
        this.descripcion = descripcion;
        this.precio = precio;
        this.periodo = periodo;
    }

    // Enum para períodos de plan
    public enum PeriodoPlan {
        MENSUAL, TRIMESTRAL, SEMESTRAL, ANUAL
    }

    // Métodos de utilidad
    public BigDecimal getPrecioAnual() {
        switch (periodo) {
            case MENSUAL:
                return precio.multiply(new BigDecimal("12"));
            case TRIMESTRAL:
                return precio.multiply(new BigDecimal("4"));
            case SEMESTRAL:
                return precio.multiply(new BigDecimal("2"));
            case ANUAL:
                return precio;
            default:
                return precio;
        }
    }

    public String getPeriodoTexto() {
        switch (periodo) {
            case MENSUAL:
                return "mes";
            case TRIMESTRAL:
                return "trimestre";
            case SEMESTRAL:
                return "semestre";
            case ANUAL:
                return "año";
            default:
                return "mes";
        }
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public BigDecimal getPrecio() { return precio; }
    public void setPrecio(BigDecimal precio) { this.precio = precio; }

    public PeriodoPlan getPeriodo() { return periodo; }
    public void setPeriodo(PeriodoPlan periodo) { this.periodo = periodo; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }

    public Boolean getDestacado() { return destacado; }
    public void setDestacado(Boolean destacado) { this.destacado = destacado; }

    public Integer getOrden() { return orden; }
    public void setOrden(Integer orden) { this.orden = orden; }

    public Integer getMaxProductos() { return maxProductos; }
    public void setMaxProductos(Integer maxProductos) { this.maxProductos = maxProductos; }

    public Integer getMaxUsuarios() { return maxUsuarios; }
    public void setMaxUsuarios(Integer maxUsuarios) { this.maxUsuarios = maxUsuarios; }

    public Integer getMaxClientes() { return maxClientes; }
    public void setMaxClientes(Integer maxClientes) { this.maxClientes = maxClientes; }

    public Integer getMaxAlmacenamientoGB() { return maxAlmacenamientoGB; }
    public void setMaxAlmacenamientoGB(Integer maxAlmacenamientoGB) { this.maxAlmacenamientoGB = maxAlmacenamientoGB; }

    public Boolean getPersonalizacionCompleta() { return personalizacionCompleta; }
    public void setPersonalizacionCompleta(Boolean personalizacionCompleta) { this.personalizacionCompleta = personalizacionCompleta; }

    public Boolean getEstadisticasAvanzadas() { return estadisticasAvanzadas; }
    public void setEstadisticasAvanzadas(Boolean estadisticasAvanzadas) { this.estadisticasAvanzadas = estadisticasAvanzadas; }

    public Boolean getSoportePrioritario() { return soportePrioritario; }
    public void setSoportePrioritario(Boolean soportePrioritario) { this.soportePrioritario = soportePrioritario; }

    public Boolean getIntegracionesAvanzadas() { return integracionesAvanzadas; }
    public void setIntegracionesAvanzadas(Boolean integracionesAvanzadas) { this.integracionesAvanzadas = integracionesAvanzadas; }

    public Boolean getBackupAutomatico() { return backupAutomatico; }
    public void setBackupAutomatico(Boolean backupAutomatico) { this.backupAutomatico = backupAutomatico; }

    public Boolean getDominioPersonalizado() { return dominioPersonalizado; }
    public void setDominioPersonalizado(Boolean dominioPersonalizado) { this.dominioPersonalizado = dominioPersonalizado; }

    public Boolean getPlanPorDefecto() { return planPorDefecto; }
    public void setPlanPorDefecto(Boolean planPorDefecto) { this.planPorDefecto = planPorDefecto; }

    public Set<Suscripcion> getSuscripciones() { return suscripciones; }
    public void setSuscripciones(Set<Suscripcion> suscripciones) { this.suscripciones = suscripciones; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public LocalDateTime getFechaActualizacion() { return fechaActualizacion; }
    public void setFechaActualizacion(LocalDateTime fechaActualizacion) { this.fechaActualizacion = fechaActualizacion; }
} 