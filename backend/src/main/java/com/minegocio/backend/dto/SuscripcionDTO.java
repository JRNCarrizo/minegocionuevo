package com.minegocio.backend.dto;

import com.minegocio.backend.entidades.Suscripcion;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO para la gestión de suscripciones
 */
public class SuscripcionDTO {
    private Long id;
    private Long empresaId;
    private String empresaNombre;
    private String empresaSubdominio;
    private Long planId;
    private String planNombre;
    private String estado;
    private LocalDateTime fechaInicio;
    private LocalDateTime fechaFin;
    private LocalDateTime fechaCancelacion;
    private LocalDateTime fechaRenovacion;
    private BigDecimal precio;
    private String moneda;
    private String metodoPago;
    private String referenciaPago;
    private Boolean facturado;
    private Boolean renovacionAutomatica;
    private Boolean notificarAntesRenovacion;
    private Integer diasNotificacionRenovacion;
    private String notas;
    private String motivoCancelacion;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;
    
    // Campos calculados
    private Long diasRestantes;
    private Boolean estaActiva;
    private Boolean estaExpirada;
    private Boolean estaPorExpirar;

    // Constructores
    public SuscripcionDTO() {}

    public SuscripcionDTO(Suscripcion suscripcion) {
        this.id = suscripcion.getId();
        this.empresaId = suscripcion.getEmpresa().getId();
        this.empresaNombre = suscripcion.getEmpresa().getNombre();
        this.empresaSubdominio = suscripcion.getEmpresa().getSubdominio();
        this.planId = suscripcion.getPlan().getId();
        this.planNombre = suscripcion.getPlan().getNombre();
        this.estado = suscripcion.getEstado().name();
        this.fechaInicio = suscripcion.getFechaInicio();
        this.fechaFin = suscripcion.getFechaFin();
        this.fechaCancelacion = suscripcion.getFechaCancelacion();
        this.fechaRenovacion = suscripcion.getFechaRenovacion();
        this.precio = suscripcion.getPrecio();
        this.moneda = suscripcion.getMoneda();
        this.metodoPago = suscripcion.getMetodoPago();
        this.referenciaPago = suscripcion.getReferenciaPago();
        this.facturado = suscripcion.getFacturado();
        this.renovacionAutomatica = suscripcion.getRenovacionAutomatica();
        this.notificarAntesRenovacion = suscripcion.getNotificarAntesRenovacion();
        this.diasNotificacionRenovacion = suscripcion.getDiasNotificacionRenovacion();
        this.notas = suscripcion.getNotas();
        this.motivoCancelacion = suscripcion.getMotivoCancelacion();
        this.fechaCreacion = suscripcion.getFechaCreacion();
        this.fechaActualizacion = suscripcion.getFechaActualizacion();
        
        // Campos calculados
        this.diasRestantes = suscripcion.getDiasRestantes();
        this.estaActiva = suscripcion.estaActiva();
        this.estaExpirada = suscripcion.estaExpirada();
        this.estaPorExpirar = suscripcion.estaPorExpirar();
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getEmpresaId() { return empresaId; }
    public void setEmpresaId(Long empresaId) { this.empresaId = empresaId; }

    public String getEmpresaNombre() { return empresaNombre; }
    public void setEmpresaNombre(String empresaNombre) { this.empresaNombre = empresaNombre; }

    public String getEmpresaSubdominio() { return empresaSubdominio; }
    public void setEmpresaSubdominio(String empresaSubdominio) { this.empresaSubdominio = empresaSubdominio; }

    public Long getPlanId() { return planId; }
    public void setPlanId(Long planId) { this.planId = planId; }

    public String getPlanNombre() { return planNombre; }
    public void setPlanNombre(String planNombre) { this.planNombre = planNombre; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

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

    public Long getDiasRestantes() { return diasRestantes; }
    public void setDiasRestantes(Long diasRestantes) { this.diasRestantes = diasRestantes; }

    public Boolean getEstaActiva() { return estaActiva; }
    public void setEstaActiva(Boolean estaActiva) { this.estaActiva = estaActiva; }

    public Boolean getEstaExpirada() { return estaExpirada; }
    public void setEstaExpirada(Boolean estaExpirada) { this.estaExpirada = estaExpirada; }

    public Boolean getEstaPorExpirar() { return estaPorExpirar; }
    public void setEstaPorExpirar(Boolean estaPorExpirar) { this.estaPorExpirar = estaPorExpirar; }
} 