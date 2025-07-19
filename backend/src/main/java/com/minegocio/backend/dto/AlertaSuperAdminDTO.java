package com.minegocio.backend.dto;

import java.time.LocalDateTime;

/**
 * DTO para alertas del super administrador
 */
public class AlertaSuperAdminDTO {

    private Long id;
    private String titulo;
    private String descripcion;
    private String tipo;
    private String categoria;
    private LocalDateTime fechaCreacion;
    private Boolean leida;
    private String empresaNombre;
    private Long empresaId;

    // Constructores
    public AlertaSuperAdminDTO() {}

    public AlertaSuperAdminDTO(String titulo, String descripcion, String tipo) {
        this.titulo = titulo;
        this.descripcion = descripcion;
        this.tipo = tipo;
        this.fechaCreacion = LocalDateTime.now();
        this.leida = false;
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getDescripcion() { return descripcion; }
    public void setDescripcion(String descripcion) { this.descripcion = descripcion; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public Boolean getLeida() { return leida; }
    public void setLeida(Boolean leida) { this.leida = leida; }

    public String getEmpresaNombre() { return empresaNombre; }
    public void setEmpresaNombre(String empresaNombre) { this.empresaNombre = empresaNombre; }

    public Long getEmpresaId() { return empresaId; }
    public void setEmpresaId(Long empresaId) { this.empresaId = empresaId; }
} 