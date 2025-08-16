package com.minegocio.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * DTO para crear y actualizar detalles de planillas de pedidos
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class DetallePlanillaPedidoDTO {

    private Long id;
    
    private String numeroPersonalizado;
    
    @NotNull(message = "La descripción es obligatoria")
    private String descripcion;
    
    @Min(value = 1, message = "La cantidad debe ser al menos 1")
    private Integer cantidad;
    
    private String observaciones;
    
    private Long planillaPedidoId;
    private Long productoId;

    // Constructores
    public DetallePlanillaPedidoDTO() {}

    public DetallePlanillaPedidoDTO(String descripcion, Integer cantidad) {
        this.descripcion = descripcion;
        this.cantidad = cantidad;
    }

    public DetallePlanillaPedidoDTO(String numeroPersonalizado, String descripcion, Integer cantidad) {
        this.numeroPersonalizado = numeroPersonalizado;
        this.descripcion = descripcion;
        this.cantidad = cantidad;
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

    public Long getPlanillaPedidoId() { return planillaPedidoId; }
    public void setPlanillaPedidoId(Long planillaPedidoId) { this.planillaPedidoId = planillaPedidoId; }

    public Long getProductoId() { return productoId; }
    public void setProductoId(Long productoId) { this.productoId = productoId; }
}
