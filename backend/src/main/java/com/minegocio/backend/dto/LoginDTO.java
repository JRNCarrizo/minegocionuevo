package com.minegocio.backend.dto;

import jakarta.validation.constraints.NotBlank;

public class LoginDTO {
    
    @NotBlank(message = "El nombre de usuario o email es requerido")
    private String usuario;
    
    @NotBlank(message = "La contraseña es requerida")
    private String contrasena;
    
    // Constructores
    public LoginDTO() {}
    
    public LoginDTO(String usuario, String contrasena) {
        this.usuario = usuario;
        this.contrasena = contrasena;
    }
    
    // Getters y Setters
    public String getUsuario() {
        return usuario;
    }
    
    public void setUsuario(String usuario) {
        this.usuario = usuario;
    }
    
    public String getContrasena() {
        return contrasena;
    }
    
    public void setContrasena(String contrasena) {
        this.contrasena = contrasena;
    }
}
