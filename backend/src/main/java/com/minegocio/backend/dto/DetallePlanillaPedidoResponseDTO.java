package com.minegocio.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;

public class DetallePlanillaPedidoResponseDTO {
    private Long id;
    private String numeroPersonalizado;
    private String descripcion;
    private Integer cantidad;
    private String observaciones;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fechaCreacion;

    // Constructor
    public DetallePlanillaPedidoResponseDTO() {}

    public DetallePlanillaPedidoResponseDTO(Long id, String numeroPersonalizado, String descripcion, 
                                          Integer cantidad, String observaciones, LocalDateTime fechaCreacion) {
        this.id = id;
        this.numeroPersonalizado = numeroPersonalizado;
        this.descripcion = descripcion;
        this.cantidad = cantidad;
        this.observaciones = observaciones;
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
}
