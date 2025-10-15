package com.minegocio.backend.dto;

import java.time.LocalDateTime;

public class HistorialMovimientoStockResponseDTO {
    
    private Long id;
    private Long productoId;
    private String nombreProducto;
    private String codigoPersonalizado;
    private Long sectorOrigenId;
    private String nombreSectorOrigen;
    private Long sectorDestinoId;
    private String nombreSectorDestino;
    private Integer cantidad;
    private String tipoMovimiento;
    private String descripcionTipoMovimiento;
    private Long usuarioId;
    private String nombreUsuario;
    private LocalDateTime fechaMovimiento;
    private String observaciones;
    
    // Constructores
    public HistorialMovimientoStockResponseDTO() {}
    
    public HistorialMovimientoStockResponseDTO(Long id, Long productoId, String nombreProducto, 
                                             String codigoPersonalizado, Long sectorOrigenId, 
                                             String nombreSectorOrigen, Long sectorDestinoId, 
                                             String nombreSectorDestino, Integer cantidad, 
                                             String tipoMovimiento, String descripcionTipoMovimiento,
                                             Long usuarioId, String nombreUsuario, 
                                             LocalDateTime fechaMovimiento, String observaciones) {
        this.id = id;
        this.productoId = productoId;
        this.nombreProducto = nombreProducto;
        this.codigoPersonalizado = codigoPersonalizado;
        this.sectorOrigenId = sectorOrigenId;
        this.nombreSectorOrigen = nombreSectorOrigen;
        this.sectorDestinoId = sectorDestinoId;
        this.nombreSectorDestino = nombreSectorDestino;
        this.cantidad = cantidad;
        this.tipoMovimiento = tipoMovimiento;
        this.descripcionTipoMovimiento = descripcionTipoMovimiento;
        this.usuarioId = usuarioId;
        this.nombreUsuario = nombreUsuario;
        this.fechaMovimiento = fechaMovimiento;
        this.observaciones = observaciones;
    }
    
    // Getters y Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public Long getProductoId() {
        return productoId;
    }
    
    public void setProductoId(Long productoId) {
        this.productoId = productoId;
    }
    
    public String getNombreProducto() {
        return nombreProducto;
    }
    
    public void setNombreProducto(String nombreProducto) {
        this.nombreProducto = nombreProducto;
    }
    
    public String getCodigoPersonalizado() {
        return codigoPersonalizado;
    }
    
    public void setCodigoPersonalizado(String codigoPersonalizado) {
        this.codigoPersonalizado = codigoPersonalizado;
    }
    
    public Long getSectorOrigenId() {
        return sectorOrigenId;
    }
    
    public void setSectorOrigenId(Long sectorOrigenId) {
        this.sectorOrigenId = sectorOrigenId;
    }
    
    public String getNombreSectorOrigen() {
        return nombreSectorOrigen;
    }
    
    public void setNombreSectorOrigen(String nombreSectorOrigen) {
        this.nombreSectorOrigen = nombreSectorOrigen;
    }
    
    public Long getSectorDestinoId() {
        return sectorDestinoId;
    }
    
    public void setSectorDestinoId(Long sectorDestinoId) {
        this.sectorDestinoId = sectorDestinoId;
    }
    
    public String getNombreSectorDestino() {
        return nombreSectorDestino;
    }
    
    public void setNombreSectorDestino(String nombreSectorDestino) {
        this.nombreSectorDestino = nombreSectorDestino;
    }
    
    public Integer getCantidad() {
        return cantidad;
    }
    
    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }
    
    public String getTipoMovimiento() {
        return tipoMovimiento;
    }
    
    public void setTipoMovimiento(String tipoMovimiento) {
        this.tipoMovimiento = tipoMovimiento;
    }
    
    public String getDescripcionTipoMovimiento() {
        return descripcionTipoMovimiento;
    }
    
    public void setDescripcionTipoMovimiento(String descripcionTipoMovimiento) {
        this.descripcionTipoMovimiento = descripcionTipoMovimiento;
    }
    
    public Long getUsuarioId() {
        return usuarioId;
    }
    
    public void setUsuarioId(Long usuarioId) {
        this.usuarioId = usuarioId;
    }
    
    public String getNombreUsuario() {
        return nombreUsuario;
    }
    
    public void setNombreUsuario(String nombreUsuario) {
        this.nombreUsuario = nombreUsuario;
    }
    
    public LocalDateTime getFechaMovimiento() {
        return fechaMovimiento;
    }
    
    public void setFechaMovimiento(LocalDateTime fechaMovimiento) {
        this.fechaMovimiento = fechaMovimiento;
    }
    
    public String getObservaciones() {
        return observaciones;
    }
    
    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }
}
