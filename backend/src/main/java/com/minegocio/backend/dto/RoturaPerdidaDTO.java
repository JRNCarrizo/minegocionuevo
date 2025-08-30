package com.minegocio.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public class RoturaPerdidaDTO {

    @NotNull(message = "La fecha es obligatoria")
    private LocalDateTime fecha;

    @NotNull(message = "La cantidad es obligatoria")
    @Min(value = 1, message = "La cantidad debe ser mayor a 0")
    private Integer cantidad;

    private String observaciones;

    // ID del producto (opcional, puede ser null para productos no registrados)
    private Long productoId;

    // Descripción del producto (para productos no registrados)
    private String descripcionProducto;

    // Código personalizado del producto
    private String codigoPersonalizado;

    // Zona horaria del usuario (ej: "America/Argentina/Buenos_Aires", "UTC", etc.)
    private String zonaHoraria;

    // Constructores
    public RoturaPerdidaDTO() {}

    public RoturaPerdidaDTO(LocalDateTime fecha, Integer cantidad) {
        this.fecha = fecha;
        this.cantidad = cantidad;
    }

    // Getters y Setters
    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    public Long getProductoId() {
        return productoId;
    }

    public void setProductoId(Long productoId) {
        this.productoId = productoId;
    }

    public String getDescripcionProducto() {
        return descripcionProducto;
    }

    public void setDescripcionProducto(String descripcionProducto) {
        this.descripcionProducto = descripcionProducto;
    }

    public String getCodigoPersonalizado() {
        return codigoPersonalizado;
    }

    public void setCodigoPersonalizado(String codigoPersonalizado) {
        this.codigoPersonalizado = codigoPersonalizado;
    }

    public String getZonaHoraria() {
        return zonaHoraria;
    }

    public void setZonaHoraria(String zonaHoraria) {
        this.zonaHoraria = zonaHoraria;
    }
}
