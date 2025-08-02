package com.minegocio.backend.controladores;

import com.minegocio.backend.dto.PedidoDTO;
import com.minegocio.backend.servicios.PedidoService;
import com.minegocio.backend.servicios.EmailService;
import com.minegocio.backend.utils.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/empresas/{empresaId}/pedidos")
@CrossOrigin(origins = "*", maxAge = 3600)
public class PedidoController {

    @Autowired
    private PedidoService pedidoService;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private com.minegocio.backend.servicios.EmpresaService empresaService;

    @PostMapping
    public ResponseEntity<?> crearPedido(@PathVariable Long empresaId, @RequestBody PedidoDTO pedidoDTO) {
        try {
            PedidoDTO nuevoPedido = pedidoService.crearPedido(empresaId, pedidoDTO);
            
            // Enviar notificación por email a la empresa
            try {
                var empresa = empresaService.obtenerPorId(empresaId);
                if (empresa.isPresent()) {
                    emailService.enviarNotificacionNuevoPedido(
                        empresa.get().getEmail(),
                        empresa.get().getNombre(),
                        nuevoPedido.getNumeroPedido(),
                        nuevoPedido.getClienteNombre(),
                        nuevoPedido.getClienteEmail(),
                        nuevoPedido.getTotal(),
                        nuevoPedido.getDireccionEntrega()
                    );
                }
            } catch (Exception e) {
                System.err.println("Error enviando notificación de nuevo pedido: " + e.getMessage());
                // No lanzar excepción para no fallar la creación del pedido
            }
            
            return ResponseEntity.status(HttpStatus.CREATED).body(nuevoPedido);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error al crear el pedido: " + e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> obtenerPedidos(@PathVariable Long empresaId) {
        try {
            System.out.println("=== DEBUG OBTENER PEDIDOS ADMIN ===");
            System.out.println("EmpresaId: " + empresaId);
            
            List<PedidoDTO> pedidos = pedidoService.obtenerPedidosPorEmpresa(empresaId);
            
            System.out.println("Pedidos encontrados: " + pedidos.size());
            pedidos.forEach(pedido -> {
                System.out.println("  - Pedido ID: " + pedido.getId() + 
                                 ", Cliente: " + pedido.getClienteNombre() + 
                                 ", Total: " + pedido.getTotal() +
                                 ", Estado: " + pedido.getEstado());
            });
            System.out.println("=== FIN DEBUG OBTENER PEDIDOS ADMIN ===");
            
            // Devolver en formato paginado esperado por el frontend
            var respuesta = Map.of(
                "content", pedidos,
                "totalElements", pedidos.size(),
                "totalPages", 1,
                "number", 0,
                "size", pedidos.size(),
                "first", true,
                "last", true
            );
            
            return ResponseEntity.ok(respuesta);
        } catch (Exception e) {
            System.err.println("ERROR al obtener pedidos: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Nuevo endpoint: obtener pedidos por cliente
    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<?> obtenerPedidosPorCliente(@PathVariable Long empresaId, @PathVariable Long clienteId) {
        try {
            System.out.println("=== DEBUG OBTENER PEDIDOS POR CLIENTE ===");
            System.out.println("EmpresaId: " + empresaId);
            System.out.println("ClienteId: " + clienteId);
            
            List<PedidoDTO> pedidos = pedidoService.obtenerPedidosPorClienteYEmpresa(clienteId, empresaId);
            
            System.out.println("Pedidos encontrados: " + pedidos.size());
            pedidos.forEach(pedido -> {
                System.out.println("  - Pedido ID: " + pedido.getId() + ", Cliente: " + pedido.getClienteNombre() + ", Total: " + pedido.getTotal());
            });
            System.out.println("=== FIN DEBUG OBTENER PEDIDOS POR CLIENTE ===");
            
            // Devolver en el formato esperado por el frontend
            var respuesta = Map.of(
                "data", pedidos,
                "mensaje", "Pedidos obtenidos exitosamente"
            );
            
            return ResponseEntity.ok(respuesta);
        } catch (Exception e) {
            System.err.println("ERROR al obtener pedidos por cliente: " + e.getMessage());
            e.printStackTrace();
            
            var error = Map.of(
                "error", "Error al obtener pedidos: " + e.getMessage()
            );
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Endpoint de prueba para verificar pedidos
     */
    @GetMapping("/debug/todos")
    public ResponseEntity<?> debugTodosLosPedidos(@PathVariable Long empresaId) {
        try {
            System.out.println("=== DEBUG TODOS LOS PEDIDOS ===");
            System.out.println("EmpresaId: " + empresaId);
            
            List<PedidoDTO> todosLosPedidos = pedidoService.obtenerPedidosPorEmpresa(empresaId);
            
            System.out.println("Total de pedidos en la empresa: " + todosLosPedidos.size());
            todosLosPedidos.forEach(pedido -> {
                System.out.println("  - Pedido ID: " + pedido.getId() + 
                                 ", Cliente: " + pedido.getClienteNombre() + 
                                 " (ID: " + pedido.getClienteId() + ")" +
                                 ", Total: " + pedido.getTotal() +
                                 ", Estado: " + pedido.getEstado());
            });
            System.out.println("=== FIN DEBUG TODOS LOS PEDIDOS ===");
            
            return ResponseEntity.ok(Map.of(
                "total", todosLosPedidos.size(),
                "pedidos", todosLosPedidos
            ));
        } catch (Exception e) {
            System.err.println("ERROR al obtener todos los pedidos: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Actualiza el estado de un pedido
     */
    @PutMapping("/{pedidoId}/estado")
    public ResponseEntity<?> actualizarEstadoPedido(
            @PathVariable Long empresaId,
            @PathVariable Long pedidoId,
            @RequestBody Map<String, String> request) {
        try {
            System.out.println("=== DEBUG ACTUALIZAR ESTADO PEDIDO ===");
            System.out.println("EmpresaId: " + empresaId);
            System.out.println("PedidoId: " + pedidoId);
            System.out.println("Nuevo estado: " + request.get("estado"));
            
            String nuevoEstado = request.get("estado");
            if (nuevoEstado == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "El estado es requerido"));
            }
            
            PedidoDTO pedidoActualizado = pedidoService.actualizarEstadoPedido(empresaId, pedidoId, nuevoEstado);
            
            // Enviar notificación si el pedido fue cancelado
            if ("CANCELADO".equals(nuevoEstado)) {
                try {
                    var empresa = empresaService.obtenerPorId(empresaId);
                    if (empresa.isPresent()) {
                        emailService.enviarNotificacionPedidoCancelado(
                            empresa.get().getEmail(),
                            empresa.get().getNombre(),
                            pedidoActualizado.getNumeroPedido(),
                            pedidoActualizado.getClienteNombre(),
                            pedidoActualizado.getClienteEmail(),
                            pedidoActualizado.getTotal()
                        );
                    }
                } catch (Exception e) {
                    System.err.println("Error enviando notificación de pedido cancelado: " + e.getMessage());
                    // No lanzar excepción para no fallar la actualización del estado
                }
            }
            
            System.out.println("Estado actualizado exitosamente a: " + pedidoActualizado.getEstado());
            System.out.println("=== FIN DEBUG ACTUALIZAR ESTADO PEDIDO ===");
            
            return ResponseEntity.ok(Map.of(
                "data", pedidoActualizado,
                "mensaje", "Estado del pedido actualizado exitosamente"
            ));
        } catch (RuntimeException e) {
            System.err.println("Error al actualizar estado: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            System.err.println("Error interno al actualizar estado: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", "Error interno del servidor: " + e.getMessage()));
        }
    }

    /**
     * Obtiene estadísticas generales de pedidos
     */
    @GetMapping("/estadisticas")
    public ResponseEntity<?> obtenerEstadisticasPedidos(@PathVariable Long empresaId) {
        try {
            System.out.println("=== DEBUG CONTROLADOR ESTADISTICAS PEDIDOS ===");
            System.out.println("EmpresaId recibido: " + empresaId);
            
            PedidoService.PedidoEstadisticas estadisticas = pedidoService.obtenerEstadisticasPedidos(empresaId);
            
            Map<String, Object> data = new HashMap<>();
            data.put("totalPedidos", estadisticas.getTotalPedidos());
            data.put("totalTransacciones", estadisticas.getTotalTransacciones());
            data.put("totalProductos", estadisticas.getTotalProductos());
            data.put("cantidadPedidos", estadisticas.getCantidadPedidos());
            
            System.out.println("Respuesta generada:");
            System.out.println("  - totalPedidos: " + estadisticas.getTotalPedidos());
            System.out.println("  - totalTransacciones: " + estadisticas.getTotalTransacciones());
            System.out.println("  - totalProductos: " + estadisticas.getTotalProductos());
            System.out.println("  - cantidadPedidos: " + estadisticas.getCantidadPedidos());
            System.out.println("=== FIN DEBUG CONTROLADOR ESTADISTICAS PEDIDOS ===");
            
            return ResponseEntity.ok(new ApiResponse<>(true, "Estadísticas obtenidas correctamente", data));
        } catch (Exception e) {
            System.err.println("=== ERROR EN ESTADISTICAS PEDIDOS ===");
            System.err.println("Error: " + e.getMessage());
            e.printStackTrace();
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error al obtener estadísticas: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Obtiene estadísticas de pedidos por rango de fechas
     */
    @GetMapping("/estadisticas/por-fecha")
    public ResponseEntity<?> obtenerEstadisticasPorFecha(
            @PathVariable Long empresaId,
            @RequestParam String fechaInicio,
            @RequestParam String fechaFin) {
        try {
            LocalDateTime inicio = LocalDateTime.parse(fechaInicio);
            LocalDateTime fin = LocalDateTime.parse(fechaFin);
            
            PedidoService.PedidoEstadisticas estadisticas = pedidoService.obtenerEstadisticasPedidosPorFecha(empresaId, inicio, fin);
            
            Map<String, Object> response = new HashMap<>();
            response.put("totalPedidos", estadisticas.getTotalPedidos());
            response.put("totalTransacciones", estadisticas.getTotalTransacciones());
            response.put("totalProductos", estadisticas.getTotalProductos());
            response.put("cantidadPedidos", estadisticas.getCantidadPedidos());
            response.put("fechaInicio", inicio);
            response.put("fechaFin", fin);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error al obtener estadísticas por fecha: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Obtiene estadísticas diarias de pedidos
     */
    @GetMapping("/estadisticas/diarias")
    public ResponseEntity<?> obtenerEstadisticasDiarias(
            @PathVariable Long empresaId,
            @RequestParam String fecha) {
        try {
            LocalDateTime fechaConsulta = LocalDateTime.parse(fecha);
            PedidoService.PedidoEstadisticas estadisticas = pedidoService.obtenerEstadisticasDiarias(empresaId, fechaConsulta);
            
            Map<String, Object> response = new HashMap<>();
            response.put("totalPedidos", estadisticas.getTotalPedidos());
            response.put("totalTransacciones", estadisticas.getTotalTransacciones());
            response.put("totalProductos", estadisticas.getTotalProductos());
            response.put("cantidadPedidos", estadisticas.getCantidadPedidos());
            response.put("fecha", fechaConsulta.toLocalDate());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error al obtener estadísticas diarias: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Obtiene estadísticas mensuales de pedidos
     */
    @GetMapping("/estadisticas/mensuales")
    public ResponseEntity<?> obtenerEstadisticasMensuales(
            @PathVariable Long empresaId,
            @RequestParam int año,
            @RequestParam int mes) {
        try {
            PedidoService.PedidoEstadisticas estadisticas = pedidoService.obtenerEstadisticasMensuales(empresaId, año, mes);
            
            Map<String, Object> response = new HashMap<>();
            response.put("totalPedidos", estadisticas.getTotalPedidos());
            response.put("totalTransacciones", estadisticas.getTotalTransacciones());
            response.put("totalProductos", estadisticas.getTotalProductos());
            response.put("cantidadPedidos", estadisticas.getCantidadPedidos());
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
     * Obtiene estadísticas anuales de pedidos
     */
    @GetMapping("/estadisticas/anuales")
    public ResponseEntity<?> obtenerEstadisticasAnuales(
            @PathVariable Long empresaId,
            @RequestParam int año) {
        try {
            PedidoService.PedidoEstadisticas estadisticas = pedidoService.obtenerEstadisticasAnuales(empresaId, año);
            
            Map<String, Object> response = new HashMap<>();
            response.put("totalPedidos", estadisticas.getTotalPedidos());
            response.put("totalTransacciones", estadisticas.getTotalTransacciones());
            response.put("totalProductos", estadisticas.getTotalProductos());
            response.put("cantidadPedidos", estadisticas.getCantidadPedidos());
            response.put("año", año);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Error al obtener estadísticas anuales: " + e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    /**
     * Endpoint de prueba para verificar que el controlador funciona
     */
    @GetMapping("/test-estadisticas")
    public ResponseEntity<?> testEstadisticas(@PathVariable Long empresaId) {
        Map<String, Object> response = new HashMap<>();
        response.put("mensaje", "Controlador de estadísticas de pedidos funcionando correctamente");
        response.put("empresaId", empresaId);
        response.put("timestamp", LocalDateTime.now());
        return ResponseEntity.ok(response);
    }
}
