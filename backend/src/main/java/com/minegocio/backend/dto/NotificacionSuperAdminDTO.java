package com.minegocio.backend.dto;

import java.time.LocalDateTime;

/**
 * DTO para notificaciones del super administrador
 */
public class NotificacionSuperAdminDTO {

    private Long id;
    private String titulo;
    private String mensaje;
    private String tipo;
    private LocalDateTime fechaCreacion;
    private Boolean leida;
    private String accionUrl;
    private String accionTexto;

    // Constructores
    public NotificacionSuperAdminDTO() {}

    public NotificacionSuperAdminDTO(String titulo, String mensaje, String tipo) {
        this.titulo = titulo;
        this.mensaje = mensaje;
        this.tipo = tipo;
        this.fechaCreacion = LocalDateTime.now();
        this.leida = false;
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getMensaje() { return mensaje; }
    public void setMensaje(String mensaje) { this.mensaje = mensaje; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public Boolean getLeida() { return leida; }
    public void setLeida(Boolean leida) { this.leida = leida; }

    public String getAccionUrl() { return accionUrl; }
    public void setAccionUrl(String accionUrl) { this.accionUrl = accionUrl; }

    public String getAccionTexto() { return accionTexto; }
    public void setAccionTexto(String accionTexto) { this.accionTexto = accionTexto; }
} 