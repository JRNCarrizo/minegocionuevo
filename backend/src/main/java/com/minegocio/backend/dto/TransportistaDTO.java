package com.minegocio.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.LocalDateTime;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public class TransportistaDTO {

    private Long id;
    private String codigoInterno;
    private String nombreApellido;
    private String nombreEmpresa;
    private Boolean activo;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fechaCreacion;
    
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime fechaActualizacion;
    
    private Long empresaId;
    private List<VehiculoDTO> vehiculos;

    // Constructores
    public TransportistaDTO() {}

    public TransportistaDTO(Long id, String codigoInterno, String nombreApellido, String nombreEmpresa, Boolean activo, 
                           LocalDateTime fechaCreacion, LocalDateTime fechaActualizacion, 
                           Long empresaId, List<VehiculoDTO> vehiculos) {
        this.id = id;
        this.codigoInterno = codigoInterno;
        this.nombreApellido = nombreApellido;
        this.nombreEmpresa = nombreEmpresa;
        this.activo = activo;
        this.fechaCreacion = fechaCreacion;
        this.fechaActualizacion = fechaActualizacion;
        this.empresaId = empresaId;
        this.vehiculos = vehiculos;
    }

    // Getters y Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCodigoInterno() {
        return codigoInterno;
    }

    public void setCodigoInterno(String codigoInterno) {
        this.codigoInterno = codigoInterno;
    }

    public String getNombreApellido() {
        return nombreApellido;
    }

    public void setNombreApellido(String nombreApellido) {
        this.nombreApellido = nombreApellido;
    }

    public String getNombreEmpresa() {
        return nombreEmpresa;
    }

    public void setNombreEmpresa(String nombreEmpresa) {
        this.nombreEmpresa = nombreEmpresa;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
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

    public List<VehiculoDTO> getVehiculos() {
        return vehiculos;
    }

    public void setVehiculos(List<VehiculoDTO> vehiculos) {
        this.vehiculos = vehiculos;
    }

    @Override
    public String toString() {
        return "TransportistaDTO{" +
                "id=" + id +
                ", codigoInterno='" + codigoInterno + '\'' +
                ", nombreApellido='" + nombreApellido + '\'' +
                ", nombreEmpresa='" + nombreEmpresa + '\'' +
                ", activo=" + activo +
                ", empresaId=" + empresaId +
                ", vehiculos=" + (vehiculos != null ? vehiculos.size() : 0) + " items" +
                '}';
    }
}



