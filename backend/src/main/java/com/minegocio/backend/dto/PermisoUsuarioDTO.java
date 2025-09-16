package com.minegocio.backend.dto;

import java.util.Map;

/**
 * DTO para manejar permisos de usuario
 */
public class PermisoUsuarioDTO {
    
    private Long usuarioId;
    private String usuarioNombre;
    private String usuarioEmail;
    private Map<String, Boolean> permisos;

    // Constructores
    public PermisoUsuarioDTO() {}

    public PermisoUsuarioDTO(Long usuarioId, String usuarioNombre, String usuarioEmail, Map<String, Boolean> permisos) {
        this.usuarioId = usuarioId;
        this.usuarioNombre = usuarioNombre;
        this.usuarioEmail = usuarioEmail;
        this.permisos = permisos;
    }

    // Getters y Setters
    public Long getUsuarioId() { return usuarioId; }
    public void setUsuarioId(Long usuarioId) { this.usuarioId = usuarioId; }

    public String getUsuarioNombre() { return usuarioNombre; }
    public void setUsuarioNombre(String usuarioNombre) { this.usuarioNombre = usuarioNombre; }

    public String getUsuarioEmail() { return usuarioEmail; }
    public void setUsuarioEmail(String usuarioEmail) { this.usuarioEmail = usuarioEmail; }

    public Map<String, Boolean> getPermisos() { return permisos; }
    public void setPermisos(Map<String, Boolean> permisos) { this.permisos = permisos; }
}








