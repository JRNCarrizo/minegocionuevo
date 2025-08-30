package com.minegocio.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * DTO para crear un detalle de planilla de devolución
 */
public class DetallePlanillaDevolucionDTO {

    private Long id;

    @NotNull(message = "La descripción es obligatoria")
    @Size(max = 500, message = "La descripción no puede exceder 500 caracteres")
    private String descripcion;

    @NotNull(message = "La cantidad es obligatoria")
    @Min(value = 1, message = "La cantidad debe ser mayor a 0")
    private Integer cantidad;

    @Size(max = 100, message = "El número personalizado no puede exceder 100 caracteres")
    private String numeroPersonalizado;

    @Size(max = 1000, message = "Las observaciones no pueden exceder 1000 caracteres")
    private String observaciones;

    private Long productoId;

    private String estadoProducto = "BUEN_ESTADO";

    // Constructores
    public DetallePlanillaDevolucionDTO() {}

    public DetallePlanillaDevolucionDTO(Long id, String descripcion, Integer cantidad, String numeroPersonalizado, String observaciones, Long productoId, String estadoProducto) {
        this.id = id;
        this.descripcion = descripcion;
        this.cantidad = cantidad;
        this.numeroPersonalizado = numeroPersonalizado;
        this.observaciones = observaciones;
        this.productoId = productoId;
        this.estadoProducto = estadoProducto;
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public Integer getCantidad() { return cantidad; }
    public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }

    public String getNumeroPersonalizado() { return numeroPersonalizado; }
    public void setNumeroPersonalizado(String numeroPersonalizado) { this.numeroPersonalizado = numeroPersonalizado; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public Long getProductoId() { return productoId; }
    public void setProductoId(Long productoId) { this.productoId = productoId; }

    public String getEstadoProducto() { return estadoProducto; }
    public void setEstadoProducto(String estadoProducto) { this.estadoProducto = estadoProducto; }
}
