package com.minegocio.backend.controladores;

import com.minegocio.backend.dto.TransportistaDTO;
import com.minegocio.backend.dto.VehiculoDTO;
import com.minegocio.backend.seguridad.UsuarioPrincipal;
import com.minegocio.backend.servicios.TransportistaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/empresas/{empresaId}/transportistas")
@CrossOrigin(origins = "*")
public class TransportistaController {

    @Autowired
    private TransportistaService transportistaService;

    // Obtener todos los transportistas de una empresa
    @GetMapping
    public ResponseEntity<?> obtenerTransportistas(@PathVariable Long empresaId, Authentication authentication) {
        try {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            
            // Verificar que el usuario pertenece a la empresa
            if (!usuarioPrincipal.getEmpresaId().equals(empresaId)) {
                return ResponseEntity.status(403).body(Map.of("error", "No autorizado para acceder a esta empresa"));
            }

            List<TransportistaDTO> transportistas = transportistaService.obtenerTransportistasPorEmpresa(empresaId);
            return ResponseEntity.ok(Map.of("data", transportistas));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Obtener transportistas activos de una empresa
    @GetMapping("/activos")
    public ResponseEntity<?> obtenerTransportistasActivos(@PathVariable Long empresaId, Authentication authentication) {
        try {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            
            // Verificar que el usuario pertenece a la empresa
            if (!usuarioPrincipal.getEmpresaId().equals(empresaId)) {
                return ResponseEntity.status(403).body(Map.of("error", "No autorizado para acceder a esta empresa"));
            }

            List<TransportistaDTO> transportistas = transportistaService.obtenerTransportistasActivosPorEmpresa(empresaId);
            return ResponseEntity.ok(Map.of("data", transportistas));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Buscar transportistas
    @GetMapping("/buscar")
    public ResponseEntity<?> buscarTransportistas(@PathVariable Long empresaId, 
                                                 @RequestParam String busqueda, 
                                                 Authentication authentication) {
        try {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            
            // Verificar que el usuario pertenece a la empresa
            if (!usuarioPrincipal.getEmpresaId().equals(empresaId)) {
                return ResponseEntity.status(403).body(Map.of("error", "No autorizado para acceder a esta empresa"));
            }

            List<TransportistaDTO> transportistas = transportistaService.buscarTransportistas(empresaId, busqueda);
            return ResponseEntity.ok(Map.of("data", transportistas));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Obtener transportista por ID
    @GetMapping("/{transportistaId}")
    public ResponseEntity<?> obtenerTransportista(@PathVariable Long empresaId, 
                                                 @PathVariable Long transportistaId, 
                                                 Authentication authentication) {
        try {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            
            // Verificar que el usuario pertenece a la empresa
            if (!usuarioPrincipal.getEmpresaId().equals(empresaId)) {
                return ResponseEntity.status(403).body(Map.of("error", "No autorizado para acceder a esta empresa"));
            }

            TransportistaDTO transportista = transportistaService.obtenerTransportistaPorId(transportistaId, empresaId);
            return ResponseEntity.ok(Map.of("data", transportista));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Crear transportista
    @PostMapping
    public ResponseEntity<?> crearTransportista(@PathVariable Long empresaId, 
                                               @RequestBody TransportistaDTO transportistaDTO, 
                                               Authentication authentication) {
        try {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            
            // Verificar que el usuario pertenece a la empresa
            if (!usuarioPrincipal.getEmpresaId().equals(empresaId)) {
                return ResponseEntity.status(403).body(Map.of("error", "No autorizado para acceder a esta empresa"));
            }

            TransportistaDTO transportistaCreado = transportistaService.crearTransportista(transportistaDTO, empresaId);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("data", transportistaCreado));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Actualizar transportista
    @PutMapping("/{transportistaId}")
    public ResponseEntity<?> actualizarTransportista(@PathVariable Long empresaId, 
                                                    @PathVariable Long transportistaId, 
                                                    @RequestBody TransportistaDTO transportistaDTO, 
                                                    Authentication authentication) {
        try {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            
            // Verificar que el usuario pertenece a la empresa
            if (!usuarioPrincipal.getEmpresaId().equals(empresaId)) {
                return ResponseEntity.status(403).body(Map.of("error", "No autorizado para acceder a esta empresa"));
            }

            TransportistaDTO transportistaActualizado = transportistaService.actualizarTransportista(transportistaId, transportistaDTO, empresaId);
            return ResponseEntity.ok(Map.of("data", transportistaActualizado));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Cambiar estado del transportista
    @PatchMapping("/{transportistaId}/estado")
    public ResponseEntity<?> cambiarEstadoTransportista(@PathVariable Long empresaId, 
                                                       @PathVariable Long transportistaId, 
                                                       @RequestBody Map<String, Boolean> request, 
                                                       Authentication authentication) {
        try {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            
            // Verificar que el usuario pertenece a la empresa
            if (!usuarioPrincipal.getEmpresaId().equals(empresaId)) {
                return ResponseEntity.status(403).body(Map.of("error", "No autorizado para acceder a esta empresa"));
            }

            Boolean activo = request.get("activo");
            if (activo == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "El campo 'activo' es requerido"));
            }

            TransportistaDTO transportistaActualizado = transportistaService.cambiarEstadoTransportista(transportistaId, activo, empresaId);
            return ResponseEntity.ok(Map.of("data", transportistaActualizado));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Eliminar transportista
    @DeleteMapping("/{transportistaId}")
    public ResponseEntity<?> eliminarTransportista(@PathVariable Long empresaId, 
                                                  @PathVariable Long transportistaId, 
                                                  Authentication authentication) {
        try {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            
            // Verificar que el usuario pertenece a la empresa
            if (!usuarioPrincipal.getEmpresaId().equals(empresaId)) {
                return ResponseEntity.status(403).body(Map.of("error", "No autorizado para acceder a esta empresa"));
            }

            transportistaService.eliminarTransportista(transportistaId, empresaId);
            return ResponseEntity.ok(Map.of("mensaje", "Transportista eliminado exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Crear vehículo para un transportista
    @PostMapping("/{transportistaId}/vehiculos")
    public ResponseEntity<?> crearVehiculo(@PathVariable Long empresaId, 
                                          @PathVariable Long transportistaId, 
                                          @RequestBody VehiculoDTO vehiculoDTO, 
                                          Authentication authentication) {
        try {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            
            // Verificar que el usuario pertenece a la empresa
            if (!usuarioPrincipal.getEmpresaId().equals(empresaId)) {
                return ResponseEntity.status(403).body(Map.of("error", "No autorizado para acceder a esta empresa"));
            }

            VehiculoDTO vehiculoCreado = transportistaService.crearVehiculo(vehiculoDTO, transportistaId);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("data", vehiculoCreado));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Actualizar vehículo
    @PutMapping("/vehiculos/{vehiculoId}")
    public ResponseEntity<?> actualizarVehiculo(@PathVariable Long empresaId, 
                                               @PathVariable Long vehiculoId, 
                                               @RequestBody VehiculoDTO vehiculoDTO, 
                                               Authentication authentication) {
        try {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            
            // Verificar que el usuario pertenece a la empresa
            if (!usuarioPrincipal.getEmpresaId().equals(empresaId)) {
                return ResponseEntity.status(403).body(Map.of("error", "No autorizado para acceder a esta empresa"));
            }

            VehiculoDTO vehiculoActualizado = transportistaService.actualizarVehiculo(vehiculoId, vehiculoDTO, empresaId);
            return ResponseEntity.ok(Map.of("data", vehiculoActualizado));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Cambiar estado del vehículo
    @PatchMapping("/vehiculos/{vehiculoId}/estado")
    public ResponseEntity<?> cambiarEstadoVehiculo(@PathVariable Long empresaId, 
                                                  @PathVariable Long vehiculoId, 
                                                  @RequestBody Map<String, Boolean> request, 
                                                  Authentication authentication) {
        try {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            
            // Verificar que el usuario pertenece a la empresa
            if (!usuarioPrincipal.getEmpresaId().equals(empresaId)) {
                return ResponseEntity.status(403).body(Map.of("error", "No autorizado para acceder a esta empresa"));
            }

            Boolean activo = request.get("activo");
            if (activo == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "El campo 'activo' es requerido"));
            }

            VehiculoDTO vehiculoActualizado = transportistaService.cambiarEstadoVehiculo(vehiculoId, activo, empresaId);
            return ResponseEntity.ok(Map.of("data", vehiculoActualizado));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // Eliminar vehículo
    @DeleteMapping("/vehiculos/{vehiculoId}")
    public ResponseEntity<?> eliminarVehiculo(@PathVariable Long empresaId, 
                                             @PathVariable Long vehiculoId, 
                                             Authentication authentication) {
        try {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            
            // Verificar que el usuario pertenece a la empresa
            if (!usuarioPrincipal.getEmpresaId().equals(empresaId)) {
                return ResponseEntity.status(403).body(Map.of("error", "No autorizado para acceder a esta empresa"));
            }

            transportistaService.eliminarVehiculo(vehiculoId, empresaId);
            return ResponseEntity.ok(Map.of("mensaje", "Vehículo eliminado exitosamente"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
