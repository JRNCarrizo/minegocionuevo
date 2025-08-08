package com.minegocio.backend.dto;

import com.minegocio.backend.entidades.Plan;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO para la gestión de planes de suscripción
 */
public class PlanDTO {
    private Long id;
    private String nombre;
    private String descripcion;
    private BigDecimal precio;
    private String periodo;
    private String periodoTexto;
    private BigDecimal precioAnual;
    private Boolean activo;
    private Boolean destacado;
    private Integer orden;
    
    // Límites del plan
    private Integer maxProductos;
    private Integer maxUsuarios;
    private Integer maxClientes;
    private Integer maxAlmacenamientoGB;
    
    // Características del plan
    private Boolean personalizacionCompleta;
    private Boolean estadisticasAvanzadas;
    private Boolean soportePrioritario;
    private Boolean integracionesAvanzadas;
    private Boolean backupAutomatico;
    private Boolean dominioPersonalizado;
    private Boolean planPorDefecto;
    
    // Estadísticas
    private Integer totalSuscripciones;
    private Integer suscripcionesActivas;
    private BigDecimal ingresosTotales;
    
    // Timestamps
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;

    // Constructores
    public PlanDTO() {}

    public PlanDTO(Plan plan) {
        this.id = plan.getId();
        this.nombre = plan.getNombre();
        this.descripcion = plan.getDescripcion();
        this.precio = plan.getPrecio();
        this.periodo = plan.getPeriodo().name();
        this.periodoTexto = plan.getPeriodoTexto();
        this.precioAnual = plan.getPrecioAnual();
        this.activo = plan.getActivo();
        this.destacado = plan.getDestacado();
        this.orden = plan.getOrden();
        this.maxProductos = plan.getMaxProductos();
        this.maxUsuarios = plan.getMaxUsuarios();
        this.maxClientes = plan.getMaxClientes();
        this.maxAlmacenamientoGB = plan.getMaxAlmacenamientoGB();
        this.personalizacionCompleta = plan.getPersonalizacionCompleta();
        this.estadisticasAvanzadas = plan.getEstadisticasAvanzadas();
        this.soportePrioritario = plan.getSoportePrioritario();
        this.integracionesAvanzadas = plan.getIntegracionesAvanzadas();
        this.backupAutomatico = plan.getBackupAutomatico();
        this.dominioPersonalizado = plan.getDominioPersonalizado();
        this.planPorDefecto = plan.getPlanPorDefecto();
        this.fechaCreacion = plan.getFechaCreacion();
        this.fechaActualizacion = plan.getFechaActualizacion();
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

    public String getPeriodo() { return periodo; }
    public void setPeriodo(String periodo) { this.periodo = periodo; }

    public String getPeriodoTexto() { return periodoTexto; }
    public void setPeriodoTexto(String periodoTexto) { this.periodoTexto = periodoTexto; }

    public BigDecimal getPrecioAnual() { return precioAnual; }
    public void setPrecioAnual(BigDecimal precioAnual) { this.precioAnual = precioAnual; }

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

    public Integer getTotalSuscripciones() { return totalSuscripciones; }
    public void setTotalSuscripciones(Integer totalSuscripciones) { this.totalSuscripciones = totalSuscripciones; }

    public Integer getSuscripcionesActivas() { return suscripcionesActivas; }
    public void setSuscripcionesActivas(Integer suscripcionesActivas) { this.suscripcionesActivas = suscripcionesActivas; }

    public BigDecimal getIngresosTotales() { return ingresosTotales; }
    public void setIngresosTotales(BigDecimal ingresosTotales) { this.ingresosTotales = ingresosTotales; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public LocalDateTime getFechaActualizacion() { return fechaActualizacion; }
    public void setFechaActualizacion(LocalDateTime fechaActualizacion) { this.fechaActualizacion = fechaActualizacion; }
} 