package com.minegocio.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public class RemitoIngresoDTO {
    
    private Long id;
    private String numeroRemito;
    
    private LocalDateTime fechaRemito;
    
    private String observaciones;
    private Integer totalProductos;
    
    private LocalDateTime fechaCreacion;
    
    private LocalDateTime fechaActualizacion;
    private Long empresaId;
    private Long usuarioId;
    private List<DetalleRemitoIngresoDTO> detalles;
    private String zonaHoraria;
    
    // Constructores
    public RemitoIngresoDTO() {
        System.out.println("🔍 [DTO] Constructor vacío llamado");
    }
    
    public RemitoIngresoDTO(Long id, String numeroRemito, LocalDateTime fechaRemito, String observaciones,
                            Integer totalProductos, LocalDateTime fechaCreacion, LocalDateTime fechaActualizacion,
                            Long empresaId, Long usuarioId, List<DetalleRemitoIngresoDTO> detalles, String zonaHoraria) {
        System.out.println("🔍 [DTO] Constructor con parámetros llamado");
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
        System.out.println("🔍 [DTO] setNumeroRemito: " + numeroRemito);
        this.numeroRemito = numeroRemito;
    }
    
    public LocalDateTime getFechaRemito() {
        return fechaRemito;
    }
    
    public void setFechaRemito(LocalDateTime fechaRemito) {
        System.out.println("🔍 [DTO] setFechaRemito: " + fechaRemito);
        this.fechaRemito = fechaRemito;
    }
    
    public String getObservaciones() {
        return observaciones;
    }
    
    public void setObservaciones(String observaciones) {
        System.out.println("🔍 [DTO] setObservaciones: " + observaciones);
        this.observaciones = observaciones;
    }
    
    public Integer getTotalProductos() {
        return totalProductos;
    }
    
    public void setTotalProductos(Integer totalProductos) {
        System.out.println("🔍 [DTO] setTotalProductos: " + totalProductos);
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
        System.out.println("🔍 [DTO] setDetalles: " + (detalles != null ? detalles.size() : "null"));
        this.detalles = detalles;
    }
    
    public String getZonaHoraria() {
        return zonaHoraria;
    }
    
    public void setZonaHoraria(String zonaHoraria) {
        System.out.println("🔍 [DTO] setZonaHoraria: " + zonaHoraria);
        this.zonaHoraria = zonaHoraria;
    }
}
