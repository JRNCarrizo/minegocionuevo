package com.minegocio.backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;

/**
 * DTO para crear y actualizar planillas de pedidos
 */
public class PlanillaPedidoDTO {

    private Long id;
    
    @NotNull(message = "El número de planilla es obligatorio")
    private String numeroPlanilla;
    
    private String observaciones;
    
    @NotNull(message = "La fecha de la planilla es obligatoria")
    private LocalDate fechaPlanilla;
    
    @Min(value = 0, message = "El total de productos debe ser mayor o igual a 0")
    private Integer totalProductos;
    
    private Long empresaId;
    private Long usuarioId;
    
    private List<DetallePlanillaPedidoDTO> detalles;

    // Constructores
    public PlanillaPedidoDTO() {}

    public PlanillaPedidoDTO(String numeroPlanilla, LocalDate fechaPlanilla, String observaciones) {
        this.numeroPlanilla = numeroPlanilla;
        this.fechaPlanilla = fechaPlanilla;
        this.observaciones = observaciones;
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNumeroPlanilla() { return numeroPlanilla; }
    public void setNumeroPlanilla(String numeroPlanilla) { this.numeroPlanilla = numeroPlanilla; }

    public String getObservaciones() { return observaciones; }
    public void setObservaciones(String observaciones) { this.observaciones = observaciones; }

    public LocalDate getFechaPlanilla() { return fechaPlanilla; }
    public void setFechaPlanilla(LocalDate fechaPlanilla) { this.fechaPlanilla = fechaPlanilla; }

    public Integer getTotalProductos() { return totalProductos; }
    public void setTotalProductos(Integer totalProductos) { this.totalProductos = totalProductos; }

    public Long getEmpresaId() { return empresaId; }
    public void setEmpresaId(Long empresaId) { this.empresaId = empresaId; }

    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }

    public List<DetallePlanillaPedidoDTO> getDetalles() { return detalles; }
    public void setDetalles(List<DetallePlanillaPedidoDTO> detalles) { this.detalles = detalles; }
}
