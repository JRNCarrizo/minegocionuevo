package com.minegocio.backend.servicios;

import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Notificacion;
import com.minegocio.backend.entidades.Suscripcion;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.NotificacionRepository;
import com.minegocio.backend.repositorios.SuscripcionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Servicio para manejar notificaciones relacionadas con suscripciones
 */
@Service
@Transactional
public class NotificacionSuscripcionService {

    @Autowired
    private SuscripcionRepository suscripcionRepository;

    @Autowired
    private NotificacionRepository notificacionRepository;

    @Autowired
    private EmpresaRepository empresaRepository;

    @Autowired
    private EmailService emailService;

    /**
     * Verifica suscripciones por expirar y crea notificaciones
     * Se ejecuta diariamente a las 9:00 AM
     */
    @Scheduled(cron = "0 0 9 * * ?")
    public void verificarSuscripcionesPorExpirar() {
        System.out.println("🔔 Verificando suscripciones por expirar...");
        
        LocalDateTime ahora = LocalDateTime.now();
        LocalDateTime fechaLimite = ahora.plusDays(7); // Notificar 7 días antes
        
        List<Suscripcion> suscripcionesPorExpirar = suscripcionRepository.findSuscripcionesPorExpirar(ahora, fechaLimite);
        
        for (Suscripcion suscripcion : suscripcionesPorExpirar) {
            crearNotificacionExpiracion(suscripcion);
        }
        
        System.out.println("🔔 Proceso completado. Suscripciones verificadas: " + suscripcionesPorExpirar.size());
    }

    /**
     * Crea una notificación de expiración para una suscripción
     */
    private void crearNotificacionExpiracion(Suscripcion suscripcion) {
        Empresa empresa = suscripcion.getEmpresa();
        long diasRestantes = suscripcion.getDiasRestantes();
        
        // Verificar si ya existe una notificación reciente para esta suscripción
        List<Notificacion> notificacionesRecientes = notificacionRepository.findByTipoAndEmpresaIdOrderByFechaCreacionDesc(
                "SUSCRIPCION_EXPIRACION", empresa.getId());
        if (!notificacionesRecientes.isEmpty() && 
            notificacionesRecientes.get(0).getFechaCreacion().isAfter(LocalDateTime.now().minusDays(1))) {
            return; // Ya se notificó recientemente
        }
        
        String titulo = "Suscripción por expirar";
        String mensaje;
        
        if (diasRestantes <= 0) {
            titulo = "Suscripción expirada";
            mensaje = "Tu suscripción al plan '" + suscripcion.getPlan().getNombre() + "' ha expirado. " +
                     "Para continuar disfrutando de todos los servicios, renueva tu suscripción.";
        } else if (diasRestantes <= 1) {
            mensaje = "Tu suscripción al plan '" + suscripcion.getPlan().getNombre() + "' expira mañana. " +
                     "Renueva ahora para evitar interrupciones en el servicio.";
        } else if (diasRestantes <= 3) {
            mensaje = "Tu suscripción al plan '" + suscripcion.getPlan().getNombre() + "' expira en " + 
                     diasRestantes + " días. Renueva ahora para mantener todos los servicios activos.";
        } else {
            mensaje = "Tu suscripción al plan '" + suscripcion.getPlan().getNombre() + "' expira en " + 
                     diasRestantes + " días. Considera renovar para continuar disfrutando de todos los beneficios.";
        }
        
        // Crear notificación
        Notificacion notificacion = new Notificacion();
        notificacion.setEmpresaId(empresa.getId());
        notificacion.setTitulo(titulo);
        notificacion.setDescripcion(mensaje);
        notificacion.setTipo("SUSCRIPCION_EXPIRACION");
        notificacion.setLeida(false);
        notificacion.setFechaCreacion(LocalDateTime.now());
        
        notificacionRepository.save(notificacion);
        
        // Enviar email si es crítico (1 día o menos)
        if (diasRestantes <= 1) {
            enviarEmailExpiracion(empresa, suscripcion, diasRestantes);
        }
        
        System.out.println("🔔 Notificación creada para empresa: " + empresa.getNombre() + 
                          " - Días restantes: " + diasRestantes);
    }

