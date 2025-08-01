package com.minegocio.backend.controladores;

import com.minegocio.backend.servicios.ClienteService;
import com.minegocio.backend.servicios.EmailService;
import com.minegocio.backend.servicios.EmpresaService;
import com.minegocio.backend.entidades.Empresa;
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
    
    @Autowired
    private EmpresaService empresaService;

    /**
     * Verifica el email de un cliente usando el token de verificación
     */
    @PostMapping("/verificar-email")
    public ResponseEntity<?> verificarEmail(@RequestBody Map<String, String> request) {
        try {
            System.out.println("=== DEBUG VERIFICACIÓN EMAIL CLIENTE ===");
            System.out.println("Request recibido: " + request);
            
            String token = request.get("token");
            String subdominio = request.get("subdominio");
            
            System.out.println("Token: " + token);
            System.out.println("Subdominio: " + subdominio);
            
            if (token == null || token.trim().isEmpty()) {
                System.out.println("ERROR: Token vacío o null");
                return ResponseEntity.badRequest().body(Map.of(
                    "exito", false,
                    "mensaje", "Token de verificación requerido"
                ));
            }
            
            if (subdominio == null || subdominio.trim().isEmpty()) {
                System.out.println("ERROR: Subdominio vacío o null");
                return ResponseEntity.badRequest().body(Map.of(
                    "exito", false,
                    "mensaje", "Subdominio requerido"
                ));
            }

            // Verificar que la empresa existe
            System.out.println("Buscando empresa con subdominio: " + subdominio);
            Optional<Empresa> empresaOpt = empresaService.obtenerPorSubdominio(subdominio);
            if (empresaOpt.isEmpty()) {
                System.out.println("ERROR: Empresa no encontrada para subdominio: " + subdominio);
                return ResponseEntity.badRequest().body(Map.of(
                    "exito", false,
                    "mensaje", "Empresa no encontrada"
                ));
            }
            
            Empresa empresa = empresaOpt.get();
            System.out.println("Empresa encontrada: " + empresa.getNombre() + " (ID: " + empresa.getId() + ")");
            
            boolean verificado = clienteService.verificarEmailCliente(token, empresa.getId());
            System.out.println("Resultado verificación: " + verificado);
            
            if (verificado) {
                System.out.println("✅ Email verificado exitosamente");
                return ResponseEntity.ok(Map.of(
                    "exito", true,
                    "mensaje", "Email verificado exitosamente"
                ));
            } else {
                System.out.println("❌ Token inválido o expirado");
                return ResponseEntity.badRequest().body(Map.of(
                    "exito", false,
                    "mensaje", "Token inválido o expirado"
                ));
            }
            
        } catch (Exception e) {
            System.err.println("❌ Error en verificación de email: " + e.getMessage());
            e.printStackTrace();
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

    /**
     * Endpoint de prueba para verificar el envío de emails
     */
    @PostMapping("/test-email")
    public ResponseEntity<?> testEmail(@RequestBody Map<String, String> request) {
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
            
            System.out.println("=== TEST EMAIL ===");
            System.out.println("Probando envío de email a: " + email);
            System.out.println("Subdominio: " + subdominio);
            
            // Enviar email de prueba
            emailService.enviarEmailRecuperacionCliente(
                email, 
                "test-token-123", 
                "Usuario Test", 
                subdominio
            );
            
            return ResponseEntity.ok(Map.of(
                "exito", true,
                "mensaje", "Email de prueba enviado correctamente"
            ));
            
        } catch (Exception e) {
            System.err.println("Error en test de email: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "exito", false,
                "mensaje", "Error al enviar email de prueba: " + e.getMessage()
            ));
        }
    }
} 