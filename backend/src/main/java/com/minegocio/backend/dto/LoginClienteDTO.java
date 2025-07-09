package com.minegocio.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class LoginClienteDTO {
    
    @NotBlank(message = "El email es obligatorio")
    @Email(message = "El email debe tener un formato válido")
    private String email;
    
    @NotBlank(message = "La contraseña es obligatoria")
    private String password;
    
    // Constructor por defecto
    public LoginClienteDTO() {}
    
    // Constructor con parámetros
    public LoginClienteDTO(String email, String password) {
        this.email = email;
        this.password = password;
    }
    
    // Getters y setters
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getPassword() {
        return password;
    }
    
    public void setPassword(String password) {
        this.password = password;
    }
    
    @Override
    public String toString() {
        return "LoginClienteDTO{" +
                "email='" + email + '\'' +
                ", password='[PROTECTED]'" +
                '}';
    }
}