    /**
     * Envía email de notificación de expiración
     */
    private void enviarEmailExpiracion(Empresa empresa, Suscripcion suscripcion, long diasRestantes) {
        try {
            String asunto = diasRestantes <= 0 ? 
                "Tu suscripción ha expirado - " + empresa.getNombre() :
                "Tu suscripción expira pronto - " + empresa.getNombre();
            
            String contenido = generarContenidoEmailExpiracion(empresa, suscripcion, diasRestantes);
            
            emailService.enviarEmail(empresa.getEmail(), asunto, contenido);
            
            System.out.println("📧 Email de expiración enviado a: " + empresa.getEmail());
        } catch (Exception e) {
            System.err.println("❌ Error enviando email de expiración: " + e.getMessage());
        }
    }

    /**
     * Genera el contenido del email de expiración
     */
    private String generarContenidoEmailExpiracion(Empresa empresa, Suscripcion suscripcion, long diasRestantes) {
        StringBuilder contenido = new StringBuilder();
        
        contenido.append("<html><body>");
        contenido.append("<h2>Hola ").append(empresa.getNombre()).append("</h2>");
        
        if (diasRestantes <= 0) {
            contenido.append("<p><strong>Tu suscripción ha expirado.</strong></p>");
            contenido.append("<p>Tu suscripción al plan '").append(suscripcion.getPlan().getNombre())
                     .append("' ha expirado. Para continuar disfrutando de todos los servicios, " +
                            "renueva tu suscripción ahora.</p>");
        } else {
            contenido.append("<p><strong>Tu suscripción expira pronto.</strong></p>");
            contenido.append("<p>Tu suscripción al plan '").append(suscripcion.getPlan().getNombre())
                     .append("' expira en ").append(diasRestantes).append(" día(s).</p>");
        }
        
        contenido.append("<p><strong>Detalles de tu plan actual:</strong></p>");
        contenido.append("<ul>");
        contenido.append("<li>Plan: ").append(suscripcion.getPlan().getNombre()).append("</li>");
        contenido.append("<li>Precio: $").append(suscripcion.getPrecio()).append(" ").append(suscripcion.getMoneda()).append("</li>");
        contenido.append("<li>Fecha de expiración: ").append(suscripcion.getFechaFin()).append("</li>");
        contenido.append("</ul>");
        
        contenido.append("<p>Para renovar tu suscripción, accede a tu panel de administración.</p>");
        contenido.append("<p>Si tienes alguna pregunta, no dudes en contactarnos.</p>");
        contenido.append("<p>Saludos,<br>El equipo de MiNegocio</p>");
        contenido.append("</body></html>");
        
        return contenido.toString();
    }

    /**
     * Crea una notificación de límite alcanzado
     */
    public void crearNotificacionLimiteAlcanzado(Empresa empresa, String tipoLimite, int porcentaje) {
        String titulo = "Límite de " + tipoLimite + " alcanzado";
        String mensaje = "Has alcanzado el " + porcentaje + "% de tu límite de " + tipoLimite + 
                        ". Considera actualizar tu plan para continuar creciendo.";
        
        Notificacion notificacion = new Notificacion();
        notificacion.setEmpresaId(empresa.getId());
        notificacion.setTitulo(titulo);
        notificacion.setDescripcion(mensaje);
        notificacion.setTipo("LIMITE_ALCANZADO");
        notificacion.setLeida(false);
        notificacion.setFechaCreacion(LocalDateTime.now());
        
        notificacionRepository.save(notificacion);
        
        System.out.println("🔔 Notificación de límite creada para empresa: " + empresa.getNombre() + 
                          " - Tipo: " + tipoLimite + " - Porcentaje: " + porcentaje + "%");
    }
} 