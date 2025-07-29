package com.minegocio.backend.controladores;

import com.minegocio.backend.dto.VentaRapidaDTO;
import com.minegocio.backend.dto.VentaRapidaHistorialDTO;
import com.minegocio.backend.entidades.VentaRapida;
import com.minegocio.backend.seguridad.UsuarioPrincipal;
import com.minegocio.backend.servicios.VentaRapidaService;
import com.minegocio.backend.util.GenerarHashPassword;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.transaction.annotation.Transactional;

/**
 * Controlador para manejar las ventas rápidas desde la caja
 */
@RestController
@RequestMapping("/api/admin/venta-rapida")
@CrossOrigin(origins = "*")
public class VentaRapidaController {

    @Autowired
    private VentaRapidaService ventaRapidaService;

    /**
     * Procesa una venta rápida
     */
    @PostMapping("/procesar")
    public ResponseEntity<?> procesarVentaRapida(@Valid @RequestBody VentaRapidaDTO ventaDTO) {
        try {
            System.out.println("=== PROCESANDO VENTA RÁPIDA ===");
            System.out.println("Cliente: " + ventaDTO.getClienteNombre());
            System.out.println("Email: " + ventaDTO.getClienteEmail());
            System.out.println("Total: " + ventaDTO.getTotal());
            System.out.println("Subtotal: " + ventaDTO.getSubtotal());
            System.out.println("Método de pago: " + ventaDTO.getMetodoPago());
            System.out.println("Cantidad de detalles: " + (ventaDTO.getDetalles() != null ? ventaDTO.getDetalles().size() : 0));
            if (ventaDTO.getDetalles() != null) {
                for (int i = 0; i < ventaDTO.getDetalles().size(); i++) {
                    var detalle = ventaDTO.getDetalles().get(i);
                    System.out.println("Detalle " + i + ": Producto ID=" + detalle.getProductoId() + 
                                     ", Nombre=" + detalle.getProductoNombre() + 
                                     ", Cantidad=" + detalle.getCantidad() + 
                                     ", Precio=" + detalle.getPrecioUnitario());
                }
            }
            System.out.println("===============================");
            // Obtener el ID de la empresa del usuario autenticado
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(Map.of("error", "No autorizado"));
            }

            // Obtener empresaId del usuario autenticado
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long empresaId = usuarioPrincipal.getEmpresaId();

            if (empresaId == null) {
                return ResponseEntity.status(400).body(Map.of("error", "ID de empresa no válido"));
            }

            // Procesar la venta
            VentaRapida ventaRapida = ventaRapidaService.procesarVentaRapida(empresaId, ventaDTO);

            Map<String, Object> response = new HashMap<>();
            response.put("mensaje", "Venta procesada correctamente");
            response.put("ventaId", ventaRapida.getId());
            response.put("numeroComprobante", ventaRapida.getNumeroComprobante());
            response.put("total", ventaRapida.getTotal());
            response.put("fechaVenta", ventaRapida.getFechaVenta());

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("=== ERROR PROCESANDO VENTA RÁPIDA ===");
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error al procesar la venta: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Procesa una venta rápida usando la información del usuario autenticado como cliente
     */
    @PostMapping("/procesar-con-usuario")
    public ResponseEntity<?> procesarVentaRapidaConUsuario(@Valid @RequestBody VentaRapidaDTO ventaDTO) {
        try {
            System.out.println("=== PROCESANDO VENTA RÁPIDA CON USUARIO ===");
            
            // Obtener el ID de la empresa del usuario autenticado
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(Map.of("error", "No autorizado"));
            }

            // Obtener empresaId del usuario autenticado
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long empresaId = usuarioPrincipal.getEmpresaId();

            if (empresaId == null) {
                return ResponseEntity.status(400).body(Map.of("error", "ID de empresa no válido"));
            }

            // Usar la información del usuario autenticado para el cliente
            String nombreUsuario = usuarioPrincipal.getNombreCompleto();
            String emailUsuario = usuarioPrincipal.getUsername();

            // Crear un DTO modificado con la información del usuario
            VentaRapidaDTO ventaConUsuario = new VentaRapidaDTO();
            ventaConUsuario.setClienteNombre(nombreUsuario);
            ventaConUsuario.setClienteEmail(emailUsuario);
            ventaConUsuario.setTotal(ventaDTO.getTotal());
            ventaConUsuario.setSubtotal(ventaDTO.getSubtotal());
            ventaConUsuario.setMetodoPago(ventaDTO.getMetodoPago());
            ventaConUsuario.setMontoRecibido(ventaDTO.getMontoRecibido());
            ventaConUsuario.setVuelto(ventaDTO.getVuelto());
            ventaConUsuario.setObservaciones(ventaDTO.getObservaciones());
            ventaConUsuario.setDetalles(ventaDTO.getDetalles());

            // Procesar la venta
            VentaRapida ventaRapida = ventaRapidaService.procesarVentaRapida(empresaId, ventaConUsuario);

            Map<String, Object> response = new HashMap<>();
            response.put("mensaje", "Venta procesada correctamente con usuario autenticado");
            response.put("ventaId", ventaRapida.getId());
            response.put("numeroComprobante", ventaRapida.getNumeroComprobante());
            response.put("total", ventaRapida.getTotal());
            response.put("fechaVenta", ventaRapida.getFechaVenta());
            response.put("cliente", nombreUsuario);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("=== ERROR PROCESANDO VENTA RÁPIDA CON USUARIO ===");
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error al procesar la venta: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Obtiene el historial completo de ventas rápidas
     */
    @GetMapping("/historial")
    @Transactional(readOnly = true)
    public ResponseEntity<?> obtenerHistorialVentasRapidas() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(Map.of("error", "No autorizado"));
            }

            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long empresaId = usuarioPrincipal.getEmpresaId();

            if (empresaId == null) {
                return ResponseEntity.status(400).body(Map.of("error", "ID de empresa no válido"));
            }

            List<VentaRapidaHistorialDTO> historial = ventaRapidaService.obtenerHistorialVentasRapidas(empresaId);
            return ResponseEntity.ok(historial);

        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error al obtener historial: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Obtiene ventas por rango de fechas
     */
    @GetMapping("/historial/por-fecha")
    public ResponseEntity<?> obtenerVentasPorFecha(
            @RequestParam String fechaInicio,
            @RequestParam String fechaFin) {
        try {
            System.out.println("=== DEBUG FILTRADO POR FECHA ===");
            System.out.println("📅 Fecha inicio recibida: " + fechaInicio);
            System.out.println("📅 Fecha fin recibida: " + fechaFin);
            
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(Map.of("error", "No autorizado"));
            }

            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long empresaId = usuarioPrincipal.getEmpresaId();

            if (empresaId == null) {
                return ResponseEntity.status(400).body(Map.of("error", "ID de empresa no válido"));
            }

            System.out.println("🏢 Empresa ID: " + empresaId);

            LocalDate inicio = LocalDate.parse(fechaInicio);
            LocalDate fin = LocalDate.parse(fechaFin);
            
            System.out.println("📅 Fecha inicio parseada: " + inicio);
            System.out.println("📅 Fecha fin parseada: " + fin);

            List<VentaRapidaHistorialDTO> ventas = ventaRapidaService.obtenerVentasPorFecha(empresaId, inicio, fin);
            
            System.out.println("📊 Ventas encontradas en rango: " + ventas.size());
            System.out.println("=== FIN DEBUG FILTRADO POR FECHA ===");
            
            return ResponseEntity.ok(ventas);

        } catch (Exception e) {
            System.err.println("❌ Error en filtrado por fecha: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error al obtener ventas por fecha: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Obtiene ventas por método de pago
     */
    @GetMapping("/historial/por-metodo-pago")
    public ResponseEntity<?> obtenerVentasPorMetodoPago(@RequestParam String metodoPago) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(Map.of("error", "No autorizado"));
            }

            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long empresaId = usuarioPrincipal.getEmpresaId();

            if (empresaId == null) {
                return ResponseEntity.status(400).body(Map.of("error", "ID de empresa no válido"));
            }

            List<VentaRapidaHistorialDTO> ventas = ventaRapidaService.obtenerVentasPorMetodoPago(empresaId, metodoPago);
            return ResponseEntity.ok(ventas);

        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error al obtener ventas por método de pago: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Obtiene estadísticas de ventas rápidas
     */
    @GetMapping("/estadisticas")
    @Transactional(readOnly = true)
    public ResponseEntity<?> obtenerEstadisticasVentasRapidas(
            @RequestParam(required = false) String fechaInicio,
            @RequestParam(required = false) String fechaFin) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(Map.of("error", "No autorizado"));
            }

            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long empresaId = usuarioPrincipal.getEmpresaId();

            if (empresaId == null) {
                return ResponseEntity.status(400).body(Map.of("error", "ID de empresa no válido"));
            }

            VentaRapidaService.VentaRapidaEstadisticas estadisticas;
            LocalDateTime inicio = null;
            LocalDateTime fin = null;
            
            System.out.println("=== DEBUG ESTADISTICAS VENTAS RAPIDAS ===");
            System.out.println("📅 Fecha inicio recibida: " + fechaInicio);
            System.out.println("📅 Fecha fin recibida: " + fechaFin);
            
            if (fechaInicio != null && fechaFin != null) {
                try {
                    // Si se proporcionan fechas específicas, usar el método con fechas
                    inicio = LocalDateTime.parse(fechaInicio);
                    fin = LocalDateTime.parse(fechaFin);
                    System.out.println("📅 Fecha inicio parseada: " + inicio);
                    System.out.println("📅 Fecha fin parseada: " + fin);
                    estadisticas = ventaRapidaService.obtenerEstadisticasVentasRapidas(empresaId, inicio, fin);
                } catch (Exception e) {
                    System.err.println("❌ Error parseando fechas: " + e.getMessage());
                    throw new RuntimeException("Formato de fecha inválido. Use formato: yyyy-MM-dd'T'HH:mm:ss", e);
                }
            } else {
                // Si no se proporcionan fechas, obtener todas las ventas
                System.out.println("📊 Obteniendo todas las ventas (sin filtro de fecha)");
                estadisticas = ventaRapidaService.obtenerEstadisticasVentasRapidas(empresaId);
            }
            
            System.out.println("=== FIN DEBUG ESTADISTICAS VENTAS RAPIDAS ===");

            Map<String, Object> response = new HashMap<>();
            response.put("totalVentas", estadisticas.getTotalVentas());
            response.put("totalTransacciones", estadisticas.getTotalTransacciones());
            response.put("totalProductos", estadisticas.getTotalProductos());
            response.put("cantidadVentas", estadisticas.getCantidadVentas());
            response.put("fechaInicio", inicio);
            response.put("fechaFin", fin);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error al obtener estadísticas: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Obtiene estadísticas diarias
     */
    @GetMapping("/estadisticas/diarias")
    public ResponseEntity<?> obtenerEstadisticasDiarias(@RequestParam String fecha) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(Map.of("error", "No autorizado"));
            }

            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long empresaId = usuarioPrincipal.getEmpresaId();

