package com.minegocio.backend.controladores;

import com.minegocio.backend.dto.InventarioFisicoDTO;
import com.minegocio.backend.servicios.InventarioFisicoService;
import com.minegocio.backend.seguridad.UsuarioPrincipal;
import com.minegocio.backend.utils.ApiResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/admin/inventario-fisico")
@CrossOrigin(origins = "*")
public class InventarioFisicoController {

    @Autowired
    private InventarioFisicoService inventarioFisicoService;

    /**
     * Obtener historial de inventarios físicos
     */
    @GetMapping("/historial")
    public ResponseEntity<ApiResponse<Page<InventarioFisicoDTO>>> obtenerHistorial(
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamano) {
        
        try {
            Long empresaId = obtenerEmpresaIdDelUsuarioAutenticado();
            ApiResponse<Page<InventarioFisicoDTO>> response = inventarioFisicoService
                    .obtenerHistorialPorEmpresa(empresaId, pagina, tamano);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ApiResponse<>(false, "Error al obtener el historial: " + e.getMessage(), null));
        }
    }

    /**
     * Obtener inventario físico por ID
     */
    @GetMapping("/{inventarioId}")
    public ResponseEntity<ApiResponse<InventarioFisicoDTO>> obtenerInventario(@PathVariable Long inventarioId) {
        try {
            Long empresaId = obtenerEmpresaIdDelUsuarioAutenticado();
            ApiResponse<InventarioFisicoDTO> response = inventarioFisicoService
                    .obtenerInventarioPorId(inventarioId, empresaId);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ApiResponse<>(false, "Error al obtener el inventario: " + e.getMessage(), null));
        }
    }

    /**
     * Guardar inventario físico
     */
    @PostMapping("/guardar")
    public ResponseEntity<ApiResponse<InventarioFisicoDTO>> guardarInventario(
            @Valid @RequestBody InventarioFisicoDTO inventarioDTO) {
        
        try {
            Long empresaId = obtenerEmpresaIdDelUsuarioAutenticado();
            Long usuarioId = obtenerUsuarioIdDelUsuarioAutenticado();
            
            ApiResponse<InventarioFisicoDTO> response = inventarioFisicoService
                    .guardarInventario(inventarioDTO, empresaId, usuarioId);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ApiResponse<>(false, "Error al guardar el inventario: " + e.getMessage(), null));
        }
    }

    /**
     * Eliminar inventario físico
     */
    @DeleteMapping("/{inventarioId}")
    public ResponseEntity<ApiResponse<Void>> eliminarInventario(@PathVariable Long inventarioId) {
        try {
            Long empresaId = obtenerEmpresaIdDelUsuarioAutenticado();
            ApiResponse<Void> response = inventarioFisicoService
                    .eliminarInventario(inventarioId, empresaId);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ApiResponse<>(false, "Error al eliminar el inventario: " + e.getMessage(), null));
        }
    }

    /**
     * Obtener estadísticas de inventarios físicos
     */
    @GetMapping("/estadisticas")
    public ResponseEntity<ApiResponse<Object>> obtenerEstadisticas() {
        try {
            Long empresaId = obtenerEmpresaIdDelUsuarioAutenticado();
            ApiResponse<Object> response = inventarioFisicoService
                    .obtenerEstadisticas(empresaId);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ApiResponse<>(false, "Error al obtener estadísticas: " + e.getMessage(), null));
        }
    }

    // Métodos auxiliares
    private Long obtenerEmpresaIdDelUsuarioAutenticado() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication.getPrincipal() instanceof UsuarioPrincipal) {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            return usuarioPrincipal.getEmpresaId();
        }
        throw new RuntimeException("No se pudo obtener la información de la empresa del usuario");
    }

    private Long obtenerUsuarioIdDelUsuarioAutenticado() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication.getPrincipal() instanceof UsuarioPrincipal) {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            return usuarioPrincipal.getId();
        }
        throw new RuntimeException("No se pudo obtener la información del usuario");
    }
} 