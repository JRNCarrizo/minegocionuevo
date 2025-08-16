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

/**
 * Servicio para el envío de emails
 */
@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private Environment environment;

    @Value("${minegocio.app.email.from}")
    private String fromEmail;

    @Value("${minegocio.app.frontend.url}")
    private String frontendUrl;

    @Value("${minegocio.app.nombre}")
    private String appNombre;

    private boolean isDevelopmentMode() {
        String[] activeProfiles = environment.getActiveProfiles();
        for (String profile : activeProfiles) {
            if ("dev".equals(profile) || "h2".equals(profile)) {
                return true;
            }
        }
        return false;
    }

    @PostConstruct
    public void init() {
        System.out.println("=== EMAIL SERVICE INIT ===");
        System.out.println("Frontend URL: " + frontendUrl);
        System.out.println("From Email: " + fromEmail);
        System.out.println("JavaMailSender: " + (mailSender != null ? "Configurado" : "NO CONFIGURADO"));
        System.out.println("Modo desarrollo: " + (isDevelopmentMode() ? "SÍ" : "NO"));
        System.out.println("Perfiles activos: " + String.join(", ", environment.getActiveProfiles()));
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
        
        if (isDevelopmentMode()) {
            System.out.println("🚀 MODO DESARROLLO: Simulando envío de email de recuperación");
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
        
        if (isDevelopmentMode()) {
            System.out.println("🚀 MODO DESARROLLO: Simulando envío de email de recuperación de cliente");
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
        if (isDevelopmentMode()) {
            System.out.println("🚀 MODO DESARROLLO: Simulando envío de email de confirmación de cambio de cliente");
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
        if (isDevelopmentMode()) {
            System.out.println("🚀 MODO DESARROLLO: Simulando envío de email de confirmación de cambio");
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
        
        if (isDevelopmentMode()) {
            System.out.println("🚀 MODO DESARROLLO: Simulando envío de email de verificación");
            System.out.println("📧 Email simulado enviado a: " + emailDestinatario);
            System.out.println("🔗 Enlace para desarrollo: http://localhost:5173/verificar-email-admin?token=" + tokenVerificacion);
            System.out.println("📋 Para probar, copia y pega el enlace en tu navegador");
            System.out.println("==================================================");
            System.out.println("🎯 ¡COPIA ESTE ENLACE AHORA!: http://localhost:5173/verificar-email-admin?token=" + tokenVerificacion);
            System.out.println("==================================================");
            return;
        }
        
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(emailDestinatario);
        message.setSubject("Verifica tu cuenta - " + appNombre);
        
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
        
        message.setText(contenido);
        mailSender.send(message);
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
        
        if (isDevelopmentMode()) {
            System.out.println("🚀 MODO DESARROLLO: Simulando envío de email de verificación de cliente");
            System.out.println("📧 Email simulado enviado a: " + emailDestinatario);
            System.out.println("🔗 Enlace para desarrollo: http://" + subdominio + ".localhost:5173/verificar-email?token=" + tokenVerificacion);
            System.out.println("🔗 Enlace alternativo: http://localhost:5173/verificar-email?token=" + tokenVerificacion);
            System.out.println("📋 Para probar, copia y pega el enlace en tu navegador");
            System.out.println("==================================================");
            System.out.println("🎯 ¡COPIA ESTE ENLACE AHORA!: http://localhost:5173/verificar-email?token=" + tokenVerificacion);
            System.out.println("==================================================");
            return;
        }
        
        SimpleMailMessage message = new SimpleMailMessage();
        
        message.setFrom(fromEmail);
        message.setTo(emailDestinatario);
        message.setSubject("Verifica tu cuenta - " + nombreEmpresa);
        
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
            "Gracias por registrarte en nuestra tienda.\n\n" +
            "Para activar tu cuenta, haz clic en el siguiente enlace:\n" +
            "%s\n\n" +
            "Este enlace expirará en 24 horas.\n\n" +
            "Si no creaste esta cuenta, puedes ignorar este email.\n\n" +
            "Saludos,\n" +
            "negocio360",
            nombreUsuario, enlaceVerificacion
        );
        
        message.setText(contenido);
        
        try {
            mailSender.send(message);
            System.out.println("✅ Email de verificación de cliente enviado exitosamente a: " + emailDestinatario);
        } catch (Exception e) {
            System.err.println("❌ Error al enviar email de verificación de cliente: " + e.getMessage());
        }
    }

    /**
     * Envía email de bienvenida después de verificar la cuenta
     */
    public void enviarEmailBienvenida(String emailDestinatario, String nombreUsuario, String nombreEmpresa) {
        if (isDevelopmentMode()) {
            System.out.println("🚀 MODO DESARROLLO: Simulando envío de email de bienvenida");
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
        if (isDevelopmentMode()) {
            System.out.println("🚀 MODO DESARROLLO: Simulando envío de email de recordatorio de verificación");
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
        if (isDevelopmentMode()) {
            System.out.println("🚀 MODO DESARROLLO: Simulando envío de email genérico");
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
        
        SimpleMailMessage message = new SimpleMailMessage();
        
        message.setFrom(fromEmail);
        message.setTo(emailEmpresa);
        message.setSubject("🛒 Nuevo Pedido Recibido - " + nombreEmpresa);
        
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
        
        message.setText(contenido);
        
        try {
            mailSender.send(message);
            System.out.println("✅ Notificación de nuevo pedido enviada a: " + emailEmpresa);
        } catch (Exception e) {
            System.err.println("❌ Error al enviar notificación de nuevo pedido: " + e.getMessage());
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
        
        SimpleMailMessage message = new SimpleMailMessage();
        
        message.setFrom(fromEmail);
        message.setTo(emailEmpresa);
        message.setSubject("❌ Pedido Cancelado - " + nombreEmpresa);
        
        String contenido = String.format(
            "Hola,\n\n" +
            "Un pedido ha sido cancelado en tu tienda %s.\n\n" +
            "📋 Detalles del pedido cancelado:\n" +
            "• Número de pedido: %s\n" +
            "• Cliente: %s\n" +
            "• Email del cliente: %s\n" +
            "• Total: $%.2f\n\n" +
            "⏰ Fecha y hora de cancelación: %s\n\n" +
            "El stock de los productos ha sido restaurado automáticamente.\n\n" +
            "Saludos,\n" +
            "negocio360",
            nombreEmpresa,
            numeroPedido,
            clienteNombre,
            clienteEmail,
            total,
            FechaUtil.ahoraFormateado()
        );
        
        message.setText(contenido);
        
        try {
            mailSender.send(message);
            System.out.println("✅ Notificación de pedido cancelado enviada a: " + emailEmpresa);
        } catch (Exception e) {
            System.err.println("❌ Error al enviar notificación de pedido cancelado: " + e.getMessage());
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
        
        SimpleMailMessage message = new SimpleMailMessage();
        
        message.setFrom(fromEmail);
        message.setTo(emailCliente);
        message.setSubject("🛒 Confirmación de Compra - " + nombreEmpresa);
        
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
        
        message.setText(contenido);
        
        try {
            mailSender.send(message);
            System.out.println("✅ Confirmación de compra enviada al cliente: " + emailCliente);
        } catch (Exception e) {
            System.err.println("❌ Error al enviar confirmación de compra al cliente: " + e.getMessage());
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
        
        SimpleMailMessage message = new SimpleMailMessage();
        
        message.setFrom(fromEmail);
        message.setTo(emailCliente);
        message.setSubject("✅ Pedido Confirmado - " + nombreEmpresa);
        
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
        
        message.setText(contenido);
        
        try {
            mailSender.send(message);
            System.out.println("✅ Confirmación de administrador enviada al cliente: " + emailCliente);
        } catch (Exception e) {
            System.err.println("❌ Error al enviar confirmación de administrador al cliente: " + e.getMessage());
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
        
        SimpleMailMessage message = new SimpleMailMessage();
        
        message.setFrom(fromEmail);
        message.setTo(emailCliente);
        message.setSubject("🎉 ¡Tu Pedido Ha Sido Entregado! - " + nombreEmpresa);
        
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
        
        message.setText(contenido);
        
        try {
            mailSender.send(message);
            System.out.println("✅ Notificación de entrega enviada al cliente: " + emailCliente);
        } catch (Exception e) {
            System.err.println("❌ Error al enviar notificación de entrega al cliente: " + e.getMessage());
        }
    }
} 