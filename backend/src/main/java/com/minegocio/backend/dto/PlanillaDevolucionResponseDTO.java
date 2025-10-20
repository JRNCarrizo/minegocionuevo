package com.minegocio.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO de respuesta para planillas de devolución
 */
public class PlanillaDevolucionResponseDTO {

    private Long id;
    private String numeroPlanilla;
    private String observaciones;
    private String transporte;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fechaPlanilla;
    
    private Integer totalProductos;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fechaCreacion;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fechaActualizacion;
    
    private List<DetallePlanillaDevolucionResponseDTO> detalles;
    
    // Campos de verificación
    private String estado;
    private String usuarioVerificacion;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fechaVerificacion;

    // Constructores
    public PlanillaDevolucionResponseDTO() {}

    public PlanillaDevolucionResponseDTO(Long id, String numeroPlanilla, String observaciones, String transporte, LocalDateTime fechaPlanilla, Integer totalProductos, LocalDateTime fechaCreacion, LocalDateTime fechaActualizacion, List<DetallePlanillaDevolucionResponseDTO> detalles) {
        this.id = id;
        this.numeroPlanilla = numeroPlanilla;
        this.observaciones = observaciones;
        this.transporte = transporte;
        this.fechaPlanilla = fechaPlanilla;
        this.totalProductos = totalProductos;
        this.fechaCreacion = fechaCreacion;
        this.fechaActualizacion = fechaActualizacion;
        this.detalles = detalles;
    }

    public PlanillaDevolucionResponseDTO(Long id, String numeroPlanilla, String observaciones, String transporte, LocalDateTime fechaPlanilla, Integer totalProductos, LocalDateTime fechaCreacion, LocalDateTime fechaActualizacion, List<DetallePlanillaDevolucionResponseDTO> detalles, String estado, String usuarioVerificacion, LocalDateTime fechaVerificacion) {
        this.id = id;
        this.numeroPlanilla = numeroPlanilla;
        this.observaciones = observaciones;
        this.transporte = transporte;
        this.fechaPlanilla = fechaPlanilla;
        this.totalProductos = totalProductos;
        this.fechaCreacion = fechaCreacion;
        this.fechaActualizacion = fechaActualizacion;
        this.detalles = detalles;
        this.estado = estado;
        this.usuarioVerificacion = usuarioVerificacion;
        this.fechaVerificacion = fechaVerificacion;
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

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public LocalDateTime getFechaActualizacion() { return fechaActualizacion; }
    public void setFechaActualizacion(LocalDateTime fechaActualizacion) { this.fechaActualizacion = fechaActualizacion; }

    public List<DetallePlanillaDevolucionResponseDTO> getDetalles() { return detalles; }
    public void setDetalles(List<DetallePlanillaDevolucionResponseDTO> detalles) { this.detalles = detalles; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public String getUsuarioVerificacion() { return usuarioVerificacion; }
    public void setUsuarioVerificacion(String usuarioVerificacion) { this.usuarioVerificacion = usuarioVerificacion; }

    public LocalDateTime getFechaVerificacion() { return fechaVerificacion; }
    public void setFechaVerificacion(LocalDateTime fechaVerificacion) { this.fechaVerificacion = fechaVerificacion; }
}