            if (empresaId == null) {
                return ResponseEntity.status(400).body(Map.of("error", "ID de empresa no válido"));
            }

            LocalDate fechaConsulta = LocalDate.parse(fecha);
            VentaRapidaService.VentaRapidaEstadisticas estadisticas = 
                ventaRapidaService.obtenerEstadisticasDiarias(empresaId, fechaConsulta);

            Map<String, Object> response = new HashMap<>();
            response.put("totalVentas", estadisticas.getTotalVentas());
            response.put("totalTransacciones", estadisticas.getTotalTransacciones());
            response.put("totalProductos", estadisticas.getTotalProductos());
            response.put("cantidadVentas", estadisticas.getCantidadVentas());
            response.put("fecha", fechaConsulta);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error al obtener estadísticas diarias: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Obtiene estadísticas mensuales
     */
    @GetMapping("/estadisticas/mensuales")
    public ResponseEntity<?> obtenerEstadisticasMensuales(
            @RequestParam int año,
            @RequestParam int mes) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(Map.of("error", "No autorizado"));
            }

            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long empresaId = usuarioPrincipal.getEmpresaId();

            if (empresaId == null) {
                return ResponseEntity.status(400).body(Map.of("error", "ID de empresa no válido"));
            }

            VentaRapidaService.VentaRapidaEstadisticas estadisticas = 
                ventaRapidaService.obtenerEstadisticasMensuales(empresaId, año, mes);

            Map<String, Object> response = new HashMap<>();
            response.put("totalVentas", estadisticas.getTotalVentas());
            response.put("totalTransacciones", estadisticas.getTotalTransacciones());
            response.put("totalProductos", estadisticas.getTotalProductos());
            response.put("cantidadVentas", estadisticas.getCantidadVentas());
            response.put("año", año);
            response.put("mes", mes);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error al obtener estadísticas mensuales: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Obtiene estadísticas anuales
     */
    @GetMapping("/estadisticas/anuales")
    public ResponseEntity<?> obtenerEstadisticasAnuales(@RequestParam int año) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(Map.of("error", "No autorizado"));
            }

            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long empresaId = usuarioPrincipal.getEmpresaId();

            if (empresaId == null) {
                return ResponseEntity.status(400).body(Map.of("error", "ID de empresa no válido"));
            }

            VentaRapidaService.VentaRapidaEstadisticas estadisticas = 
                ventaRapidaService.obtenerEstadisticasAnuales(empresaId, año);

            Map<String, Object> response = new HashMap<>();
            response.put("totalVentas", estadisticas.getTotalVentas());
            response.put("totalTransacciones", estadisticas.getTotalTransacciones());
            response.put("totalProductos", estadisticas.getTotalProductos());
            response.put("cantidadVentas", estadisticas.getCantidadVentas());
            response.put("año", año);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error al obtener estadísticas anuales: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Obtiene una venta específica por ID
     */
    @GetMapping("/venta/{ventaId}")
    public ResponseEntity<?> obtenerVentaPorId(@PathVariable Long ventaId) {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(Map.of("error", "No autorizado"));
            }

            var venta = ventaRapidaService.obtenerVentaRapidaPorId(ventaId);
            if (venta.isPresent()) {
                return ResponseEntity.ok(venta.get());
            } else {
                return ResponseEntity.notFound().build();
            }

        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error al obtener venta: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Endpoint de prueba para verificar que el controlador funciona
     */
    @GetMapping("/test")
    public ResponseEntity<?> test() {
        Map<String, String> response = new HashMap<>();
        response.put("mensaje", "Controlador de venta rápida funcionando correctamente");
        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint de debug para validar datos de venta
     */
    @PostMapping("/debug")
    public ResponseEntity<?> debugVenta(@RequestBody VentaRapidaDTO ventaDTO) {
        Map<String, Object> response = new HashMap<>();
        response.put("datosRecibidos", ventaDTO);
        response.put("clienteNombre", ventaDTO.getClienteNombre());
        response.put("total", ventaDTO.getTotal());
        response.put("subtotal", ventaDTO.getSubtotal());
        response.put("metodoPago", ventaDTO.getMetodoPago());
        response.put("montoRecibido", ventaDTO.getMontoRecibido());
        response.put("vuelto", ventaDTO.getVuelto());
        response.put("cantidadDetalles", ventaDTO.getDetalles() != null ? ventaDTO.getDetalles().size() : 0);
        return ResponseEntity.ok(response);
    }

    /**
     * Obtiene información del usuario autenticado para usar en ventas
     */
    @GetMapping("/usuario-info")
    public ResponseEntity<?> obtenerInformacionUsuario() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(Map.of("error", "No autorizado"));
            }

            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            
            Map<String, Object> usuarioInfo = new HashMap<>();
            usuarioInfo.put("nombre", usuarioPrincipal.getUsuario().getNombre());
            usuarioInfo.put("apellidos", usuarioPrincipal.getUsuario().getApellidos());
            usuarioInfo.put("nombreCompleto", usuarioPrincipal.getNombreCompleto());
            usuarioInfo.put("email", usuarioPrincipal.getUsername());
            usuarioInfo.put("empresaId", usuarioPrincipal.getEmpresaId());
            
            return ResponseEntity.ok(usuarioInfo);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error al obtener información del usuario: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

} 