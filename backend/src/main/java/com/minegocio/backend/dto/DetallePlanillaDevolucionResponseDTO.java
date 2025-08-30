package com.minegocio.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.time.LocalDateTime;

/**
 * DTO de respuesta para detalles de planillas de devolución
 */
public class DetallePlanillaDevolucionResponseDTO {

    private Long id;
    private String numeroPersonalizado;
    private String descripcion;
    private Integer cantidad;
    private String observaciones;
    private String estadoProducto;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fechaCreacion;

    // Constructores
    public DetallePlanillaDevolucionResponseDTO() {}

    public DetallePlanillaDevolucionResponseDTO(Long id, String numeroPersonalizado, String descripcion, Integer cantidad, String observaciones, String estadoProducto, LocalDateTime fechaCreacion) {
        this.id = id;
        this.numeroPersonalizado = numeroPersonalizado;
        this.descripcion = descripcion;
        this.cantidad = cantidad;
        this.observaciones = observaciones;
        this.estadoProducto = estadoProducto;
        this.fechaCreacion = fechaCreacion;
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNumeroPersonalizado() { return numeroPersonalizado; }
    public void setNumeroPersonalizado(String numeroPersonalizado) { this.numeroPersonalizado = numeroPersonalizado; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public String getEstadoProducto() { return estadoProducto; }
    public void setEstadoProducto(String estadoProducto) { this.estadoProducto = estadoProducto; }
}
