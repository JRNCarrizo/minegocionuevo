package com.minegocio.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class RoturaPerdidaResponseDTO {

    private Long id;
    private String fecha;
    private Integer cantidad;
    private String observaciones;
    private String descripcionProducto;
    private String codigoPersonalizado;
    private String nombreUsuario;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fechaCreacion;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fechaActualizacion;

    // Información del producto (si está asociado)
    private Long productoId;
    private String nombreProducto;
    private String codigoProducto;

    // Constructores
    public RoturaPerdidaResponseDTO() {}

    public RoturaPerdidaResponseDTO(Long id, String fecha, Integer cantidad, String observaciones) {
        this.id = id;
        this.fecha = fecha;
        this.cantidad = cantidad;
        this.observaciones = observaciones;
    }

    // Getters y Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFecha() {
        return fecha;
    }

    public void setFecha(String fecha) {
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

    public String getNombreUsuario() {
        return nombreUsuario;
    }

    public void setNombreUsuario(String nombreUsuario) {
        this.nombreUsuario = nombreUsuario;
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

    public String getCodigoProducto() {
        return codigoProducto;
    }

    public void setCodigoProducto(String codigoProducto) {
        this.codigoProducto = codigoProducto;
    }

    // Método para obtener la descripción completa del producto
    public String getDescripcionCompleta() {
        if (nombreProducto != null && !nombreProducto.isEmpty()) {
            return nombreProducto;
        }
        return descripcionProducto != null ? descripcionProducto : "Producto no especificado";
    }

    // Método para obtener el código completo
    public String getCodigoCompleto() {
        if (codigoProducto != null && !codigoProducto.isEmpty()) {
            return codigoProducto;
        }
        return codigoPersonalizado != null ? codigoPersonalizado : "";
    }
}
