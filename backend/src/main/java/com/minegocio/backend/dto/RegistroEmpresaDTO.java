package com.minegocio.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * DTO para el registro de nuevas empresas
 */
public class RegistroEmpresaDTO {

    @NotBlank(message = "El nombre de la empresa es obligatorio")
    @Size(max = 100, message = "El nombre no puede exceder 100 caracteres")
    private String nombreEmpresa;

    @NotBlank(message = "El subdominio es obligatorio")
    @Size(min = 3, max = 50, message = "El subdominio debe tener entre 3 y 50 caracteres")
    @Pattern(regexp = "^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$", 
             message = "El subdominio solo puede contener letras, números y guiones, y no puede empezar o terminar con guión")
    private String subdominio;

    @Email(message = "Debe proporcionar un email válido")
    @NotBlank(message = "El email de la empresa es obligatorio")
    private String emailEmpresa;

    @Size(max = 20, message = "El teléfono no puede exceder 20 caracteres")
    private String telefonoEmpresa;

    @Size(max = 500, message = "La descripción no puede exceder 500 caracteres")
    private String descripcionEmpresa;

    // Datos del administrador
    @NotBlank(message = "El nombre del administrador es obligatorio")
    @Size(max = 100, message = "El nombre no puede exceder 100 caracteres")
    private String nombreAdministrador;

    @NotBlank(message = "Los apellidos del administrador son obligatorios")
    @Size(max = 100, message = "Los apellidos no pueden exceder 100 caracteres")
    private String apellidosAdministrador;

    @Email(message = "Debe proporcionar un email válido")
    @NotBlank(message = "El email del administrador es obligatorio")
    private String emailAdministrador;

    @NotBlank(message = "La contraseña es obligatoria")
    @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
    private String passwordAdministrador;

    @Size(max = 20, message = "El teléfono no puede exceder 20 caracteres")
    private String telefonoAdministrador;

    // Términos y condiciones
    private Boolean aceptaTerminos = false;

    private Boolean aceptaMarketing = false;

    // Constructores
    public RegistroEmpresaDTO() {}

    // Getters y Setters
    public String getNombreEmpresa() { return nombreEmpresa; }
    public void setNombreEmpresa(String nombreEmpresa) { this.nombreEmpresa = nombreEmpresa; }

    public String getSubdominio() { return subdominio; }
    public void setSubdominio(String subdominio) { this.subdominio = subdominio; }

    public String getEmailEmpresa() { return emailEmpresa; }
    public void setEmailEmpresa(String emailEmpresa) { this.emailEmpresa = emailEmpresa; }

    public String getTelefonoEmpresa() { return telefonoEmpresa; }
    public void setTelefonoEmpresa(String telefonoEmpresa) { this.telefonoEmpresa = telefonoEmpresa; }

    public String getDescripcionEmpresa() { return descripcionEmpresa; }
    public void setDescripcionEmpresa(String descripcionEmpresa) { this.descripcionEmpresa = descripcionEmpresa; }

    public String getNombreAdministrador() { return nombreAdministrador; }
    public void setNombreAdministrador(String nombreAdministrador) { this.nombreAdministrador = nombreAdministrador; }

    public String getApellidosAdministrador() { return apellidosAdministrador; }
    public void setApellidosAdministrador(String apellidosAdministrador) { this.apellidosAdministrador = apellidosAdministrador; }

    public String getEmailAdministrador() { return emailAdministrador; }
    public void setEmailAdministrador(String emailAdministrador) { this.emailAdministrador = emailAdministrador; }

    public String getPasswordAdministrador() { return passwordAdministrador; }
    public void setPasswordAdministrador(String passwordAdministrador) { this.passwordAdministrador = passwordAdministrador; }

    public String getTelefonoAdministrador() { return telefonoAdministrador; }
    public void setTelefonoAdministrador(String telefonoAdministrador) { this.telefonoAdministrador = telefonoAdministrador; }

    public Boolean getAceptaTerminos() { return aceptaTerminos; }
    public void setAceptaTerminos(Boolean aceptaTerminos) { this.aceptaTerminos = aceptaTerminos; }

    public Boolean getAceptaMarketing() { return aceptaMarketing; }
    public void setAceptaMarketing(Boolean aceptaMarketing) { this.aceptaMarketing = aceptaMarketing; }
}
