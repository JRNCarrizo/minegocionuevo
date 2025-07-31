package com.minegocio.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RecuperacionPasswordDTO {

    public static class SolicitarRecuperacion {
        @NotBlank(message = "El email es obligatorio")
        @Email(message = "El formato del email no es válido")
        private String email;

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }
    }

    public static class CambiarPassword {
        @NotBlank(message = "El token es obligatorio")
        private String token;

        @NotBlank(message = "La nueva contraseña es obligatoria")
        @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
        private String nuevaPassword;

        @NotBlank(message = "La confirmación de contraseña es obligatoria")
        private String confirmarPassword;

        public String getToken() {
            return token;
        }

        public void setToken(String token) {
            this.token = token;
        }

        public String getNuevaPassword() {
            return nuevaPassword;
        }

        public void setNuevaPassword(String nuevaPassword) {
            this.nuevaPassword = nuevaPassword;
        }

        public String getConfirmarPassword() {
            return confirmarPassword;
        }

        public void setConfirmarPassword(String confirmarPassword) {
            this.confirmarPassword = confirmarPassword;
        }

        public boolean passwordsCoinciden() {
            return nuevaPassword != null && nuevaPassword.equals(confirmarPassword);
        }
    }
} 