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
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fechaPlanilla;
    
    private Integer totalProductos;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fechaCreacion;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fechaActualizacion;
    
    private List<DetallePlanillaDevolucionResponseDTO> detalles;

    // Constructores
    public PlanillaDevolucionResponseDTO() {}

    public PlanillaDevolucionResponseDTO(Long id, String numeroPlanilla, String observaciones, LocalDateTime fechaPlanilla, Integer totalProductos, LocalDateTime fechaCreacion, LocalDateTime fechaActualizacion, List<DetallePlanillaDevolucionResponseDTO> detalles) {
        this.id = id;
        this.numeroPlanilla = numeroPlanilla;
        this.observaciones = observaciones;
        this.fechaPlanilla = fechaPlanilla;
        this.totalProductos = totalProductos;
        this.fechaCreacion = fechaCreacion;
        this.fechaActualizacion = fechaActualizacion;
        this.detalles = detalles;
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNumeroPlanilla() { return numeroPlanilla; }
    public void setNumeroPlanilla(String numeroPlanilla) { this.numeroPlanilla = numeroPlanilla; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

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
}
