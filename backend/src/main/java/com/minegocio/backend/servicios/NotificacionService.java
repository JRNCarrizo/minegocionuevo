package com.minegocio.backend.servicios;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.minegocio.backend.entidades.Notificacion;
import com.minegocio.backend.repositorios.NotificacionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class NotificacionService {
    
    @Autowired
    private NotificacionRepository notificacionRepository;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    // Crear notificación de nuevo pedido
    public void crearNotificacionPedidoNuevo(Long empresaId, String clienteNombre, Double monto) {
        try {
            Map<String, Object> detalles = new HashMap<>();
            detalles.put("cliente", clienteNombre);
            detalles.put("monto", monto);
            
            Notificacion notificacion = new Notificacion(
                "PEDIDO_NUEVO",
                "Nuevo pedido recibido",
                "Cliente: " + clienteNombre + " - $" + String.format("%.2f", monto),
                empresaId
            );
            notificacion.setIcono("✓");
            notificacion.setColor("#10b981");
            notificacion.setDetalles(objectMapper.writeValueAsString(detalles));
            
            notificacionRepository.save(notificacion);
        } catch (Exception e) {
            System.err.println("Error al crear notificación de pedido nuevo: " + e.getMessage());
        }
    }
    
    // Crear notificación de producto actualizado
    public void crearNotificacionProductoActualizado(Long empresaId, String nombreProducto, String tipoActualizacion) {
        try {
            Map<String, Object> detalles = new HashMap<>();
            detalles.put("producto", nombreProducto);
            detalles.put("tipoActualizacion", tipoActualizacion);
            
            Notificacion notificacion = new Notificacion(
                "PRODUCTO_ACTUALIZADO",
                "Producto actualizado",
                nombreProducto + " - " + tipoActualizacion,
                empresaId
            );
            notificacion.setIcono("📦");
            notificacion.setColor("#3b82f6");
            notificacion.setDetalles(objectMapper.writeValueAsString(detalles));
            
            notificacionRepository.save(notificacion);
        } catch (Exception e) {
            System.err.println("Error al crear notificación de producto actualizado: " + e.getMessage());
        }
    }
    
    // Crear notificación de nuevo cliente
    public void crearNotificacionClienteNuevo(Long empresaId, String nombreCliente, String email) {
        try {
            Map<String, Object> detalles = new HashMap<>();
            detalles.put("cliente", nombreCliente);
            detalles.put("email", email);
            
            Notificacion notificacion = new Notificacion(
                "CLIENTE_NUEVO",
                "Nuevo cliente registrado",
                nombreCliente + " - " + email,
                empresaId
            );
            notificacion.setIcono("👤");
            notificacion.setColor("#f59e0b");
            notificacion.setDetalles(objectMapper.writeValueAsString(detalles));
            
            notificacionRepository.save(notificacion);
        } catch (Exception e) {
            System.err.println("Error al crear notificación de cliente nuevo: " + e.getMessage());
        }
    }
    
    // Crear notificación de pedido cancelado
    public void crearNotificacionPedidoCancelado(Long empresaId, String clienteNombre, String motivo) {
        try {
            Map<String, Object> detalles = new HashMap<>();
            detalles.put("cliente", clienteNombre);
            detalles.put("motivo", motivo);
            
            Notificacion notificacion = new Notificacion(
                "PEDIDO_CANCELADO",
                "Pedido cancelado",
                "Cliente: " + clienteNombre + " - Motivo: " + motivo,
                empresaId
            );
            notificacion.setIcono("❌");
            notificacion.setColor("#ef4444");
            notificacion.setDetalles(objectMapper.writeValueAsString(detalles));
            
            notificacionRepository.save(notificacion);
        } catch (Exception e) {
            System.err.println("Error al crear notificación de pedido cancelado: " + e.getMessage());
        }
    }
    
    // Crear notificación de venta rápida
    public void crearNotificacionVentaRapida(Long empresaId, Double monto, String metodoPago) {
        try {
            Map<String, Object> detalles = new HashMap<>();
            detalles.put("monto", monto);
            detalles.put("metodoPago", metodoPago);
            
            Notificacion notificacion = new Notificacion(
                "VENTA_RAPIDA",
                "Nueva venta rápida",
                "Venta de $" + String.format("%.2f", monto) + " - " + metodoPago,
                empresaId
            );
            notificacion.setIcono("💰");
            notificacion.setColor("#8b5cf6");
            notificacion.setDetalles(objectMapper.writeValueAsString(detalles));
            
            notificacionRepository.save(notificacion);
        } catch (Exception e) {
            System.err.println("Error al crear notificación de venta rápida: " + e.getMessage());
        }
    }
    
    // Crear notificación de stock bajo
    public void crearNotificacionStockBajo(Long empresaId, String nombreProducto, Integer stockActual) {
        try {
            Map<String, Object> detalles = new HashMap<>();
            detalles.put("producto", nombreProducto);
            detalles.put("stockActual", stockActual);
            
            Notificacion notificacion = new Notificacion(
                "STOCK_BAJO",
                "Stock bajo",
                nombreProducto + " - Stock: " + stockActual,
                empresaId
            );
            notificacion.setIcono("⚠️");
            notificacion.setColor("#f97316");
            notificacion.setDetalles(objectMapper.writeValueAsString(detalles));
            
            notificacionRepository.save(notificacion);
        } catch (Exception e) {
            System.err.println("Error al crear notificación de stock bajo: " + e.getMessage());
        }
    }
    
    // Crear notificación de pedido completado
    public void crearNotificacionPedidoCompletado(Long empresaId, String clienteNombre, String numeroPedido) {
        try {
            Map<String, Object> detalles = new HashMap<>();
            detalles.put("cliente", clienteNombre);
            detalles.put("numeroPedido", numeroPedido);
            
            Notificacion notificacion = new Notificacion(
                "PEDIDO_COMPLETADO",
                "Pedido completado",
                "Cliente: " + clienteNombre + " - Pedido #" + numeroPedido,
                empresaId
            );
            notificacion.setIcono("🎉");
            notificacion.setColor("#10b981");
            notificacion.setDetalles(objectMapper.writeValueAsString(detalles));
            
            notificacionRepository.save(notificacion);
        } catch (Exception e) {
            System.err.println("Error al crear notificación de pedido completado: " + e.getMessage());
        }
    }
    
    // Obtener notificaciones paginadas
    public Page<Notificacion> obtenerNotificaciones(Long empresaId, int pagina, int tamano) {
        Pageable pageable = PageRequest.of(pagina, tamano);
        return notificacionRepository.findByEmpresaIdOrderByFechaCreacionDesc(empresaId, pageable);
    }
    
    // Obtener notificaciones recientes (últimas 24 horas)
    public List<Notificacion> obtenerNotificacionesRecientes(Long empresaId) {
        LocalDateTime fechaLimite = LocalDateTime.now().minusHours(24);
        return notificacionRepository.findNotificacionesRecientes(empresaId, fechaLimite);
    }
    
    // Obtener notificaciones no leídas
    public List<Notificacion> obtenerNotificacionesNoLeidas(Long empresaId) {
        return notificacionRepository.findByEmpresaIdAndLeidaFalseOrderByFechaCreacionDesc(empresaId);
    }
    
    // Contar notificaciones no leídas
    public long contarNotificacionesNoLeidas(Long empresaId) {
        return notificacionRepository.countByEmpresaIdAndLeidaFalse(empresaId);
    }
    
    // Marcar notificación como leída
    public void marcarComoLeida(Long notificacionId) {
        notificacionRepository.findById(notificacionId).ifPresent(notificacion -> {
            notificacion.setLeida(true);
            notificacionRepository.save(notificacion);
        });
    }
    
    // Marcar todas las notificaciones como leídas
    public void marcarTodasComoLeidas(Long empresaId) {
        List<Notificacion> notificaciones = notificacionRepository.findByEmpresaIdAndLeidaFalseOrderByFechaCreacionDesc(empresaId);
        for (Notificacion notificacion : notificaciones) {
            notificacion.setLeida(true);
        }
        notificacionRepository.saveAll(notificaciones);
    }
    
    // Eliminar notificaciones antiguas (más de 30 días)
    public int limpiarNotificacionesAntiguas(Long empresaId) {
        try {
            LocalDateTime fechaLimite = LocalDateTime.now().minusDays(30);
            
            // Primero contar cuántas notificaciones se van a eliminar
            List<Notificacion> notificacionesAntiguas = notificacionRepository.findByEmpresaIdAndFechaCreacionBefore(empresaId, fechaLimite);
            int cantidadAEliminar = notificacionesAntiguas.size();
            
            if (cantidadAEliminar > 0) {
                notificacionRepository.deleteNotificacionesAntiguas(empresaId, fechaLimite);
                System.out.println("Se eliminaron " + cantidadAEliminar + " notificaciones antiguas para la empresa " + empresaId);
            } else {
                System.out.println("No se encontraron notificaciones antiguas para eliminar en la empresa " + empresaId);
            }
            
            return cantidadAEliminar;
        } catch (Exception e) {
            System.err.println("Error al limpiar notificaciones antiguas: " + e.getMessage());
            throw new RuntimeException("Error al limpiar notificaciones antiguas: " + e.getMessage());
        }
    }
    
    // Eliminar una notificación específica
    public void eliminarNotificacion(Long notificacionId, Long empresaId) {
        Notificacion notificacion = notificacionRepository.findById(notificacionId)
                .orElseThrow(() -> new RuntimeException("Notificación no encontrada"));
        
        // Verificar que la notificación pertenece a la empresa (seguridad multi-tenant)
        if (!notificacion.getEmpresaId().equals(empresaId)) {
            throw new RuntimeException("No tienes permisos para eliminar esta notificación");
        }
        
        notificacionRepository.delete(notificacion);
    }
    
    // Eliminar múltiples notificaciones
    public void eliminarNotificaciones(Long empresaId, List<Long> notificacionIds) {
        List<Notificacion> notificaciones = notificacionRepository.findAllById(notificacionIds);
        
        // Filtrar solo las notificaciones que pertenecen a la empresa
        List<Notificacion> notificacionesAEliminar = notificaciones.stream()
                .filter(n -> n.getEmpresaId().equals(empresaId))
                .collect(Collectors.toList());
        
        notificacionRepository.deleteAll(notificacionesAEliminar);
    }
    
    // Formatear tiempo transcurrido
    public String formatearTiempoTranscurrido(LocalDateTime fecha) {
        LocalDateTime ahora = LocalDateTime.now();
        long segundos = java.time.Duration.between(fecha, ahora).getSeconds();
        
        if (segundos < 60) {
            return "Hace un momento";
        } else if (segundos < 3600) {
            long minutos = segundos / 60;
            return "Hace " + minutos + " min" + (minutos > 1 ? "s" : "");
        } else if (segundos < 86400) {
            long horas = segundos / 3600;
            return "Hace " + horas + " hora" + (horas > 1 ? "s" : "");
        } else {
            long dias = segundos / 86400;
            return "Hace " + dias + " día" + (dias > 1 ? "s" : "");
        }
    }
} 