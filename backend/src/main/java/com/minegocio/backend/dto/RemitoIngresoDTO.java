package com.minegocio.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;
import java.util.List;

public class RemitoIngresoDTO {
    
    private Long id;
    private String numeroRemito;
    
    private String fechaRemito;
    
    private String observaciones;
    private Integer totalProductos;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fechaCreacion;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fechaActualizacion;
    private Long empresaId;
    private Long usuarioId;
    private List<DetalleRemitoIngresoDTO> detalles;
    private String zonaHoraria;
    
    // Constructores
    public RemitoIngresoDTO() {}
    
    public RemitoIngresoDTO(Long id, String numeroRemito, String fechaRemito, String observaciones,
                            Integer totalProductos, LocalDateTime fechaCreacion, LocalDateTime fechaActualizacion,
                            Long empresaId, Long usuarioId, List<DetalleRemitoIngresoDTO> detalles, String zonaHoraria) {
        this.id = id;
        this.numeroRemito = numeroRemito;
        this.fechaRemito = fechaRemito;
        this.observaciones = observaciones;
        this.totalProductos = totalProductos;
        this.fechaCreacion = fechaCreacion;
        this.fechaActualizacion = fechaActualizacion;
        this.empresaId = empresaId;
        this.usuarioId = usuarioId;
        this.detalles = detalles;
        this.zonaHoraria = zonaHoraria;
    }
    
    // Getters y Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getNumeroRemito() {
        return numeroRemito;
    }
    
    public void setNumeroRemito(String numeroRemito) {
        this.numeroRemito = numeroRemito;
    }
    
    public String getFechaRemito() {
        return fechaRemito;
    }
    
    public void setFechaRemito(String fechaRemito) {
        this.fechaRemito = fechaRemito;
    }
    
    public String getObservaciones() {
        return observaciones;
    }
    
    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }
    
    public Integer getTotalProductos() {
        return totalProductos;
    }
    
    public void setTotalProductos(Integer totalProductos) {
        this.totalProductos = totalProductos;
    }
    
    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }
    
    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }
    
    public LocalDateTime getFechaActualizacion() {
        return fechaActualizacion;
    }
    
    public void setFechaActualizacion(LocalDateTime fechaActualizacion) {
        this.fechaActualizacion = fechaActualizacion;
    }
    
    public Long getEmpresaId() {
        return empresaId;
    }
    
    public void setEmpresaId(Long empresaId) {
        this.empresaId = empresaId;
    }
    
    public Long getUsuarioId() {
        return usuarioId;
    }
    
    public void setUsuarioId(Long usuarioId) {
        this.usuarioId = usuarioId;
    }
    
    public List<DetalleRemitoIngresoDTO> getDetalles() {
        return detalles;
    }
    
    public void setDetalles(List<DetalleRemitoIngresoDTO> detalles) {
        this.detalles = detalles;
    }
    
    public String getZonaHoraria() {
        return zonaHoraria;
    }
    
    public void setZonaHoraria(String zonaHoraria) {
        this.zonaHoraria = zonaHoraria;
    }
}
