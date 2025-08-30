package com.minegocio.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO para crear una planilla de devolución
 */
public class PlanillaDevolucionDTO {

    @Size(max = 8, message = "El número de planilla no puede exceder 8 caracteres")
    private String numeroPlanilla;

    @Size(max = 1000, message = "Las observaciones no pueden exceder 1000 caracteres")
    private String observaciones;

    @NotNull(message = "La fecha de la planilla es obligatoria")
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS")
    private LocalDateTime fechaPlanilla;

    @Min(value = 0, message = "El total de productos debe ser mayor o igual a 0")
    private Integer totalProductos = 0;

    private List<DetallePlanillaDevolucionDTO> detalles;

    // Zona horaria del usuario (ej: "America/Argentina/Buenos_Aires", "UTC", etc.)
    private String zonaHoraria;

    // Constructores
    public PlanillaDevolucionDTO() {}

    public PlanillaDevolucionDTO(String numeroPlanilla, String observaciones, LocalDateTime fechaPlanilla, Integer totalProductos, List<DetallePlanillaDevolucionDTO> detalles) {
        this.numeroPlanilla = numeroPlanilla;
        this.observaciones = observaciones;
        this.fechaPlanilla = fechaPlanilla;
        this.totalProductos = totalProductos;
        this.detalles = detalles;
    }

    // Getters y Setters
    public String getNumeroPlanilla() { return numeroPlanilla; }
    public void setNumeroPlanilla(String numeroPlanilla) { this.numeroPlanilla = numeroPlanilla; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public LocalDateTime getFechaPlanilla() { return fechaPlanilla; }
    public void setFechaPlanilla(LocalDateTime fechaPlanilla) { this.fechaPlanilla = fechaPlanilla; }

    public Integer getTotalProductos() { return totalProductos; }
    public void setTotalProductos(Integer totalProductos) { this.totalProductos = totalProductos; }

    public List<DetallePlanillaDevolucionDTO> getDetalles() { return detalles; }
    public void setDetalles(List<DetallePlanillaDevolucionDTO> detalles) { this.detalles = detalles; }

    public String getZonaHoraria() { return zonaHoraria; }
    public void setZonaHoraria(String zonaHoraria) { this.zonaHoraria = zonaHoraria; }
}
