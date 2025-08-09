package com.minegocio.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;

/**
 * DTO para login de administradores usando email de empresa + número de documento
 */
public class LoginDocumentoDTO {
    
    @NotBlank(message = "El email de la empresa es obligatorio")
    @Email(message = "Debe proporcionar un email válido")
    private String emailEmpresa;
    
    @NotBlank(message = "El número de documento es obligatorio")
    private String numeroDocumento;
    
    // Constructores
    public LoginDocumentoDTO() {}
    
    public LoginDocumentoDTO(String emailEmpresa, String numeroDocumento) {
        this.emailEmpresa = emailEmpresa;
        this.numeroDocumento = numeroDocumento;
    }
    
    // Getters y Setters
    public String getEmailEmpresa() {
        return emailEmpresa;
    }
    
    public void setEmailEmpresa(String emailEmpresa) {
        this.emailEmpresa = emailEmpresa;
    }
    
    public String getNumeroDocumento() {
        return numeroDocumento;
    }
    
    public void setNumeroDocumento(String numeroDocumento) {
        this.numeroDocumento = numeroDocumento;
    }
}
