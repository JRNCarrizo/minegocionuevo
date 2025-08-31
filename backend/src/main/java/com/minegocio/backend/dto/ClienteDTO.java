package com.minegocio.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public class ClienteDTO {
    
    private Long id;
    
    @NotBlank(message = "El nombre es requerido")
    @Size(max = 100, message = "El nombre no puede exceder 100 caracteres")
    private String nombre;
    
    @NotBlank(message = "Los apellidos son requeridos")
    @Size(max = 100, message = "Los apellidos no pueden exceder 100 caracteres")
    private String apellidos;
    
    @NotBlank(message = "El email es requerido")
    @Email(message = "El formato del email no es válido")
    private String email;
    
    @Size(max = 20, message = "El teléfono no puede exceder 20 caracteres")
    private String telefono;
    
    @Size(max = 255, message = "La dirección no puede exceder 255 caracteres")
    private String direccion;
    
    @Size(max = 50, message = "La ciudad no puede exceder 50 caracteres")
    private String ciudad;
    
    @Size(max = 50, message = "El país no puede exceder 50 caracteres")
    private String pais;
    
    @Size(max = 10, message = "El código postal no puede exceder 10 caracteres")
    private String codigoPostal;
    
    private Boolean activo;
    
    private Long empresaId;
    
    private String empresaNombre;
    
    // Campos para autenticación
    private String password;
    private Boolean emailVerificado;
    private String tokenVerificacion;
    
    // Campos para estadísticas de compras
    private Integer totalPedidos;
    private Double totalCompras;
    
    private LocalDateTime fechaCreacion;
    
    private LocalDateTime fechaActualizacion;

    // Constructores
    public ClienteDTO() {}
    
    public ClienteDTO(Long id, String nombre, String apellidos, String email, String telefono, 
                     String direccion, String ciudad, String pais, String codigoPostal, 
                     Boolean activo, Long empresaId, String empresaNombre) {
        this.id = id;
        this.nombre = nombre;
        this.apellidos = apellidos;
        this.email = email;
        this.telefono = telefono;
        this.direccion = direccion;
        this.ciudad = ciudad;
        this.pais = pais;
        this.codigoPostal = codigoPostal;
        this.activo = activo;
        this.empresaId = empresaId;
        this.empresaNombre = empresaNombre;
    }
    
    // Getters y Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getNombre() {
        return nombre;
    }
    
    public void setNombre(String nombre) {
        this.nombre = nombre;
    }
    
    public String getEmail() {
        return email;
    }
    
    public void setEmail(String email) {
        this.email = email;
    }
    
    public String getTelefono() {
        return telefono;
    }
    
    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }
    
    public String getDireccion() {
        return direccion;
    }
    
    public void setDireccion(String direccion) {
        this.direccion = direccion;
    }
    
    public String getCiudad() {
        return ciudad;
    }
    
    public void setCiudad(String ciudad) {
        this.ciudad = ciudad;
    }
    
    public String getPais() {
        return pais;
    }
    
    public void setPais(String pais) {
        this.pais = pais;
    }
    
    public String getCodigoPostal() {
        return codigoPostal;
    }
    
    public void setCodigoPostal(String codigoPostal) {
        this.codigoPostal = codigoPostal;
    }
    
    public Boolean getActivo() {
        return activo;
    }
    
    public void setActivo(Boolean activo) {
        this.activo = activo;
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
    
    // Getters y setters para nuevos campos
    public String getApellidos() {
        return apellidos;
    }
    
    public void setApellidos(String apellidos) {
        this.apellidos = apellidos;
    }
    
    public String getPassword() {
        return password;
    }
    
    public void setPassword(String password) {
        this.password = password;
    }
    
    public Boolean getEmailVerificado() {
        return emailVerificado;
    }
    
    public void setEmailVerificado(Boolean emailVerificado) {
        this.emailVerificado = emailVerificado;
    }
    
    public String getTokenVerificacion() {
        return tokenVerificacion;
    }
    
    public void setTokenVerificacion(String tokenVerificacion) {
        this.tokenVerificacion = tokenVerificacion;
    }
    
    // Getters y setters para estadísticas de compras
    public Integer getTotalPedidos() {
        return totalPedidos;
    }
    
    public void setTotalPedidos(Integer totalPedidos) {
        this.totalPedidos = totalPedidos;
    }
    
    public Double getTotalCompras() {
        return totalCompras;
    }
    
    public void setTotalCompras(Double totalCompras) {
        this.totalCompras = totalCompras;
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
}
