package com.minegocio.backend.controladores;

import com.minegocio.backend.dto.ClienteDTO;
import com.minegocio.backend.servicios.ClienteService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * Controlador REST para la gestión de clientes
 */
@RestController
@RequestMapping("/api/empresas/{empresaId}/clientes")
@CrossOrigin(origins = "*", maxAge = 3600)
public class ClienteController {

    @Autowired
    private ClienteService clienteService;

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
            Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                    Sort.by(sortBy).descending() : 
                    Sort.by(sortBy).ascending();
            
            Pageable pageable = PageRequest.of(page, size, sort);
            Page<ClienteDTO> clientes = clienteService.obtenerClientesPaginados(empresaId, pageable);
            
            return ResponseEntity.ok(clientes);
        } catch (Exception e) {
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
    public ResponseEntity<ClienteDTO> crearCliente(
            @PathVariable Long empresaId,
            @Valid @RequestBody ClienteDTO clienteDTO) {
        try {
            ClienteDTO nuevoCliente = clienteService.crearCliente(empresaId, clienteDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(nuevoCliente);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("email")) {
                return ResponseEntity.status(HttpStatus.CONFLICT).build();
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
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
}
