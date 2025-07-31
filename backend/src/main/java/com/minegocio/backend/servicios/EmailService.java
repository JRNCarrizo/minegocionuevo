package com.minegocio.backend.servicios;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender emailSender;
    
    @Value("${minegocio.app.frontend.url}")
    private String frontendUrl;

    /**
     * Envía un email de recuperación de contraseña
     */
    public void enviarEmailRecuperacion(String emailDestino, String token, String nombreUsuario) {
        SimpleMailMessage message = new SimpleMailMessage();
        
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
            emailSender.send(message);
            System.out.println("Email de recuperación enviado a: " + emailDestino);
        } catch (Exception e) {
            System.err.println("Error al enviar email de recuperación: " + e.getMessage());
            throw new RuntimeException("Error al enviar email de recuperación", e);
        }
    }

    /**
     * Envía un email de recuperación de contraseña para clientes
     */
    public void enviarEmailRecuperacionCliente(String emailDestino, String token, String nombreUsuario, String subdominio) {
        SimpleMailMessage message = new SimpleMailMessage();
        
        message.setTo(emailDestino);
        message.setSubject("Recuperación de Contraseña - Tu Tienda");
        
        // Construir el enlace dinámicamente basado en el subdominio y la URL del frontend
        String baseUrl = frontendUrl;
        if (baseUrl.contains("localhost")) {
            // Para desarrollo, usar el formato subdominio.localhost:3000
            baseUrl = "http://" + subdominio + ".localhost:3000";
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
            emailSender.send(message);
            System.out.println("Email de recuperación de cliente enviado a: " + emailDestino);
        } catch (Exception e) {
            System.err.println("Error al enviar email de recuperación de cliente: " + e.getMessage());
            throw new RuntimeException("Error al enviar email de recuperación", e);
        }
    }

    /**
     * Envía un email de confirmación de cambio de contraseña para clientes
     */
    public void enviarEmailConfirmacionCambioCliente(String emailDestino, String nombreUsuario) {
        SimpleMailMessage message = new SimpleMailMessage();
        
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