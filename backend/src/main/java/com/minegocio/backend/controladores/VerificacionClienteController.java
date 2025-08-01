package com.minegocio.backend.controladores;

import com.minegocio.backend.servicios.ClienteService;
import com.minegocio.backend.servicios.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Controlador para verificación de email de clientes
 */
@RestController
@RequestMapping("/api/verificacion-cliente")
@CrossOrigin(origins = "*", maxAge = 3600)
public class VerificacionClienteController {

    @Autowired
    private ClienteService clienteService;

    @Autowired
    private EmailService emailService;

    /**
     * Verifica el email de un cliente usando el token de verificación
     */
    @PostMapping("/verificar-email")
    public ResponseEntity<?> verificarEmail(@RequestBody Map<String, String> request) {
        try {
            String token = request.get("token");
            
            if (token == null || token.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "exito", false,
                    "mensaje", "Token de verificación requerido"
                ));
            }

            boolean verificado = clienteService.verificarEmailCliente(token);
            
            if (verificado) {
                return ResponseEntity.ok(Map.of(
                    "exito", true,
                    "mensaje", "Email verificado exitosamente"
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                    "exito", false,
                    "mensaje", "Token inválido o expirado"
                ));
            }
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "exito", false,
                "mensaje", "Error interno del servidor: " + e.getMessage()
            ));
        }
    }

    /**
     * Reenvía el email de verificación
     */
    @PostMapping("/reenviar-email")
    public ResponseEntity<?> reenviarEmail(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String subdominio = request.get("subdominio");
            
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "exito", false,
                    "mensaje", "Email requerido"
                ));
            }

            if (subdominio == null || subdominio.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "exito", false,
                    "mensaje", "Subdominio requerido"
                ));
            }

            boolean reenviado = clienteService.reenviarEmailVerificacionCliente(email, subdominio);
            
            if (reenviado) {
                return ResponseEntity.ok(Map.of(
                    "exito", true,
                    "mensaje", "Email de verificación reenviado"
                ));
            } else {
                return ResponseEntity.badRequest().body(Map.of(
                    "exito", false,
                    "mensaje", "No se pudo reenviar el email de verificación"
                ));
            }
            
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of(
                "exito", false,
                "mensaje", "Error interno del servidor: " + e.getMessage()
            ));
        }
    }
} 