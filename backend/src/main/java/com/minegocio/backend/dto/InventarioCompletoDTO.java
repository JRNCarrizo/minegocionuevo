package com.minegocio.backend.dto;

import com.minegocio.backend.entidades.InventarioCompleto;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * DTO para InventarioCompleto que evita problemas de serialización
 */
public class InventarioCompletoDTO {
    
    private Long id;
    private Long empresaId;
    private String empresaNombre;
    private Long usuarioAdministradorId;
    private String usuarioAdministradorNombre;
    private LocalDateTime fechaInicio;
    private LocalDateTime fechaActualizacion;
    private LocalDateTime fechaFinalizacion;
    private String estado;
    private Integer totalSectores;
    private Integer sectoresCompletados;
    private Integer sectoresEnProgreso;
    private Integer sectoresPendientes;
    private Double porcentajeCompletado;
    private String observaciones;
    private List<ConteoSectorDTO> conteosSectores;

    // Constructores
    public InventarioCompletoDTO() {}

    public InventarioCompletoDTO(InventarioCompleto inventario) {
        this.id = inventario.getId();
        
        try {
            this.empresaId = inventario.getEmpresa() != null ? inventario.getEmpresa().getId() : null;
            this.empresaNombre = inventario.getEmpresa() != null ? inventario.getEmpresa().getNombre() : null;
        } catch (Exception e) {
            System.err.println("⚠️ Error accediendo a empresa (posible proxy lazy): " + e.getMessage());
            this.empresaId = null;
            this.empresaNombre = null;
        }
        
        try {
            this.usuarioAdministradorId = inventario.getUsuarioAdministrador() != null ? inventario.getUsuarioAdministrador().getId() : null;
            this.usuarioAdministradorNombre = inventario.getUsuarioAdministrador() != null ? 
                inventario.getUsuarioAdministrador().getNombre() + " " + inventario.getUsuarioAdministrador().getApellidos() : null;
        } catch (Exception e) {
            System.err.println("⚠️ Error accediendo a usuarioAdministrador (posible proxy lazy): " + e.getMessage());
            this.usuarioAdministradorId = null;
            this.usuarioAdministradorNombre = null;
        }
        this.fechaInicio = inventario.getFechaInicio();
        this.fechaActualizacion = inventario.getFechaActualizacion();
        this.fechaFinalizacion = inventario.getFechaFinalizacion();
        this.estado = inventario.getEstado() != null ? inventario.getEstado().name() : null;
        this.totalSectores = inventario.getTotalSectores();
        this.sectoresCompletados = inventario.getSectoresCompletados();
        this.sectoresEnProgreso = inventario.getSectoresEnProgreso();
        this.sectoresPendientes = inventario.getSectoresPendientes();
        this.porcentajeCompletado = inventario.getPorcentajeCompletado();
        this.observaciones = inventario.getObservaciones();
        try {
            if (inventario.getConteosSectores() != null) {
                this.conteosSectores = inventario.getConteosSectores().stream()
                        .map(ConteoSectorDTO::new)
                        .collect(Collectors.toList());
            }
        } catch (Exception e) {
            System.err.println("⚠️ Error accediendo a conteosSectores (posible proxy lazy): " + e.getMessage());
            this.conteosSectores = null;
        }
    }

    // Getters y Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getEmpresaId() {
        return empresaId;
    }

    public void setEmpresaId(Long empresaId) {
        this.empresaId = empresaId;
    }

    public String getEmpresaNombre() {
        return empresaNombre;
    }

    public void setEmpresaNombre(String empresaNombre) {
        this.empresaNombre = empresaNombre;
    }

    public Long getUsuarioAdministradorId() {
        return usuarioAdministradorId;
    }

    public void setUsuarioAdministradorId(Long usuarioAdministradorId) {
        this.usuarioAdministradorId = usuarioAdministradorId;
    }

    public String getUsuarioAdministradorNombre() {
        return usuarioAdministradorNombre;
    }

    public void setUsuarioAdministradorNombre(String usuarioAdministradorNombre) {
        this.usuarioAdministradorNombre = usuarioAdministradorNombre;
    }

    public LocalDateTime getFechaInicio() {
        return fechaInicio;
    }

    public void setFechaInicio(LocalDateTime fechaInicio) {
        this.fechaInicio = fechaInicio;
    }

    public LocalDateTime getFechaActualizacion() {
        return fechaActualizacion;
    }

    public void setFechaActualizacion(LocalDateTime fechaActualizacion) {
        this.fechaActualizacion = fechaActualizacion;
    }

    public LocalDateTime getFechaFinalizacion() {
        return fechaFinalizacion;
    }

    public void setFechaFinalizacion(LocalDateTime fechaFinalizacion) {
        this.fechaFinalizacion = fechaFinalizacion;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public Integer getTotalSectores() {
        return totalSectores;
    }

    public void setTotalSectores(Integer totalSectores) {
        this.totalSectores = totalSectores;
    }

    public Integer getSectoresCompletados() {
        return sectoresCompletados;
    }

    public void setSectoresCompletados(Integer sectoresCompletados) {
        this.sectoresCompletados = sectoresCompletados;
    }

    public Integer getSectoresEnProgreso() {
        return sectoresEnProgreso;
    }

    public void setSectoresEnProgreso(Integer sectoresEnProgreso) {
        this.sectoresEnProgreso = sectoresEnProgreso;
    }

    public Integer getSectoresPendientes() {
        return sectoresPendientes;
    }

    public void setSectoresPendientes(Integer sectoresPendientes) {
        this.sectoresPendientes = sectoresPendientes;
    }

    public Double getPorcentajeCompletado() {
        return porcentajeCompletado;
    }

    public void setPorcentajeCompletado(Double porcentajeCompletado) {
        this.porcentajeCompletado = porcentajeCompletado;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    public List<ConteoSectorDTO> getConteosSectores() {
        return conteosSectores;
    }

    public void setConteosSectores(List<ConteoSectorDTO> conteosSectores) {
        this.conteosSectores = conteosSectores;
    }
}
