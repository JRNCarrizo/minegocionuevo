package com.minegocio.backend.controladores;

import com.minegocio.backend.dto.PedidoDTO;
import com.minegocio.backend.servicios.PedidoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/empresas/{empresaId}/pedidos")
@CrossOrigin(origins = "*", maxAge = 3600)
public class PedidoController {

    @Autowired
    private PedidoService pedidoService;

    @PostMapping
    public ResponseEntity<?> crearPedido(@PathVariable Long empresaId, @RequestBody PedidoDTO pedidoDTO) {
        try {
            PedidoDTO nuevoPedido = pedidoService.crearPedido(empresaId, pedidoDTO);
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
}
