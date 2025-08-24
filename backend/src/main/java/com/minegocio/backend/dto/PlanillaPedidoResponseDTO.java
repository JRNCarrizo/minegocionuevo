package com.minegocio.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class PlanillaPedidoResponseDTO {
    private Long id;
    private String numeroPlanilla;
    private String observaciones;
    private LocalDateTime fechaPlanilla;
    private Integer totalProductos;
    private LocalDateTime fechaCreacion;
    private LocalDateTime fechaActualizacion;
    private List<DetallePlanillaPedidoResponseDTO> detalles;

    // Constructor
    public PlanillaPedidoResponseDTO() {}

    public PlanillaPedidoResponseDTO(Long id, String numeroPlanilla, String observaciones, 
                                   LocalDateTime fechaPlanilla, Integer totalProductos, 
                                   LocalDateTime fechaCreacion, LocalDateTime fechaActualizacion,
                                   List<DetallePlanillaPedidoResponseDTO> detalles) {
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

    public List<DetallePlanillaPedidoResponseDTO> getDetalles() { return detalles; }
    public void setDetalles(List<DetallePlanillaPedidoResponseDTO> detalles) { this.detalles = detalles; }
}
