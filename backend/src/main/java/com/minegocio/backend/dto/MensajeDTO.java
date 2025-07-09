package com.minegocio.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

public class MensajeDTO {
    
    private Long id;
    
    @NotNull(message = "El ID del cliente es requerido")
    private Long clienteId;
    
    private String clienteNombre;
    
    private String clienteEmail;
    
    @NotBlank(message = "El asunto es requerido")
    @Size(max = 200, message = "El asunto no puede exceder 200 caracteres")
    private String asunto;
    
    @NotBlank(message = "El mensaje es requerido")
    @Size(max = 2000, message = "El mensaje no puede exceder 2000 caracteres")
    private String mensaje;
    
    private LocalDateTime fechaEnvio;
    
    private Boolean leido;
    
    private Boolean respondido;
    
    @Size(max = 2000, message = "La respuesta no puede exceder 2000 caracteres")
    private String respuesta;
    
    private LocalDateTime fechaRespuesta;
    
    private Long empresaId;
    
    private String empresaNombre;
    
    // Constructores
    public MensajeDTO() {}
    
    public MensajeDTO(Long id, Long clienteId, String clienteNombre, String clienteEmail,
                     String asunto, String mensaje, LocalDateTime fechaEnvio, Boolean leido,
                     Boolean respondido, String respuesta, LocalDateTime fechaRespuesta,
                     Long empresaId, String empresaNombre) {
        this.id = id;
        this.clienteId = clienteId;
        this.clienteNombre = clienteNombre;
        this.clienteEmail = clienteEmail;
        this.asunto = asunto;
        this.mensaje = mensaje;
        this.fechaEnvio = fechaEnvio;
        this.leido = leido;
        this.respondido = respondido;
        this.respuesta = respuesta;
        this.fechaRespuesta = fechaRespuesta;
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
    
    public Long getClienteId() {
        return clienteId;
    }
    
    public void setClienteId(Long clienteId) {
        this.clienteId = clienteId;
    }
    
    public String getClienteNombre() {
        return clienteNombre;
    }
    
    public void setClienteNombre(String clienteNombre) {
        this.clienteNombre = clienteNombre;
    }
    
    public String getClienteEmail() {
        return clienteEmail;
    }
    
    public void setClienteEmail(String clienteEmail) {
        this.clienteEmail = clienteEmail;
    }
    
    public String getAsunto() {
        return asunto;
    }
    
    public void setAsunto(String asunto) {
        this.asunto = asunto;
    }
    
    public String getMensaje() {
        return mensaje;
    }
    
    public void setMensaje(String mensaje) {
        this.mensaje = mensaje;
    }
    
    public LocalDateTime getFechaEnvio() {
        return fechaEnvio;
    }
    
    public void setFechaEnvio(LocalDateTime fechaEnvio) {
        this.fechaEnvio = fechaEnvio;
    }
    
    public Boolean getLeido() {
        return leido;
    }
    
    public void setLeido(Boolean leido) {
        this.leido = leido;
    }
    
    public Boolean getRespondido() {
        return respondido;
    }
    
    public void setRespondido(Boolean respondido) {
        this.respondido = respondido;
    }
    
    public String getRespuesta() {
        return respuesta;
    }
    
    public void setRespuesta(String respuesta) {
        this.respuesta = respuesta;
    }
    
    public LocalDateTime getFechaRespuesta() {
        return fechaRespuesta;
    }
    
    public void setFechaRespuesta(LocalDateTime fechaRespuesta) {
        this.fechaRespuesta = fechaRespuesta;
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
}
