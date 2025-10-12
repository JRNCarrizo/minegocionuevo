package com.minegocio.backend.servicios;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;
import java.math.BigDecimal;
import com.minegocio.backend.utilidades.FechaUtil;
import org.springframework.core.env.Environment;
import com.sendgrid.*;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import java.io.IOException;

/**
 * Servicio para el envío de emails
 */
@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Autowired
    private Environment environment;

    @Value("${minegocio.app.email.from}")
    private String fromEmail;

    @Value("${minegocio.app.frontend.url}")
    private String frontendUrl;

    @Value("${minegocio.app.nombre}")
    private String appNombre;
    
    @Value("${sendgrid.api.key:}")
    private String sendGridApiKey;

    private boolean isDevelopmentMode() {
        String[] activeProfiles = environment.getActiveProfiles();
        for (String profile : activeProfiles) {
            if (profile.contains("dev") || "h2".equals(profile)) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * Envía email usando la API de SendGrid (no SMTP)
     */
    private boolean enviarEmailConSendGridAPI(String destinatario, String asunto, String contenido) {
        try {
            // Verificar si tenemos API Key de SendGrid
            if (sendGridApiKey == null || sendGridApiKey.trim().isEmpty()) {
                System.err.println("❌ SendGrid API Key no configurada");
                return false;
            }
            
            System.out.println("📧 Usando SendGrid API para enviar email...");
            System.out.println("  Destinatario: " + destinatario);
            System.out.println("  Asunto: " + asunto);
            
            Email from = new Email(fromEmail);
            Email to = new Email(destinatario);
            Content content = new Content("text/plain", contenido);
            Mail mail = new Mail(from, asunto, to, content);
            
            SendGrid sg = new SendGrid(sendGridApiKey);
            Request request = new Request();
            
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());
            
            Response response = sg.api(request);
            
            System.out.println("📤 Respuesta de SendGrid:");
            System.out.println("  Status Code: " + response.getStatusCode());
            System.out.println("  Body: " + response.getBody());
            System.out.println("  Headers: " + response.getHeaders());
            
            if (response.getStatusCode() >= 200 && response.getStatusCode() < 300) {
                System.out.println("✅ Email enviado exitosamente vía SendGrid API");
                return true;
            } else {
                System.err.println("❌ Error al enviar email vía SendGrid API. Status: " + response.getStatusCode());
                return false;
            }
            
        } catch (IOException e) {
            System.err.println("❌ Error de IO al enviar email con SendGrid API:");
            System.err.println("  Mensaje: " + e.getMessage());
            e.printStackTrace();
            return false;
        } catch (Exception e) {
            System.err.println("❌ Error general al enviar email con SendGrid API:");
            System.err.println("  Tipo: " + e.getClass().getName());
            System.err.println("  Mensaje: " + e.getMessage());
            e.printStackTrace();
            return false;
        }
    }

    @PostConstruct
    public void init() {
        System.out.println("=== EMAIL SERVICE INIT ===");
        System.out.println("Frontend URL: " + frontendUrl);
        System.out.println("From Email: " + fromEmail);
        System.out.println("JavaMailSender: " + (mailSender != null ? "Configurado" : "NO CONFIGURADO"));
        System.out.println("Modo desarrollo: " + (isDevelopmentMode() ? "SÍ" : "NO"));
        System.out.println("Perfiles activos: " + String.join(", ", environment.getActiveProfiles()));
        
        // Debug adicional para variables de entorno
        System.out.println("=== DEBUG VARIABLES EMAIL ===");
        System.out.println("MAIL_USERNAME existe: " + (System.getenv("MAIL_USERNAME") != null));
        System.out.println("MAIL_PASSWORD existe: " + (System.getenv("MAIL_PASSWORD") != null));
        System.out.println("MAIL_FROM existe: " + (System.getenv("MAIL_FROM") != null));
        System.out.println("SENDGRID_API_KEY existe: " + (System.getenv("SENDGRID_API_KEY") != null));
        System.out.println("fromEmail valor: " + (fromEmail != null ? fromEmail : "NULL"));
        System.out.println("sendGridApiKey configurado: " + (sendGridApiKey != null && !sendGridApiKey.trim().isEmpty()));
        
        // Determinar método de envío
        System.out.println("=== MÉTODO DE ENVÍO ===");
        if (isDevelopmentMode()) {
            System.out.println("MODO DESARROLLO: Emails simulados en consola");
        } else if (sendGridApiKey != null && !sendGridApiKey.trim().isEmpty()) {
            System.out.println("✅ SENDGRID API: Emails se enviarán vía SendGrid API (recomendado)");
        } else if (mailSender != null) {
            System.out.println("⚠️ SMTP: Emails se enviarán vía SMTP (puede estar bloqueado en Railway)");
        } else {
            System.out.println("❌ EMAIL DESHABILITADO: No hay método de envío configurado");
        }
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
        
        if (isDevelopmentMode() || mailSender == null) {
            System.out.println("🚀 MODO DESARROLLO O EMAIL DESHABILITADO: Simulando envío de email de recuperación");
            System.out.println("📧 Email simulado enviado a: " + emailDestino);
            System.out.println("🔗 Enlace para desarrollo: http://localhost:5173/recuperar-contraseña?token=" + token);
            return;
        }
        
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
            
            mailSender.send(message);
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
        System.out.println("=== 📧 ENVIANDO EMAIL DE RECUPERACIÓN CLIENTE ===");
        System.out.println("📧 Email destino: " + emailDestino);
        System.out.println("👤 Usuario: " + nombreUsuario);
        System.out.println("🏪 Subdominio: " + subdominio);
        System.out.println("🔑 Token: " + token);
        
        if (isDevelopmentMode() || mailSender == null) {
            System.out.println("🚀 MODO DESARROLLO O EMAIL DESHABILITADO: Simulando envío de email de recuperación de cliente");
            System.out.println("📧 Email simulado enviado a: " + emailDestino);
            System.out.println("🔗 Enlace para desarrollo: http://" + subdominio + ".localhost:5173/reset-password?token=" + token);
            return;
        }
        
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
            System.out.println("Contenido del email:");
            System.out.println("--- INICIO CONTENIDO ---");
            System.out.println(contenido);
            System.out.println("--- FIN CONTENIDO ---");
            System.out.println("Enviando email de recuperación de cliente...");
            
            // Verificar configuración del mailSender
            System.out.println("Configuración del mailSender:");
            System.out.println("Host configurado: " + mailSender.toString());
            
            mailSender.send(message);
            System.out.println("✅ Email de recuperación de cliente enviado exitosamente a: " + emailDestino);
            System.out.println("✅ Email enviado exitosamente");
        } catch (Exception e) {
            System.err.println("❌ Error al enviar email de recuperación de cliente: " + e.getMessage());
            System.err.println("❌ Stack trace completo:");
            e.printStackTrace();
            System.err.println("⚠️ NOTA: El token se generó correctamente, pero no se pudo enviar el email.");
            System.err.println("⚠️ Para solucionar esto, configura Gmail correctamente o usa un servicio de email alternativo.");
            System.err.println("⚠️ Verifica que la contraseña de aplicación de Gmail sea correcta.");
            System.err.println("⚠️ Verifica que el email no esté en la carpeta de spam.");
            // No lanzamos excepción para que el proceso continúe
            // throw new RuntimeException("Error al enviar email de recuperación", e);
        }
    }

    /**
     * Envía un email de confirmación de cambio de contraseña para clientes
     */
    public void enviarEmailConfirmacionCambioCliente(String emailDestino, String nombreUsuario) {
        if (isDevelopmentMode() || mailSender == null) {
            System.out.println("🚀 MODO DESARROLLO O EMAIL DESHABILITADO: Simulando envío de email de confirmación de cambio de cliente");
            System.out.println("📧 Email simulado enviado a: " + emailDestino);
            return;
        }
        
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
            mailSender.send(message);
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
        if (isDevelopmentMode() || mailSender == null) {
            System.out.println("🚀 MODO DESARROLLO O EMAIL DESHABILITADO: Simulando envío de email de confirmación de cambio");
            System.out.println("📧 Email simulado enviado a: " + emailDestino);
            return;
        }
        
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
            mailSender.send(message);
            System.out.println("Email de confirmación enviado a: " + emailDestino);
        } catch (Exception e) {
            System.err.println("Error al enviar email de confirmación: " + e.getMessage());
            // No lanzamos excepción aquí porque el cambio de contraseña ya se realizó
        }
    }

    /**
     * Envía email de verificación de cuenta
     */
    public void enviarEmailVerificacion(String emailDestinatario, String nombreUsuario, String tokenVerificacion) {
        System.out.println("=== 📧 ENVIANDO EMAIL DE VERIFICACIÓN ===");
        System.out.println("📧 Email destino: " + emailDestinatario);
        System.out.println("👤 Usuario: " + nombreUsuario);
        System.out.println("🔑 Token: " + tokenVerificacion);
        
        // Verificar si estamos en modo desarrollo O si el email no está configurado
        if (isDevelopmentMode() || mailSender == null || fromEmail == null || fromEmail.trim().isEmpty()) {
            System.out.println("==========================================================");
            System.out.println("🚀 MODO DESARROLLO - EMAIL DE VERIFICACIÓN (ADMIN)");
            System.out.println("==========================================================");
            System.out.println("📧 Destinatario: " + emailDestinatario);
            System.out.println("👤 Usuario: " + nombreUsuario);
            System.out.println("🔑 Token: " + tokenVerificacion);
            System.out.println("");
            System.out.println("🔗 ENLACE DE VERIFICACIÓN:");
            System.out.println("   https://negocio360.org/verificar-email-admin?token=" + tokenVerificacion);
            System.out.println("   http://localhost:5173/verificar-email-admin?token=" + tokenVerificacion);
            System.out.println("");
            System.out.println("📋 INSTRUCCIONES:");
            System.out.println("   1. Copia el enlace de arriba");
            System.out.println("   2. Pégalo en tu navegador");
            System.out.println("   3. Tu cuenta se verificará automáticamente");
            System.out.println("==========================================================");
            return;
        }
        
        // Contenido del email
        String contenido = String.format(
            "Hola %s,\n\n" +
            "Gracias por registrarte en %s. Para completar tu registro, " +
            "por favor verifica tu cuenta haciendo clic en el siguiente enlace:\n\n" +
            "%s/verificar-email-admin?token=%s\n\n" +
            "Este enlace expirará en 24 horas.\n\n" +
            "Si no solicitaste este registro, puedes ignorar este email.\n\n" +
            "Saludos,\n" +
            "El equipo de %s",
            nombreUsuario,
            appNombre,
            frontendUrl,
            tokenVerificacion,
            appNombre
        );
        
        String asunto = "Verifica tu cuenta - " + appNombre;
        
        // Intentar primero con SendGrid API si está configurado
        if (sendGridApiKey != null && !sendGridApiKey.trim().isEmpty()) {
            System.out.println("📧 Intentando enviar email con SendGrid API...");
            boolean exitoso = enviarEmailConSendGridAPI(emailDestinatario, asunto, contenido);
            
            if (exitoso) {
                System.out.println("✅ Email enviado exitosamente a: " + emailDestinatario);
                return;
            } else {
                System.err.println("⚠️ SendGrid API falló, intentando con SMTP...");
            }
        }
        
        // Si SendGrid API no está disponible o falló, intentar con SMTP
        try {
            System.out.println("📧 Preparando email para envío vía SMTP...");
            System.out.println("From Email: " + fromEmail);
            System.out.println("To Email: " + emailDestinatario);
            System.out.println("MailSender configurado: " + (mailSender != null));
            
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(emailDestinatario);
            message.setSubject(asunto);
            message.setText(contenido);
            
            System.out.println("📤 Intentando enviar email vía SMTP...");
            mailSender.send(message);
            System.out.println("✅ Email enviado exitosamente vía SMTP a: " + emailDestinatario);
        } catch (Exception e) {
            System.err.println("❌ ERROR DETALLADO AL ENVIAR EMAIL:");
            System.err.println("   Tipo de error: " + e.getClass().getName());
            System.err.println("   Mensaje: " + e.getMessage());
            System.err.println("   Causa: " + (e.getCause() != null ? e.getCause().getMessage() : "N/A"));
            e.printStackTrace();
            System.err.println("🔗 ENLACE DE VERIFICACIÓN MANUAL:");
            System.err.println("   https://negocio360.org/verificar-email-admin?token=" + tokenVerificacion);
            // No lanzar la excepción para no fallar el registro
        }
    }

    /**
     * Envía un email de verificación para clientes
     */
    public void enviarEmailVerificacionCliente(String emailDestinatario, String nombreUsuario, String tokenVerificacion, String subdominio, String nombreEmpresa) {
        System.out.println("=== 📧 ENVIANDO EMAIL DE VERIFICACIÓN CLIENTE ===");
        System.out.println("📧 Email destino: " + emailDestinatario);
        System.out.println("👤 Usuario: " + nombreUsuario);
        System.out.println("🏪 Subdominio: " + subdominio);
        System.out.println("🏢 Empresa: " + nombreEmpresa);
        System.out.println("🔑 Token: " + tokenVerificacion);
        System.out.println("🔍 Modo desarrollo detectado: " + (isDevelopmentMode() ? "SÍ" : "NO"));
        
        if (isDevelopmentMode() || mailSender == null) {
            System.out.println("==========================================================");
            System.out.println("🚀 MODO DESARROLLO - EMAIL DE VERIFICACIÓN (CLIENTE)");
            System.out.println("==========================================================");
            System.out.println("📧 Destinatario: " + emailDestinatario);
            System.out.println("👤 Usuario: " + nombreUsuario);
            System.out.println("🏢 Empresa: " + nombreEmpresa);
            System.out.println("🏪 Subdominio: " + subdominio);
            System.out.println("🔑 Token: " + tokenVerificacion);
            System.out.println("");
            System.out.println("🔗 ENLACES DE VERIFICACIÓN:");
            System.out.println("   Opción 1: http://" + subdominio + ".localhost:5173/verificar-email?token=" + tokenVerificacion);
            System.out.println("   Opción 2: http://localhost:5173/verificar-email?token=" + tokenVerificacion);
            System.out.println("");
            System.out.println("📋 INSTRUCCIONES:");
            System.out.println("   1. Copia uno de los enlaces de arriba");
            System.out.println("   2. Pégalo en tu navegador");
            System.out.println("   3. Tu cuenta se verificará automáticamente");
            System.out.println("==========================================================");
            return;
        }
        
        // Construir el enlace dinámicamente basado en el subdominio y la URL del frontend
        String baseUrl = frontendUrl;
        if (baseUrl.contains("localhost")) {
            // Para desarrollo, usar el formato subdominio.localhost:5173
            baseUrl = "http://" + subdominio + ".localhost:5173";
        } else {
            // Para producción, usar el formato subdominio.negocio360.org
            baseUrl = "https://" + subdominio + ".negocio360.org";
        }
        
        String enlaceVerificacion = baseUrl + "/verificar-email?token=" + tokenVerificacion;
        
        String contenido = String.format(
            "Hola %s,\n\n" +
            "Gracias por registrarte en %s.\n\n" +
            "Para activar tu cuenta, haz clic en el siguiente enlace:\n" +
            "%s\n\n" +
            "Este enlace expirará en 24 horas.\n\n" +
            "Si no creaste esta cuenta, puedes ignorar este email.\n\n" +
            "Saludos,\n" +
            "El equipo de %s",
            nombreUsuario, 
            nombreEmpresa,
            enlaceVerificacion,
            nombreEmpresa
        );
        
        String asunto = "Verifica tu cuenta - " + nombreEmpresa;
        
        // Intentar primero con SendGrid API si está configurado
        if (sendGridApiKey != null && !sendGridApiKey.trim().isEmpty()) {
            System.out.println("📧 Intentando enviar email con SendGrid API...");
            boolean exitoso = enviarEmailConSendGridAPI(emailDestinatario, asunto, contenido);
            
            if (exitoso) {
                System.out.println("✅ Email enviado exitosamente a: " + emailDestinatario);
                return;
            } else {
                System.err.println("⚠️ SendGrid API falló, intentando con SMTP...");
            }
        }
        
        // Fallback a SMTP si SendGrid API no está disponible o falló
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(emailDestinatario);
            message.setSubject(asunto);
            message.setText(contenido);
            
            mailSender.send(message);
            System.out.println("✅ Email de verificación de cliente enviado exitosamente vía SMTP a: " + emailDestinatario);
        } catch (Exception e) {
            System.err.println("❌ Error al enviar email de verificación de cliente: " + e.getMessage());
            System.err.println("🔗 ENLACE DE VERIFICACIÓN MANUAL:");
            System.err.println("   " + enlaceVerificacion);
            e.printStackTrace();
        }
    }

    /**
     * Envía email de bienvenida después de verificar la cuenta
     */
    public void enviarEmailBienvenida(String emailDestinatario, String nombreUsuario, String nombreEmpresa) {
        if (isDevelopmentMode() || mailSender == null) {
            System.out.println("🚀 MODO DESARROLLO O EMAIL DESHABILITADO: Simulando envío de email de bienvenida");
            System.out.println("📧 Email simulado enviado a: " + emailDestinatario);
            return;
        }
        
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(emailDestinatario);
        message.setSubject("¡Bienvenido a " + appNombre + "!");
        
        String contenido = String.format(
            "Hola %s,\n\n" +
            "¡Tu cuenta ha sido verificada exitosamente!\n\n" +
            "Tu empresa '%s' ya está activa en %s y puedes comenzar a usar todas las funcionalidades.\n\n" +
            "Tu período de prueba de 1 mes ha comenzado. Durante este tiempo podrás:\n" +
            "- Gestionar productos y servicios\n" +
            "- Administrar clientes\n" +
            "- Procesar pedidos y ventas\n" +
            "- Personalizar tu tienda\n" +
            "- Y mucho más...\n\n" +
            "Para acceder a tu panel de administración, visita:\n" +
            "%s\n\n" +
            "Si tienes alguna pregunta, no dudes en contactarnos.\n\n" +
            "¡Gracias por elegir %s!\n\n" +
            "Saludos,\n" +
            "El equipo de %s",
            nombreUsuario,
            nombreEmpresa,
            appNombre,
            frontendUrl,
            appNombre,
            appNombre
        );
        
        message.setText(contenido);
        mailSender.send(message);
    }

    /**
     * Envía email de recordatorio de verificación
     */
    public void enviarEmailRecordatorioVerificacion(String emailDestinatario, String nombreUsuario, String tokenVerificacion) {
        if (isDevelopmentMode() || mailSender == null) {
            System.out.println("🚀 MODO DESARROLLO O EMAIL DESHABILITADO: Simulando envío de email de recordatorio de verificación");
            System.out.println("📧 Email simulado enviado a: " + emailDestinatario);
            return;
        }
        
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(emailDestinatario);
        message.setSubject("Recordatorio: Verifica tu cuenta - " + appNombre);
        
        String contenido = String.format(
            "Hola %s,\n\n" +
            "Notamos que aún no has verificado tu cuenta en %s. " +
            "Para completar tu registro y comenzar a usar la plataforma, " +
            "por favor verifica tu cuenta haciendo clic en el siguiente enlace:\n\n" +
            "%s/verificar-email?token=%s\n\n" +
            "Este enlace expirará en 24 horas.\n\n" +
            "Si ya verificaste tu cuenta, puedes ignorar este email.\n\n" +
            "Saludos,\n" +
            "El equipo de %s",
            nombreUsuario,
            appNombre,
            frontendUrl,
            tokenVerificacion,
            appNombre
        );
        
        message.setText(contenido);
        mailSender.send(message);
    }

    /**
     * Envía un email genérico
     */
    public void enviarEmail(String emailDestinatario, String asunto, String contenido) {
        if (isDevelopmentMode() || mailSender == null) {
            System.out.println("🚀 MODO DESARROLLO O EMAIL DESHABILITADO: Simulando envío de email genérico");
            System.out.println("📧 Email simulado enviado a: " + emailDestinatario);
            System.out.println("📝 Asunto: " + asunto);
            return;
        }
        
        SimpleMailMessage message = new SimpleMailMessage();
        
        message.setFrom(fromEmail);
        message.setTo(emailDestinatario);
        message.setSubject(asunto);
        message.setText(contenido);
        
        try {
            mailSender.send(message);
            System.out.println("✅ Email enviado exitosamente a: " + emailDestinatario);
        } catch (Exception e) {
            System.err.println("❌ Error al enviar email: " + e.getMessage());
        }
    }

    /**
     * Envía notificación de nuevo pedido al email de contacto de la empresa
     */
    public void enviarNotificacionNuevoPedido(String emailEmpresa, String nombreEmpresa, String numeroPedido, String clienteNombre, String clienteEmail, BigDecimal total, String direccionEntrega) {
        if (isDevelopmentMode()) {
            System.out.println("🚀 MODO DESARROLLO: Simulando envío de notificación de nuevo pedido");
            System.out.println("📧 Email simulado enviado a: " + emailEmpresa);
            System.out.println("🛒 Pedido: " + numeroPedido);
            return;
        }
        
        String asunto = "🛒 Nuevo Pedido Recibido - " + nombreEmpresa;
        String contenido = String.format(
            "Hola,\n\n" +
            "Has recibido un nuevo pedido en tu tienda %s.\n\n" +
            "📋 Detalles del pedido:\n" +
            "• Número de pedido: %s\n" +
            "• Cliente: %s\n" +
            "• Email del cliente: %s\n" +
            "• Dirección de entrega: %s\n" +
            "• Total: $%.2f\n\n" +
            "⏰ Fecha y hora: %s\n\n" +
            "Por favor, accede a tu panel de administración para gestionar este pedido:\n" +
            "%s\n\n" +
            "Saludos,\n" +
            "negocio360",
            nombreEmpresa,
            numeroPedido,
            clienteNombre,
            clienteEmail,
            direccionEntrega,
            total,
            FechaUtil.ahoraFormateado(),
            frontendUrl
        );
        
        // Intentar primero con SendGrid API
        if (sendGridApiKey != null && !sendGridApiKey.trim().isEmpty()) {
            System.out.println("📧 Enviando notificación de pedido con SendGrid API...");
            boolean exitoso = enviarEmailConSendGridAPI(emailEmpresa, asunto, contenido);
            if (exitoso) {
                System.out.println("✅ Notificación de nuevo pedido enviada a: " + emailEmpresa);
                return;
            }
            System.err.println("⚠️ SendGrid API falló, intentando con SMTP...");
        }
        
        // Fallback a SMTP
        if (mailSender != null) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail);
                message.setTo(emailEmpresa);
                message.setSubject(asunto);
                message.setText(contenido);
                mailSender.send(message);
                System.out.println("✅ Notificación de nuevo pedido enviada vía SMTP a: " + emailEmpresa);
            } catch (Exception e) {
                System.err.println("❌ Error al enviar notificación de nuevo pedido: " + e.getMessage());
            }
        }
    }

    /**
     * Envía notificación de pedido cancelado al email de contacto de la empresa
     */
    public void enviarNotificacionPedidoCancelado(String emailEmpresa, String nombreEmpresa, String numeroPedido, String clienteNombre, String clienteEmail, BigDecimal total) {
        if (isDevelopmentMode()) {
            System.out.println("🚀 MODO DESARROLLO: Simulando envío de notificación de pedido cancelado");
            System.out.println("📧 Email simulado enviado a: " + emailEmpresa);
            System.out.println("❌ Pedido cancelado: " + numeroPedido);
            return;
        }
        
        String asunto = "❌ Pedido Cancelado - " + nombreEmpresa;
        String contenido = String.format(
            "Hola,\n\n" +
            "Un pedido ha sido cancelado en tu tienda %s.\n\n" +
            "📋 Detalles del pedido cancelado:\n" +
            "• Número de pedido: %s\n" +
            "• Cliente: %s\n" +
            "• Email del cliente: %s\n" +
            "• Total: $%.2f\n\n" +
            "⏰ Fecha y hora de cancelación: %s\n\n" +
            "Saludos,\n" +
            "negocio360",
            nombreEmpresa,
            numeroPedido,
            clienteNombre,
            clienteEmail,
            total,
            FechaUtil.ahoraFormateado()
        );
        
        // Intentar primero con SendGrid API
        if (sendGridApiKey != null && !sendGridApiKey.trim().isEmpty()) {
            System.out.println("📧 Enviando notificación de cancelación con SendGrid API...");
            boolean exitoso = enviarEmailConSendGridAPI(emailEmpresa, asunto, contenido);
            if (exitoso) {
                System.out.println("✅ Notificación de pedido cancelado enviada a: " + emailEmpresa);
                return;
            }
            System.err.println("⚠️ SendGrid API falló, intentando con SMTP...");
        }
        
        // Fallback a SMTP
        if (mailSender != null) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail);
                message.setTo(emailEmpresa);
                message.setSubject(asunto);
                message.setText(contenido);
                mailSender.send(message);
                System.out.println("✅ Notificación de pedido cancelado enviada vía SMTP a: " + emailEmpresa);
            } catch (Exception e) {
                System.err.println("❌ Error al enviar notificación de pedido cancelado: " + e.getMessage());
            }
        }
    }
    
    /**
     * Envía notificación de cancelación al cliente
     */
    public void enviarNotificacionCancelacionCliente(String emailCliente, String nombreCliente, String nombreEmpresa, String numeroPedido, BigDecimal total, String motivoCancelacion) {
        if (isDevelopmentMode()) {
            System.out.println("🚀 MODO DESARROLLO: Simulando envío de notificación de cancelación al cliente");
            System.out.println("📧 Email simulado enviado a: " + emailCliente);
            System.out.println("❌ Pedido cancelado: " + numeroPedido);
            return;
        }
        
        String asunto = "❌ Pedido Cancelado - " + nombreEmpresa;
        String motivoTexto = (motivoCancelacion != null && !motivoCancelacion.trim().isEmpty()) 
            ? "💬 Motivo: " + motivoCancelacion + "\n\n" 
            : "";
        
        String contenido = String.format(
            "Hola %s,\n\n" +
            "Lamentamos informarte que tu pedido ha sido cancelado.\n\n" +
            "📋 Detalles del pedido:\n" +
            "• Número de pedido: %s\n" +
            "• Total: $%.2f\n" +
            "• Estado: Cancelado\n\n" +
            "%s" +
            "⏰ Fecha y hora de cancelación: %s\n\n" +
            "Si tienes alguna pregunta sobre esta cancelación, no dudes en contactarnos.\n\n" +
            "Saludos,\n" +
            "%s",
            nombreCliente,
            numeroPedido,
            total,
            motivoTexto,
            FechaUtil.ahoraFormateado(),
            nombreEmpresa
        );
        
        // Intentar primero con SendGrid API
        if (sendGridApiKey != null && !sendGridApiKey.trim().isEmpty()) {
            System.out.println("📧 Enviando notificación de cancelación al cliente con SendGrid API...");
            boolean exitoso = enviarEmailConSendGridAPI(emailCliente, asunto, contenido);
            if (exitoso) {
                System.out.println("✅ Notificación de cancelación enviada al cliente: " + emailCliente);
                return;
            }
            System.err.println("⚠️ SendGrid API falló, intentando con SMTP...");
        }
        
        // Fallback a SMTP
        if (mailSender != null) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail);
                message.setTo(emailCliente);
                message.setSubject(asunto);
                message.setText(contenido);
                mailSender.send(message);
                System.out.println("✅ Notificación de cancelación enviada vía SMTP al cliente: " + emailCliente);
            } catch (Exception e) {
                System.err.println("❌ Error al enviar notificación de cancelación al cliente: " + e.getMessage());
            }
        }
    }

    /**
     * Envía notificación al cliente cuando el pedido es enviado
     */
    public void enviarNotificacionPedidoEnviado(String emailCliente, String nombreCliente, String nombreEmpresa, String numeroPedido, BigDecimal total, String direccionEntrega) {
        if (isDevelopmentMode()) {
            System.out.println("🚀 MODO DESARROLLO: Simulando envío de notificación de pedido enviado");
            System.out.println("📧 Email simulado enviado a: " + emailCliente);
            System.out.println("🚚 Pedido enviado: " + numeroPedido);
            return;
        }
        
        String asunto = "🚚 Tu Pedido Ha Sido Enviado - " + nombreEmpresa;
        String contenido = String.format(
            "Hola %s,\n\n" +
            "¡Buenas noticias! Tu pedido ha sido enviado y está en camino.\n\n" +
            "📋 Detalles del pedido:\n" +
            "• Número de pedido: %s\n" +
            "• Total: $%.2f\n" +
            "• Dirección de entrega: %s\n" +
            "• Estado: En camino\n\n" +
            "⏰ Fecha y hora de envío: %s\n\n" +
            "Tu pedido llegará pronto a tu dirección. Si tienes alguna pregunta, no dudes en contactarnos.\n\n" +
            "Saludos,\n" +
            "%s",
            nombreCliente,
            numeroPedido,
            total,
            direccionEntrega,
            FechaUtil.ahoraFormateado(),
            nombreEmpresa
        );
        
        // Intentar primero con SendGrid API
        if (sendGridApiKey != null && !sendGridApiKey.trim().isEmpty()) {
            System.out.println("📧 Enviando notificación de envío con SendGrid API...");
            boolean exitoso = enviarEmailConSendGridAPI(emailCliente, asunto, contenido);
            if (exitoso) {
                System.out.println("✅ Notificación de envío enviada al cliente: " + emailCliente);
                return;
            }
            System.err.println("⚠️ SendGrid API falló, intentando con SMTP...");
        }
        
        // Fallback a SMTP
        if (mailSender != null) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail);
                message.setTo(emailCliente);
                message.setSubject(asunto);
                message.setText(contenido);
                mailSender.send(message);
                System.out.println("✅ Notificación de envío enviada vía SMTP al cliente: " + emailCliente);
            } catch (Exception e) {
                System.err.println("❌ Error al enviar notificación de envío al cliente: " + e.getMessage());
            }
        }
    }

    /**
     * Envía confirmación de compra al cliente
     */
    public void enviarConfirmacionCompraCliente(String emailCliente, String nombreCliente, String nombreEmpresa, String numeroPedido, BigDecimal total, String direccionEntrega) {
        if (isDevelopmentMode()) {
            System.out.println("🚀 MODO DESARROLLO: Simulando envío de confirmación de compra al cliente");
            System.out.println("📧 Email simulado enviado a: " + emailCliente);
            System.out.println("🛒 Pedido: " + numeroPedido);
            return;
        }
        
        String asunto = "🛒 Confirmación de Compra - " + nombreEmpresa;
        String contenido = String.format(
            "Hola %s,\n\n" +
            "¡Gracias por tu compra en %s!\n\n" +
            "📋 Detalles de tu pedido:\n" +
            "• Número de pedido: %s\n" +
            "• Total: $%.2f\n" +
            "• Dirección de entrega: %s\n" +
            "• Estado: Pendiente de confirmación\n\n" +
            "⏰ Fecha y hora: %s\n\n" +
            "Tu pedido ha sido recibido y está siendo procesado. Te notificaremos cuando sea confirmado por nuestro equipo.\n\n" +
            "Si tienes alguna pregunta, no dudes en contactarnos.\n\n" +
            "Saludos,\n" +
            "Equipo de %s",
            nombreCliente,
            nombreEmpresa,
            numeroPedido,
            total,
            direccionEntrega,
            FechaUtil.ahoraFormateado(),
            nombreEmpresa
        );
        
        // Intentar primero con SendGrid API
        if (sendGridApiKey != null && !sendGridApiKey.trim().isEmpty()) {
            System.out.println("📧 Enviando confirmación de compra con SendGrid API...");
            boolean exitoso = enviarEmailConSendGridAPI(emailCliente, asunto, contenido);
            if (exitoso) {
                System.out.println("✅ Confirmación de compra enviada al cliente: " + emailCliente);
                return;
            }
            System.err.println("⚠️ SendGrid API falló, intentando con SMTP...");
        }
        
        // Fallback a SMTP
        if (mailSender != null) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail);
                message.setTo(emailCliente);
                message.setSubject(asunto);
                message.setText(contenido);
                mailSender.send(message);
                System.out.println("✅ Confirmación de compra enviada vía SMTP al cliente: " + emailCliente);
            } catch (Exception e) {
                System.err.println("❌ Error al enviar confirmación de compra al cliente: " + e.getMessage());
            }
        }
    }

    /**
     * Envía confirmación de pedido por administrador al cliente
     */
    public void enviarConfirmacionAdminCliente(String emailCliente, String nombreCliente, String nombreEmpresa, String numeroPedido, BigDecimal total) {
        if (isDevelopmentMode()) {
            System.out.println("🚀 MODO DESARROLLO: Simulando envío de confirmación de administrador al cliente");
            System.out.println("📧 Email simulado enviado a: " + emailCliente);
            System.out.println("✅ Pedido confirmado: " + numeroPedido);
            return;
        }
        
        String asunto = "✅ Pedido Confirmado - " + nombreEmpresa;
        String contenido = String.format(
            "Hola %s,\n\n" +
            "¡Excelentes noticias! Tu pedido en %s ha sido confirmado.\n\n" +
            "📋 Detalles del pedido:\n" +
            "• Número de pedido: %s\n" +
            "• Total: $%.2f\n" +
            "• Estado: Confirmado\n\n" +
            "⏰ Fecha y hora de confirmación: %s\n\n" +
            "Tu pedido está siendo preparado y pronto estará en camino. Te notificaremos cuando sea enviado.\n\n" +
            "Gracias por confiar en nosotros.\n\n" +
            "Saludos,\n" +
            "Equipo de %s",
            nombreCliente,
            nombreEmpresa,
            numeroPedido,
            total,
            FechaUtil.ahoraFormateado(),
            nombreEmpresa
        );
        
        // Intentar primero con SendGrid API
        if (sendGridApiKey != null && !sendGridApiKey.trim().isEmpty()) {
            System.out.println("📧 Enviando confirmación de admin con SendGrid API...");
            boolean exitoso = enviarEmailConSendGridAPI(emailCliente, asunto, contenido);
            if (exitoso) {
                System.out.println("✅ Confirmación de administrador enviada al cliente: " + emailCliente);
                return;
            }
            System.err.println("⚠️ SendGrid API falló, intentando con SMTP...");
        }
        
        // Fallback a SMTP
        if (mailSender != null) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail);
                message.setTo(emailCliente);
                message.setSubject(asunto);
                message.setText(contenido);
                mailSender.send(message);
                System.out.println("✅ Confirmación de administrador enviada vía SMTP al cliente: " + emailCliente);
            } catch (Exception e) {
                System.err.println("❌ Error al enviar confirmación de administrador al cliente: " + e.getMessage());
            }
        }
    }

    /**
     * Envía notificación de entrega al cliente
     */
    public void enviarNotificacionEntregaCliente(String emailCliente, String nombreCliente, String nombreEmpresa, String numeroPedido, BigDecimal total) {
        if (isDevelopmentMode()) {
            System.out.println("🚀 MODO DESARROLLO: Simulando envío de notificación de entrega al cliente");
            System.out.println("📧 Email simulado enviado a: " + emailCliente);
            System.out.println("🎉 Pedido entregado: " + numeroPedido);
            return;
        }
        
        String asunto = "🎉 ¡Tu Pedido Ha Sido Entregado! - " + nombreEmpresa;
        String contenido = String.format(
            "Hola %s,\n\n" +
            "¡Tu pedido ha sido entregado exitosamente!\n\n" +
            "📋 Detalles del pedido:\n" +
            "• Número de pedido: %s\n" +
            "• Total: $%.2f\n" +
            "• Estado: Entregado\n\n" +
            "⏰ Fecha y hora de entrega: %s\n\n" +
            "Esperamos que disfrutes tu compra. Si tienes alguna pregunta o necesitas asistencia, no dudes en contactarnos.\n\n" +
            "¡Gracias por elegir %s!\n\n" +
            "Saludos,\n" +
            "Equipo de %s",
            nombreCliente,
            numeroPedido,
            total,
            FechaUtil.ahoraFormateado(),
            nombreEmpresa,
            nombreEmpresa
        );
        
        // Intentar primero con SendGrid API
        if (sendGridApiKey != null && !sendGridApiKey.trim().isEmpty()) {
            System.out.println("📧 Enviando notificación de entrega con SendGrid API...");
            boolean exitoso = enviarEmailConSendGridAPI(emailCliente, asunto, contenido);
            if (exitoso) {
                System.out.println("✅ Notificación de entrega enviada al cliente: " + emailCliente);
                return;
            }
            System.err.println("⚠️ SendGrid API falló, intentando con SMTP...");
        }
        
        // Fallback a SMTP
        if (mailSender != null) {
            try {
                SimpleMailMessage message = new SimpleMailMessage();
                message.setFrom(fromEmail);
                message.setTo(emailCliente);
                message.setSubject(asunto);
                message.setText(contenido);
                mailSender.send(message);
                System.out.println("✅ Notificación de entrega enviada vía SMTP al cliente: " + emailCliente);
            } catch (Exception e) {
                System.err.println("❌ Error al enviar notificación de entrega al cliente: " + e.getMessage());
            }
        }
    }
} 