package com.minegocio.backend.controladores;

import com.minegocio.backend.dto.RecuperacionPasswordDTO;
import com.minegocio.backend.servicios.RecuperacionPasswordService;
import com.minegocio.backend.utils.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class RecuperacionPasswordController {

    @Autowired
    private RecuperacionPasswordService recuperacionService;

    /**
     * Solicita la recuperación de contraseña
     */
    @PostMapping("/recuperar-password")
    public ResponseEntity<ApiResponse<String>> solicitarRecuperacion(
            @Valid @RequestBody RecuperacionPasswordDTO.SolicitarRecuperacion request) {
        try {
            recuperacionService.solicitarRecuperacion(request);
            
            return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Si el email está registrado, recibirás un enlace de recuperación en tu correo electrónico",
                "Email enviado"
            ));
        } catch (Exception e) {
            System.err.println("Error al solicitar recuperación: " + e.getMessage());
            return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Si el email está registrado, recibirás un enlace de recuperación en tu correo electrónico",
                "Email enviado"
            ));
        }
    }

    /**
     * Valida un token de recuperación
     */
    @GetMapping("/validar-token/{token}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> validarToken(@PathVariable String token) {
        try {
            boolean esValido = recuperacionService.validarToken(token);
            String email = null;
            
            if (esValido) {
                email = recuperacionService.obtenerEmailPorToken(token);
            }
            
            Map<String, Object> data = Map.of(
                "esValido", esValido,
                "email", email
            );
            
            return ResponseEntity.ok(new ApiResponse<>(
                true,
                esValido ? "Token válido" : "Token inválido o expirado",
                data
            ));
        } catch (Exception e) {
            System.err.println("Error al validar token: " + e.getMessage());
            return ResponseEntity.badRequest().body(new ApiResponse<>(
                false,
                "Error al validar el token",
                null
            ));
        }
    }

    /**
     * Cambia la contraseña usando un token válido
     */
    @PostMapping("/cambiar-password")
    public ResponseEntity<ApiResponse<String>> cambiarPassword(
            @Valid @RequestBody RecuperacionPasswordDTO.CambiarPassword request) {
        try {
            recuperacionService.cambiarPassword(request);
            
            return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Contraseña cambiada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña",
                "Contraseña actualizada"
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(new ApiResponse<>(
                false,
                e.getMessage(),
                null
            ));
        } catch (Exception e) {
            System.err.println("Error al cambiar contraseña: " + e.getMessage());
            return ResponseEntity.badRequest().body(new ApiResponse<>(
                false,
                "Error al cambiar la contraseña",
                null
            ));
        }
    }

    /**
     * Limpia tokens antiguos (endpoint administrativo)
     */
    @PostMapping("/limpiar-tokens")
    public ResponseEntity<ApiResponse<String>> limpiarTokensAntiguos() {
        try {
            recuperacionService.limpiarTokensAntiguos();
            
            return ResponseEntity.ok(new ApiResponse<>(
                true,
                "Limpieza de tokens antiguos completada",
                "Limpieza exitosa"
            ));
        } catch (Exception e) {
            System.err.println("Error al limpiar tokens: " + e.getMessage());
            return ResponseEntity.badRequest().body(new ApiResponse<>(
                false,
                "Error al limpiar tokens antiguos",
                null
            ));
        }
    }
} 