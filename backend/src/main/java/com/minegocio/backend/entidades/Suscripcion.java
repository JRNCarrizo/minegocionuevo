package com.minegocio.backend.entidades;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Entidad que representa una suscripción de una empresa a un plan
 */
@Entity
@Table(name = "suscripciones")
public class Suscripcion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relaciones
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false)
    private Plan plan;

    // Estado de la suscripción
    @Enumerated(EnumType.STRING)
    @Column(name = "estado", nullable = false)
    private EstadoSuscripcion estado = EstadoSuscripcion.ACTIVA;

    // Fechas importantes
    @Column(name = "fecha_inicio", nullable = false)
    private LocalDateTime fechaInicio;

    @Column(name = "fecha_fin")
    private LocalDateTime fechaFin;

    @Column(name = "fecha_cancelacion")
    private LocalDateTime fechaCancelacion;

    @Column(name = "fecha_renovacion")
    private LocalDateTime fechaRenovacion;

    // Información de pago
    @Column(name = "precio", precision = 10, scale = 2)
    private BigDecimal precio;

    @Column(name = "moneda", length = 3)
    private String moneda = "USD";

    @Column(name = "metodo_pago", length = 50)
    private String metodoPago;

    @Column(name = "referencia_pago", length = 100)
    private String referenciaPago;

    @Column(name = "facturado")
    private Boolean facturado = false;

    // Configuración de renovación
    @Column(name = "renovacion_automatica")
    private Boolean renovacionAutomatica = true;

    @Column(name = "notificar_antes_renovacion")
    private Boolean notificarAntesRenovacion = true;

    @Column(name = "dias_notificacion_renovacion")
    private Integer diasNotificacionRenovacion = 7;

    // Información adicional
    @Column(name = "notas", length = 1000)
    private String notas;

    @Column(name = "motivo_cancelacion", length = 500)
    private String motivoCancelacion;

    // Timestamps
    @CreationTimestamp
    @Column(name = "fecha_creacion", updatable = false)
    private LocalDateTime fechaCreacion;

    @UpdateTimestamp
    @Column(name = "fecha_actualizacion")
    private LocalDateTime fechaActualizacion;

    // Constructores
    public Suscripcion() {}

    public Suscripcion(Empresa empresa, Plan plan, LocalDateTime fechaInicio) {
        this.empresa = empresa;
        this.plan = plan;
        this.fechaInicio = fechaInicio;
        this.precio = plan.getPrecio();
        this.moneda = "USD";
    }

    // Enum para estados de suscripción
    public enum EstadoSuscripcion {
        ACTIVA, SUSPENDIDA, CANCELADA, PENDIENTE_PAGO, EXPIRADA
    }

    // Métodos de utilidad
    public boolean estaActiva() {
        return EstadoSuscripcion.ACTIVA.equals(this.estado);
    }

    public boolean estaExpirada() {
        return fechaFin != null && LocalDateTime.now().isAfter(fechaFin);
    }

    public boolean estaPorExpirar() {
        if (fechaFin == null) return false;
        LocalDateTime fechaLimite = fechaFin.minusDays(diasNotificacionRenovacion);
        return LocalDateTime.now().isAfter(fechaLimite) && !LocalDateTime.now().isAfter(fechaFin);
    }

    public long getDiasRestantes() {
        if (fechaFin == null) return -1;
        LocalDateTime ahora = LocalDateTime.now();
        if (ahora.isAfter(fechaFin)) return 0;
        return java.time.Duration.between(ahora, fechaFin).toDays();
    }

    public void cancelar(String motivo) {
        this.estado = EstadoSuscripcion.CANCELADA;
        this.fechaCancelacion = LocalDateTime.now();
        this.motivoCancelacion = motivo;
        this.renovacionAutomatica = false;
    }

    public void suspender() {
        this.estado = EstadoSuscripcion.SUSPENDIDA;
    }

    public void reactivar() {
        this.estado = EstadoSuscripcion.ACTIVA;
    }

    public void renovar() {
        if (fechaFin != null) {
            this.fechaInicio = fechaFin;
            this.fechaFin = calcularNuevaFechaFin();
            this.fechaRenovacion = LocalDateTime.now();
            this.estado = EstadoSuscripcion.ACTIVA;
        }
    }

    private LocalDateTime calcularNuevaFechaFin() {
        LocalDateTime fechaBase = fechaInicio != null ? fechaInicio : LocalDateTime.now();
        switch (plan.getPeriodo()) {
            case MENSUAL:
                return fechaBase.plusMonths(1);
            case TRIMESTRAL:
                return fechaBase.plusMonths(3);
            case SEMESTRAL:
                return fechaBase.plusMonths(6);
            case ANUAL:
                return fechaBase.plusYears(1);
            default:
                return fechaBase.plusMonths(1);
        }
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Empresa getEmpresa() { return empresa; }
    public void setEmpresa(Empresa empresa) { this.empresa = empresa; }

    public Plan getPlan() { return plan; }
    public void setPlan(Plan plan) { this.plan = plan; }

    public EstadoSuscripcion getEstado() { return estado; }
    public void setEstado(EstadoSuscripcion estado) { this.estado = estado; }

    public LocalDateTime getFechaInicio() { return fechaInicio; }
    public void setFechaInicio(LocalDateTime fechaInicio) { this.fechaInicio = fechaInicio; }

    public LocalDateTime getFechaFin() { return fechaFin; }
    public void setFechaFin(LocalDateTime fechaFin) { this.fechaFin = fechaFin; }

    public LocalDateTime getFechaCancelacion() { return fechaCancelacion; }
    public void setFechaCancelacion(LocalDateTime fechaCancelacion) { this.fechaCancelacion = fechaCancelacion; }

    public LocalDateTime getFechaRenovacion() { return fechaRenovacion; }
    public void setFechaRenovacion(LocalDateTime fechaRenovacion) { this.fechaRenovacion = fechaRenovacion; }

    public BigDecimal getPrecio() { return precio; }
    public void setPrecio(BigDecimal precio) { this.precio = precio; }

    public String getMoneda() { return moneda; }
    public void setMoneda(String moneda) { this.moneda = moneda; }

    public String getMetodoPago() { return metodoPago; }
    public void setMetodoPago(String metodoPago) { this.metodoPago = metodoPago; }

    public String getReferenciaPago() { return referenciaPago; }
    public void setReferenciaPago(String referenciaPago) { this.referenciaPago = referenciaPago; }

    public Boolean getFacturado() { return facturado; }
    public void setFacturado(Boolean facturado) { this.facturado = facturado; }

    public Boolean getRenovacionAutomatica() { return renovacionAutomatica; }
    public void setRenovacionAutomatica(Boolean renovacionAutomatica) { this.renovacionAutomatica = renovacionAutomatica; }

    public Boolean getNotificarAntesRenovacion() { return notificarAntesRenovacion; }
    public void setNotificarAntesRenovacion(Boolean notificarAntesRenovacion) { this.notificarAntesRenovacion = notificarAntesRenovacion; }

    public Integer getDiasNotificacionRenovacion() { return diasNotificacionRenovacion; }
    public void setDiasNotificacionRenovacion(Integer diasNotificacionRenovacion) { this.diasNotificacionRenovacion = diasNotificacionRenovacion; }

    public String getNotas() { return notas; }
    public void setNotas(String notas) { this.notas = notas; }

    public String getMotivoCancelacion() { return motivoCancelacion; }
    public void setMotivoCancelacion(String motivoCancelacion) { this.motivoCancelacion = motivoCancelacion; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public LocalDateTime getFechaActualizacion() { return fechaActualizacion; }
    public void setFechaActualizacion(LocalDateTime fechaActualizacion) { this.fechaActualizacion = fechaActualizacion; }
} 