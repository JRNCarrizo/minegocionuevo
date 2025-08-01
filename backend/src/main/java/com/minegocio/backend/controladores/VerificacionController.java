package com.minegocio.backend.controladores;

import com.minegocio.backend.servicios.EmpresaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controlador para la verificación de email
 */
@RestController
@RequestMapping("/api/verificacion")
@CrossOrigin(origins = "*", maxAge = 3600)
public class VerificacionController {

    @Autowired
    private EmpresaService empresaService;

    /**
     * Verifica el email de un usuario usando el token
     */
    @PostMapping("/verificar-email")
    public ResponseEntity<?> verificarEmail(@RequestParam String token) {
        try {
            boolean verificado = empresaService.verificarEmailUsuario(token);
            
            if (verificado) {
                return ResponseEntity.ok(Map.of(
                    "exito", true,
                    "mensaje", "Email verificado exitosamente. Tu cuenta ya está activa."
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                    "exito", false,
                    "mensaje", "Token inválido o expirado. Solicita un nuevo enlace de verificación."
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "exito", false,
                "mensaje", "Error interno del servidor"
            ));
        }
    }

    /**
     * Reenvía el email de verificación
     */
    @PostMapping("/reenviar-email")
    public ResponseEntity<?> reenviarEmailVerificacion(@RequestParam String email) {
        try {
            boolean enviado = empresaService.reenviarEmailVerificacion(email);
            
            if (enviado) {
                return ResponseEntity.ok(Map.of(
                    "exito", true,
                    "mensaje", "Email de verificación reenviado exitosamente."
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                    "exito", false,
                    "mensaje", "No se pudo reenviar el email. Verifica que el email esté registrado y no verificado."
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "exito", false,
                "mensaje", "Error interno del servidor"
            ));
        }
    }
} 