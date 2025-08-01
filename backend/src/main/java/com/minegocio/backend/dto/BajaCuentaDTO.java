package com.minegocio.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * DTO para solicitar la baja de una cuenta
 */
public class BajaCuentaDTO {

    @NotBlank(message = "El motivo de la baja es obligatorio")
    private String motivo;

    @NotNull(message = "Debe especificar si la baja es permanente")
    private Boolean bajaPermanente;

    private String comentariosAdicionales;

    // Constructores
    public BajaCuentaDTO() {}

    public BajaCuentaDTO(String motivo, Boolean bajaPermanente, String comentariosAdicionales) {
        this.motivo = motivo;
        this.bajaPermanente = bajaPermanente;
        this.comentariosAdicionales = comentariosAdicionales;
    }

    // Getters y Setters
    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }

    public Boolean getBajaPermanente() {
        return bajaPermanente;
    }

    public void setBajaPermanente(Boolean bajaPermanente) {
        this.bajaPermanente = bajaPermanente;
    }

    public String getComentariosAdicionales() {
        return comentariosAdicionales;
    }

    public void setComentariosAdicionales(String comentariosAdicionales) {
        this.comentariosAdicionales = comentariosAdicionales;
    }
} 