package com.minegocio.backend.dto;

import java.time.LocalDateTime;

public class DetalleRemitoIngresoDTO {
    
    private Long id;
    private Long remitoIngresoId;
    private Long productoId;
    private String codigoPersonalizado;
    private String descripcion;
    private Integer cantidad;
    private String observaciones;
    private String estadoProducto; // "BUEN_ESTADO", "MAL_ESTADO", "ROTO", "DEFECTUOSO"
    
    private LocalDateTime fechaCreacion;
    
    // Constructores
    public DetalleRemitoIngresoDTO() {}
    
    public DetalleRemitoIngresoDTO(Long id, Long remitoIngresoId, Long productoId, String codigoPersonalizado,
                                  String descripcion, Integer cantidad, String observaciones, String estadoProducto, LocalDateTime fechaCreacion) {
        this.id = id;
        this.remitoIngresoId = remitoIngresoId;
        this.productoId = productoId;
        this.codigoPersonalizado = codigoPersonalizado;
        this.descripcion = descripcion;
        this.cantidad = cantidad;
        this.observaciones = observaciones;
        this.estadoProducto = estadoProducto;
        this.fechaCreacion = fechaCreacion;
    }
    
    // Getters y Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getRemitoIngresoId() {
        return remitoIngresoId;
    }
    
    public void setRemitoIngresoId(Long remitoIngresoId) {
        this.remitoIngresoId = remitoIngresoId;
    }
    
    public Long getProductoId() {
        return productoId;
    }
    
    public void setProductoId(Long productoId) {
        this.productoId = productoId;
    }
    
    public String getCodigoPersonalizado() {
        return codigoPersonalizado;
    }
    
    public void setCodigoPersonalizado(String codigoPersonalizado) {
        this.codigoPersonalizado = codigoPersonalizado;
    }
    
    public String getDescripcion() {
        return descripcion;
    }
    
    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
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
    
    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }
    
    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public String getEstadoProducto() {
        return estadoProducto;
    }
    
    public void setEstadoProducto(String estadoProducto) {
        this.estadoProducto = estadoProducto;
    }
}

