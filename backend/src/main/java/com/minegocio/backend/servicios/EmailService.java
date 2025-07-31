package com.minegocio.backend.servicios;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender emailSender;
    
    @Value("${minegocio.app.frontend.url}")
    private String frontendUrl;
    
    @Value("${minegocio.app.email.from}")
    private String fromEmail;
    
    @PostConstruct
    public void init() {
        System.out.println("=== EMAIL SERVICE INIT ===");
        System.out.println("Frontend URL: " + frontendUrl);
        System.out.println("From Email: " + fromEmail);
        System.out.println("JavaMailSender: " + (emailSender != null ? "Configurado" : "NO CONFIGURADO"));
        System.out.println("==========================");
    }

    /**
     * Envía un email de recuperación de contraseña
     */
    public void enviarEmailRecuperacion(String emailDestino, String token, String nombreUsuario) {
        // Mostrar información del token en logs para debugging
        System.out.println("=== 📧 ENVIANDO EMAIL DE RECUPERACIÓN ===");
        System.out.println("📧 Email destino: " + emailDestino);
        System.out.println("👤 Usuario: " + nombreUsuario);
        System.out.println("🔑 Token de recuperación: " + token);
        System.out.println("🔗 Enlace de recuperación: https://negocio360.org/recuperar-contraseña?token=" + token);
        System.out.println("==================================================");
        
        SimpleMailMessage message = new SimpleMailMessage();
        
        message.setFrom(fromEmail);
        message.setTo(emailDestino);
        message.setSubject("Recuperación de Contraseña - Negocio360");
        
        String contenido = String.format(
            "Hola %s,\n\n" +
            "Has solicitado recuperar tu contraseña en Negocio360.\n\n" +
            "Para establecer una nueva contraseña, haz clic en el siguiente enlace:\n" +
            "https://negocio360.org/recuperar-contraseña?token=%s\n\n" +
            "Este enlace expirará en 1 hora por seguridad.\n\n" +
            "Si no solicitaste este cambio, puedes ignorar este email.\n\n" +
            "Saludos,\n" +
            "Equipo de Negocio360",
            nombreUsuario, token
        );
        
        message.setText(contenido);
        
        try {
            System.out.println("=== DEBUG EMAIL ===");
            System.out.println("From: " + fromEmail);
            System.out.println("To: " + emailDestino);
            System.out.println("Subject: " + message.getSubject());
            System.out.println("Enviando email de recuperación...");
            
            emailSender.send(message);
            System.out.println("✅ Email de recuperación enviado exitosamente a: " + emailDestino);
        } catch (Exception e) {
            System.err.println("❌ Error al enviar email de recuperación: " + e.getMessage());
            System.err.println("⚠️ NOTA: El token se generó correctamente, pero no se pudo enviar el email.");
            System.err.println("⚠️ Para solucionar esto, configura Gmail correctamente o usa un servicio de email alternativo.");
            // No lanzamos excepción para que el proceso continúe
            // throw new RuntimeException("Error al enviar email de recuperación", e);
        }
    }

    /**
     * Envía un email de recuperación de contraseña para clientes
     */
    public void enviarEmailRecuperacionCliente(String emailDestino, String token, String nombreUsuario, String subdominio) {
        SimpleMailMessage message = new SimpleMailMessage();
        
        message.setFrom(fromEmail);
        message.setTo(emailDestino);
        message.setSubject("Recuperación de Contraseña - Tu Tienda");
        
        // Construir el enlace dinámicamente basado en el subdominio y la URL del frontend
        String baseUrl = frontendUrl;
        if (baseUrl.contains("localhost")) {
            // Para desarrollo, usar el formato subdominio.localhost:5173
            baseUrl = "http://" + subdominio + ".localhost:5173";
        } else {
            // Para producción, usar el formato subdominio.negocio360.org
            baseUrl = "https://" + subdominio + ".negocio360.org";
        }
        String enlaceRecuperacion = baseUrl + "/reset-password?token=" + token;
        
        String contenido = String.format(
            "Hola %s,\n\n" +
            "Has solicitado recuperar tu contraseña en tu tienda.\n\n" +
            "Para establecer una nueva contraseña, haz clic en el siguiente enlace:\n" +
            "%s\n\n" +
            "Este enlace expirará en 1 hora por seguridad.\n\n" +
            "Si no solicitaste este cambio, puedes ignorar este email.\n\n" +
            "Saludos,\n" +
            "Equipo de tu tienda",
            nombreUsuario, enlaceRecuperacion
        );
        
        message.setText(contenido);
        
        try {
            System.out.println("=== DEBUG EMAIL CLIENTE ===");
            System.out.println("From: " + fromEmail);
            System.out.println("To: " + emailDestino);
            System.out.println("Subject: " + message.getSubject());
            System.out.println("Subdominio: " + subdominio);
            System.out.println("Enlace de recuperación: " + enlaceRecuperacion);
            System.out.println("Enviando email de recuperación de cliente...");
            
            emailSender.send(message);
            System.out.println("✅ Email de recuperación de cliente enviado exitosamente a: " + emailDestino);
        } catch (Exception e) {
            System.err.println("❌ Error al enviar email de recuperación de cliente: " + e.getMessage());
            System.err.println("⚠️ NOTA: El token se generó correctamente, pero no se pudo enviar el email.");
            System.err.println("⚠️ Para solucionar esto, configura Gmail correctamente o usa un servicio de email alternativo.");
            // No lanzamos excepción para que el proceso continúe
            // throw new RuntimeException("Error al enviar email de recuperación", e);
        }
    }

    /**
     * Envía un email de confirmación de cambio de contraseña para clientes
     */
    public void enviarEmailConfirmacionCambioCliente(String emailDestino, String nombreUsuario) {
        SimpleMailMessage message = new SimpleMailMessage();
        
        message.setFrom(fromEmail);
        message.setTo(emailDestino);
        message.setSubject("Contraseña Actualizada - Tu Tienda");
        
        String contenido = String.format(
            "Hola %s,\n\n" +
            "Tu contraseña ha sido actualizada exitosamente en tu tienda.\n\n" +
            "Si no realizaste este cambio, contacta inmediatamente con soporte.\n\n" +
            "Saludos,\n" +
            "Equipo de tu tienda",
            nombreUsuario
        );
        
        message.setText(contenido);
        
        try {
            emailSender.send(message);
            System.out.println("Email de confirmación de cliente enviado a: " + emailDestino);
        } catch (Exception e) {
            System.err.println("Error al enviar email de confirmación de cliente: " + e.getMessage());
            // No lanzamos excepción aquí porque el cambio de contraseña ya se realizó
        }
    }

    /**
     * Envía un email de confirmación de cambio de contraseña
     */
    public void enviarEmailConfirmacionCambio(String emailDestino, String nombreUsuario) {
        SimpleMailMessage message = new SimpleMailMessage();
        
        message.setFrom(fromEmail);
        message.setTo(emailDestino);
        message.setSubject("Contraseña Actualizada - Negocio360");
        
        String contenido = String.format(
            "Hola %s,\n\n" +
            "Tu contraseña ha sido actualizada exitosamente en Negocio360.\n\n" +
            "Si no realizaste este cambio, contacta inmediatamente con soporte.\n\n" +
            "Saludos,\n" +
            "Equipo de Negocio360",
            nombreUsuario
        );
        
        message.setText(contenido);
        
        try {
            emailSender.send(message);
            System.out.println("Email de confirmación enviado a: " + emailDestino);
        } catch (Exception e) {
            System.err.println("Error al enviar email de confirmación: " + e.getMessage());
            // No lanzamos excepción aquí porque el cambio de contraseña ya se realizó
        }
    }
} 