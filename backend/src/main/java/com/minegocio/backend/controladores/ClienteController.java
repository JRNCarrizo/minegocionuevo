package com.minegocio.backend.controladores;

import com.minegocio.backend.dto.ClienteDTO;
import com.minegocio.backend.servicios.ClienteService;
import com.minegocio.backend.servicios.LimiteService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;

import java.util.List;
import java.util.Optional;
import com.minegocio.backend.dto.PedidoDTO;

/**
 * Controlador REST para la gestión de clientes
 */
@RestController
@RequestMapping("/api/empresas/{empresaId}/clientes")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ClienteController {

    @Autowired
    private ClienteService clienteService;

    @Autowired
    private LimiteService limiteService;

    /**
     * Obtiene todos los clientes de una empresa
     */
    @GetMapping
    public ResponseEntity<List<ClienteDTO>> obtenerClientes(@PathVariable Long empresaId) {
        try {
            List<ClienteDTO> clientes = clienteService.obtenerTodosLosClientes(empresaId);
            return ResponseEntity.ok(clientes);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obtiene clientes paginados
     */
    @GetMapping("/paginado")
    public ResponseEntity<Page<ClienteDTO>> obtenerClientesPaginados(
            @PathVariable Long empresaId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "nombre") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        try {
            System.out.println("=== DEBUG OBTENER CLIENTES PAGINADOS ===");
            System.out.println("EmpresaId: " + empresaId);
            System.out.println("Page: " + page + ", Size: " + size);
            
            Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                    Sort.by(sortBy).descending() : 
                    Sort.by(sortBy).ascending();
            
            Pageable pageable = PageRequest.of(page, size, sort);
            Page<ClienteDTO> clientes = clienteService.obtenerClientesPaginados(empresaId, pageable);
            
            System.out.println("Clientes encontrados: " + clientes.getTotalElements());
            System.out.println("Estadísticas de clientes:");
            clientes.getContent().forEach(cliente -> {
                System.out.println("  - " + cliente.getNombre() + ": " + 
                    cliente.getTotalPedidos() + " pedidos, $" + 
                    (cliente.getTotalCompras() != null ? cliente.getTotalCompras() : 0.0));
            });
            
            return ResponseEntity.ok(clientes);
        } catch (Exception e) {
            System.err.println("Error al obtener clientes paginados: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Busca clientes por término
     */
    @GetMapping("/buscar")
    public ResponseEntity<List<ClienteDTO>> buscarClientes(
            @PathVariable Long empresaId,
            @RequestParam String termino) {
        try {
            List<ClienteDTO> clientes = clienteService.buscarClientes(empresaId, termino);
            return ResponseEntity.ok(clientes);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obtiene un cliente por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ClienteDTO> obtenerCliente(
            @PathVariable Long empresaId,
            @PathVariable Long id) {
        try {
            Optional<ClienteDTO> cliente = clienteService.obtenerClientePorId(empresaId, id);
            
            if (cliente.isPresent()) {
                return ResponseEntity.ok(cliente.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obtiene un cliente por email
     */
    @GetMapping("/email/{email}")
    public ResponseEntity<ClienteDTO> obtenerClientePorEmail(
            @PathVariable Long empresaId,
            @PathVariable String email) {
        try {
            Optional<ClienteDTO> cliente = clienteService.obtenerClientePorEmail(empresaId, email);
            
            if (cliente.isPresent()) {
                return ResponseEntity.ok(cliente.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Crea un nuevo cliente
     */
    @PostMapping
    public ResponseEntity<?> crearCliente(
            @PathVariable Long empresaId,
            @Valid @RequestBody ClienteDTO clienteDTO) {
        try {
            // Verificar límites de suscripción antes de crear el cliente
            if (!limiteService.puedeCrearCliente(empresaId)) {
                var error = java.util.Map.of(
                    "error", "Límite de clientes alcanzado",
                    "mensaje", "Has alcanzado el límite de clientes permitidos en tu plan de suscripción. Actualiza tu plan para crear más clientes."
                );
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
            }
            
            ClienteDTO nuevoCliente = clienteService.crearCliente(empresaId, clienteDTO);
            
            var respuesta = java.util.Map.of(
                "data", nuevoCliente,
                "mensaje", "Cliente creado exitosamente"
            );
            
            return ResponseEntity.status(HttpStatus.CREATED).body(respuesta);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("email")) {
                var error = java.util.Map.of(
                    "error", "Email ya existe",
                    "mensaje", "Ya existe un cliente con ese email"
                );
                return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
            }
            var error = java.util.Map.of(
                "error", "Error de validación",
                "mensaje", e.getMessage()
            );
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            var error = java.util.Map.of(
                "error", "Error interno del servidor",
                "mensaje", e.getMessage()
            );
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    /**
     * Actualiza un cliente existente
     */
    @PutMapping("/{id}")
    public ResponseEntity<ClienteDTO> actualizarCliente(
            @PathVariable Long empresaId,
            @PathVariable Long id,
            @Valid @RequestBody ClienteDTO clienteDTO) {
        try {
            ClienteDTO clienteActualizado = clienteService.actualizarCliente(empresaId, id, clienteDTO);
            return ResponseEntity.ok(clienteActualizado);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("email")) {
                return ResponseEntity.status(HttpStatus.CONFLICT).build();
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Elimina un cliente (eliminación lógica)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarCliente(
            @PathVariable Long empresaId,
            @PathVariable Long id) {
        try {
            clienteService.eliminarCliente(empresaId, id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Obtiene estadísticas de clientes
     */
    @GetMapping("/estadisticas")
    public ResponseEntity<?> obtenerEstadisticas(@PathVariable Long empresaId) {
        try {
            long totalClientes = clienteService.contarClientesActivos(empresaId);
            
            return ResponseEntity.ok(java.util.Map.of("totalClientes", totalClientes));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * Obtiene un cliente con su historial completo de pedidos
     */
    @GetMapping("/{id}/historial")
    public ResponseEntity<?> obtenerClienteConHistorial(
            @PathVariable Long empresaId,
            @PathVariable Long id,
            HttpServletRequest request) {
        try {
            System.out.println("=== DEBUG OBTENER CLIENTE CON HISTORIAL ===");
            System.out.println("EmpresaId: " + empresaId);
            System.out.println("ClienteId: " + id);
            System.out.println("Request URI: " + request.getRequestURI());
            System.out.println("Authorization header: " + (request.getHeader("Authorization") != null ? "Presente" : "Ausente"));
            
            Optional<ClienteDTO> cliente = clienteService.obtenerClienteConHistorial(empresaId, id);
            
            if (cliente.isPresent()) {
                System.out.println("Cliente encontrado con estadísticas: " + cliente.get());
                System.out.println("Total pedidos: " + cliente.get().getTotalPedidos());
                System.out.println("Total compras: " + cliente.get().getTotalCompras());
                
                var respuesta = java.util.Map.of(
                    "data", cliente.get()
                );
                
                return ResponseEntity.ok(respuesta);
            } else {
                System.out.println("Cliente no encontrado para empresaId: " + empresaId + ", id: " + id);
                
                var error = java.util.Map.of(
                    "error", "Cliente no encontrado"
                );
                
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
            }
        } catch (Exception e) {
            System.err.println("Error al obtener cliente con historial: " + e.getMessage());
            e.printStackTrace();
            
            var error = java.util.Map.of(
                "error", "Error interno del servidor: " + e.getMessage()
            );
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * Obtiene el historial de pedidos de un cliente
     */
    @GetMapping("/{id}/pedidos")
    public ResponseEntity<?> obtenerHistorialPedidosCliente(
            @PathVariable Long empresaId,
            @PathVariable Long id,
            HttpServletRequest request) {
        try {
            System.out.println("=== DEBUG OBTENER HISTORIAL PEDIDOS CLIENTE ===");
            System.out.println("EmpresaId: " + empresaId);
            System.out.println("ClienteId: " + id);
            System.out.println("Request URI: " + request.getRequestURI());
            System.out.println("Authorization header: " + (request.getHeader("Authorization") != null ? "Presente" : "Ausente"));
            
            List<PedidoDTO> pedidos = clienteService.obtenerHistorialPedidosCliente(empresaId, id);
            
            System.out.println("Pedidos encontrados: " + pedidos.size());
            
            var respuesta = java.util.Map.of(
                "data", pedidos,
                "totalPedidos", pedidos.size()
            );
            
            return ResponseEntity.ok(respuesta);
        } catch (RuntimeException e) {
            System.err.println("Error al obtener historial de pedidos - no encontrado: " + e.getMessage());
            
            var error = java.util.Map.of(
                "error", e.getMessage()
            );
            
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            System.err.println("Error interno al obtener historial de pedidos: " + e.getMessage());
            e.printStackTrace();
            
            var error = java.util.Map.of(
                "error", "Error interno del servidor: " + e.getMessage()
            );
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
    
    /**
     * Endpoint de debug para verificar autenticación
     */
    @GetMapping("/debug/auth")
    public ResponseEntity<?> debugAuth(HttpServletRequest request) {
        System.out.println("=== DEBUG AUTH ENDPOINT ===");
        System.out.println("Request URI: " + request.getRequestURI());
        System.out.println("Authorization header: " + (request.getHeader("Authorization") != null ? "Presente" : "Ausente"));
        
        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        System.out.println("Authentication: " + (auth != null ? auth.getName() : "null"));
        System.out.println("Authorities: " + (auth != null ? auth.getAuthorities() : "null"));
        
        return ResponseEntity.ok(java.util.Map.of(
            "message", "Debug endpoint accesible",
            "authenticated", auth != null && auth.isAuthenticated(),
            "user", auth != null ? auth.getName() : "null",
            "authorities", auth != null ? auth.getAuthorities().toString() : "null"
        ));
    }
    
    /**
     * Endpoint público de debug (sin autenticación)
     */
    @GetMapping("/debug/public")
    public ResponseEntity<?> debugPublic(HttpServletRequest request) {
        System.out.println("=== DEBUG PUBLIC ENDPOINT ===");
        System.out.println("Request URI: " + request.getRequestURI());
        System.out.println("Authorization header: " + (request.getHeader("Authorization") != null ? "Presente" : "Ausente"));
        
        return ResponseEntity.ok(java.util.Map.of(
            "message", "Public debug endpoint accesible",
            "timestamp", java.time.LocalDateTime.now().toString()
        ));
    }
}
