package com.minegocio.backend.controladores;

import com.minegocio.backend.servicios.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Controlador para debugging y pruebas de email
 */
@RestController
@RequestMapping("/api/publico/email-debug")
@CrossOrigin(origins = "*", maxAge = 3600)
public class EmailDebugController {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Autowired
    private EmailService emailService;

    @Autowired
    private Environment environment;

    @Value("${minegocio.app.email.from:}")
    private String fromEmail;

    @Value("${minegocio.app.frontend.url:}")
    private String frontendUrl;

    @Value("${minegocio.app.nombre:}")
    private String appNombre;

    /**
     * Verifica la configuración de email
     */
    @GetMapping("/verificar-configuracion")
    public ResponseEntity<?> verificarConfiguracion() {
        Map<String, Object> config = new HashMap<>();
        
        // Variables básicas
        config.put("fromEmail", fromEmail != null && !fromEmail.isEmpty() ? fromEmail : "NO CONFIGURADO");
        config.put("frontendUrl", frontendUrl != null && !frontendUrl.isEmpty() ? frontendUrl : "NO CONFIGURADO");
        config.put("appNombre", appNombre != null && !appNombre.isEmpty() ? appNombre : "NO CONFIGURADO");
        config.put("mailSenderConfigurado", mailSender != null);
        
        // Variables de entorno
        Map<String, Object> envVars = new HashMap<>();
        envVars.put("MAIL_USERNAME_existe", System.getenv("MAIL_USERNAME") != null);
        envVars.put("MAIL_PASSWORD_existe", System.getenv("MAIL_PASSWORD") != null);
        envVars.put("MAIL_FROM_existe", System.getenv("MAIL_FROM") != null);
        
        if (System.getenv("MAIL_USERNAME") != null) {
            String username = System.getenv("MAIL_USERNAME");
            envVars.put("MAIL_USERNAME_preview", username.substring(0, Math.min(3, username.length())) + "***");
        }
        
        if (System.getenv("MAIL_FROM") != null) {
            envVars.put("MAIL_FROM_valor", System.getenv("MAIL_FROM"));
        }
        
        config.put("variablesEntorno", envVars);
        
        // Perfil activo
        String[] activeProfiles = environment.getActiveProfiles();
        config.put("perfilesActivos", activeProfiles.length > 0 ? String.join(", ", activeProfiles) : "Ninguno");
        
        // Modo desarrollo
        boolean isDev = false;
        for (String profile : activeProfiles) {
            if (profile.contains("dev") || "h2".equals(profile)) {
                isDev = true;
                break;
            }
        }
        config.put("modoDesarrollo", isDev);
        
        // Estado general
        boolean configuracionCompleta = mailSender != null && 
                                       fromEmail != null && !fromEmail.trim().isEmpty() &&
                                       System.getenv("MAIL_USERNAME") != null &&
                                       System.getenv("MAIL_PASSWORD") != null;
        
        config.put("configuracionCompleta", configuracionCompleta);
        config.put("emailsSeEnviaran", configuracionCompleta && !isDev);
        
        // Diagnóstico
        if (!configuracionCompleta) {
            StringBuilder diagnostico = new StringBuilder("Problemas encontrados: ");
            if (mailSender == null) diagnostico.append("MailSender no configurado. ");
            if (fromEmail == null || fromEmail.trim().isEmpty()) diagnostico.append("Email FROM no configurado. ");
            if (System.getenv("MAIL_USERNAME") == null) diagnostico.append("MAIL_USERNAME no configurado. ");
            if (System.getenv("MAIL_PASSWORD") == null) diagnostico.append("MAIL_PASSWORD no configurado. ");
            config.put("diagnostico", diagnostico.toString());
        } else if (isDev) {
            config.put("diagnostico", "Configuración completa pero en modo desarrollo - emails se simulan en consola");
        } else {
            config.put("diagnostico", "Configuración completa - emails se enviarán correctamente");
        }
        
        return ResponseEntity.ok(config);
    }

    /**
     * Envía un email de prueba
     */
    @PostMapping("/enviar-prueba")
    public ResponseEntity<?> enviarEmailPrueba(@RequestBody Map<String, String> request) {
        try {
            String emailDestino = request.get("email");
            String nombre = request.getOrDefault("nombre", "Usuario Prueba");
            
            if (emailDestino == null || emailDestino.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "El email de destino es obligatorio"
                ));
            }
            
            // Generar token de prueba
            String tokenPrueba = "test-token-" + System.currentTimeMillis();
            
            System.out.println("=== PRUEBA DE EMAIL ===");
            System.out.println("Email destino: " + emailDestino);
            System.out.println("Nombre: " + nombre);
            System.out.println("Token: " + tokenPrueba);
            
            // Intentar enviar email
            emailService.enviarEmailVerificacion(emailDestino, nombre, tokenPrueba);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Email de prueba enviado (o simulado en desarrollo)",
                "emailDestino", emailDestino,
                "tokenPrueba", tokenPrueba,
                "instrucciones", "Revisa la consola del backend para ver el enlace de verificación"
            ));
            
        } catch (Exception e) {
            System.err.println("Error en prueba de email: " + e.getMessage());
            e.printStackTrace();
            
            return ResponseEntity.status(500).body(Map.of(
                "error", "Error al enviar email de prueba",
                "detalle", e.getMessage(),
                "tipo", e.getClass().getName()
            ));
        }
    }

    /**
     * Endpoint de health check para email
     */
    @GetMapping("/health")
    public ResponseEntity<?> healthCheck() {
        boolean healthy = mailSender != null && 
                         fromEmail != null && !fromEmail.trim().isEmpty();
        
        if (healthy) {
            return ResponseEntity.ok(Map.of(
                "status", "OK",
                "mensaje", "Servicio de email configurado correctamente"
            ));
        } else {
            return ResponseEntity.status(503).body(Map.of(
                "status", "ERROR",
                "mensaje", "Servicio de email no está configurado correctamente"
            ));
        }
    }
}

