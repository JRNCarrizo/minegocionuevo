package com.minegocio.backend.controladores;

import com.minegocio.backend.dto.RemitoIngresoDTO;
import com.minegocio.backend.servicios.RemitoIngresoService;
import com.minegocio.backend.seguridad.UsuarioPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/remitos-ingreso")
@CrossOrigin(origins = "*")
public class RemitoIngresoController {
    
    @Autowired
    private RemitoIngresoService remitoIngresoService;
    
    // Obtener todos los remitos de la empresa del usuario autenticado
    @GetMapping
    public ResponseEntity<?> obtenerRemitos(Authentication authentication) {
        try {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long empresaId = usuarioPrincipal.getEmpresaId();
            System.out.println("DEBUG: Obteniendo remitos para empresa ID: " + empresaId);
            List<RemitoIngresoDTO> remitos = remitoIngresoService.obtenerRemitosPorEmpresa(empresaId);
            System.out.println("DEBUG: Remitos encontrados: " + remitos.size());
            return ResponseEntity.ok(java.util.Map.of("data", remitos));
        } catch (Exception e) {
            System.err.println("ERROR en obtenerRemitos: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Obtener un remito específico por ID
    @GetMapping("/{id}")
    public ResponseEntity<RemitoIngresoDTO> obtenerRemito(@PathVariable Long id, Authentication authentication) {
        try {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long empresaId = usuarioPrincipal.getEmpresaId();
            return remitoIngresoService.obtenerRemitoPorId(id, empresaId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Crear un nuevo remito
    @PostMapping
    public ResponseEntity<?> crearRemito(@RequestBody RemitoIngresoDTO remitoDTO, Authentication authentication) {
        try {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long empresaId = usuarioPrincipal.getEmpresaId();
            System.out.println("DEBUG: Creando remito para empresa ID: " + empresaId);
            System.out.println("DEBUG: Datos del remito: " + remitoDTO);
            System.out.println("DEBUG: Número de remito: " + remitoDTO.getNumeroRemito());
            System.out.println("DEBUG: Fecha remito: " + remitoDTO.getFechaRemito());
            System.out.println("DEBUG: Total productos: " + remitoDTO.getTotalProductos());
            System.out.println("DEBUG: Detalles: " + (remitoDTO.getDetalles() != null ? remitoDTO.getDetalles().size() : "null"));
            if (remitoDTO.getDetalles() != null) {
                for (int i = 0; i < remitoDTO.getDetalles().size(); i++) {
                    var detalle = remitoDTO.getDetalles().get(i);
                    System.out.println("DEBUG: Detalle " + i + " - ProductoId: " + detalle.getProductoId() + 
                                     ", Descripción: " + detalle.getDescripcion() + 
                                     ", Cantidad: " + detalle.getCantidad());
                }
            }
            remitoDTO.setEmpresaId(empresaId);
            remitoDTO.setUsuarioId(usuarioPrincipal.getId());
            
            RemitoIngresoDTO remitoCreado = remitoIngresoService.crearRemito(remitoDTO);
            System.out.println("DEBUG: Remito creado exitosamente con ID: " + remitoCreado.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(java.util.Map.of("data", remitoCreado));
        } catch (RuntimeException e) {
            System.err.println("ERROR RuntimeException en crearRemito: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest()
                .body(java.util.Map.of("error", e.getMessage()));
        } catch (Exception e) {
            System.err.println("ERROR Exception en crearRemito: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(java.util.Map.of("error", "Error interno del servidor: " + e.getMessage()));
        }
    }
    
    // Eliminar un remito
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminarRemito(@PathVariable Long id, Authentication authentication) {
        try {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long empresaId = usuarioPrincipal.getEmpresaId();
            remitoIngresoService.eliminarRemito(id, empresaId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Buscar remitos por fecha
    @GetMapping("/fecha/{fecha}")
    public ResponseEntity<List<RemitoIngresoDTO>> buscarPorFecha(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fecha,
            Authentication authentication) {
        try {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long empresaId = usuarioPrincipal.getEmpresaId();
            List<RemitoIngresoDTO> remitos = remitoIngresoService.buscarPorFecha(fecha, empresaId);
            return ResponseEntity.ok(remitos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Buscar remitos por rango de fechas
    @GetMapping("/rango-fechas")
    public ResponseEntity<List<RemitoIngresoDTO>> buscarPorRangoFechas(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaFin,
            Authentication authentication) {
        try {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long empresaId = usuarioPrincipal.getEmpresaId();
            List<RemitoIngresoDTO> remitos = remitoIngresoService.buscarPorRangoFechas(fechaInicio, fechaFin, empresaId);
            return ResponseEntity.ok(remitos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Buscar remitos por texto
    @GetMapping("/buscar")
    public ResponseEntity<List<RemitoIngresoDTO>> buscarPorTexto(
            @RequestParam String busqueda,
            Authentication authentication) {
        try {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long empresaId = usuarioPrincipal.getEmpresaId();
            List<RemitoIngresoDTO> remitos = remitoIngresoService.buscarPorTexto(busqueda, empresaId);
            return ResponseEntity.ok(remitos);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Exportar remito a Excel
    @GetMapping("/{id}/exportar")
    public ResponseEntity<byte[]> exportarRemito(@PathVariable Long id, Authentication authentication) {
        try {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long empresaId = usuarioPrincipal.getEmpresaId();
            byte[] excelContent = remitoIngresoService.exportarRemitoAExcel(id, empresaId);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
            headers.setContentDispositionFormData("attachment", "remito_ingreso.xlsx");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(excelContent);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
