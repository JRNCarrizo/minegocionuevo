package com.minegocio.backend.controladores;

import com.minegocio.backend.entidades.*;
import com.minegocio.backend.servicios.InventarioPorSectorService;
import com.minegocio.backend.servicios.CalculadoraService;
import com.minegocio.backend.seguridad.UsuarioPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/empresas/{empresaId}/inventario-por-sector")
@CrossOrigin(origins = "*")
public class InventarioPorSectorController {

    @Autowired
    private InventarioPorSectorService inventarioPorSectorService;

    @Autowired
    private CalculadoraService calculadoraService;

    /**
     * Crear un nuevo inventario por sector
     */
    @PostMapping
    public ResponseEntity<?> crearInventarioPorSector(
            @PathVariable Long empresaId,
            @RequestBody Map<String, Long> request,
            Authentication authentication) {
        try {
            System.out.println("🔍 Creando inventario por sector para empresa: " + empresaId);
            
            Long sectorId = request.get("sectorId");
            if (sectorId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "El ID del sector es obligatorio"));
            }
            
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long usuarioAdminId = usuarioPrincipal.getId();
            
            InventarioPorSector inventario = inventarioPorSectorService.crearInventarioPorSector(empresaId, sectorId, usuarioAdminId);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Inventario por sector creado exitosamente",
                "inventario", inventario
            ));
        } catch (Exception e) {
            System.err.println("❌ Error creando inventario por sector: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Obtener inventarios por sector por empresa
     */
    @GetMapping
    public ResponseEntity<?> obtenerInventariosPorSector(@PathVariable Long empresaId) {
        try {
            List<InventarioPorSector> inventarios = inventarioPorSectorService.obtenerInventariosPorSectorPorEmpresa(empresaId);
            return ResponseEntity.ok(inventarios);
        } catch (Exception e) {
            System.err.println("❌ Error obteniendo inventarios por sector: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Obtener inventario por sector por ID
     */
    @GetMapping("/{inventarioId}")
    public ResponseEntity<?> obtenerInventarioPorSector(
            @PathVariable Long empresaId,
            @PathVariable Long inventarioId) {
        try {
            Optional<InventarioPorSector> inventario = inventarioPorSectorService.obtenerInventarioPorSector(inventarioId);
            
            if (inventario.isPresent()) {
                return ResponseEntity.ok(inventario.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("❌ Error obteniendo inventario por sector: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Obtener inventarios asignados a un usuario
     */
    @GetMapping("/asignados")
    public ResponseEntity<?> obtenerInventariosAsignados(Authentication authentication) {
        try {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long usuarioId = usuarioPrincipal.getId();
            
            List<InventarioPorSector> inventarios = inventarioPorSectorService.obtenerInventariosAsignadosAUsuario(usuarioId);
            return ResponseEntity.ok(inventarios);
        } catch (Exception e) {
            System.err.println("❌ Error obteniendo inventarios asignados: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Asignar usuarios a un inventario por sector
     */
    @PostMapping("/{inventarioId}/asignar-usuarios")
    public ResponseEntity<?> asignarUsuariosAInventario(
            @PathVariable Long empresaId,
            @PathVariable Long inventarioId,
            @RequestBody Map<String, Long> request) {
        try {
            Long usuario1Id = request.get("usuario1Id");
            Long usuario2Id = request.get("usuario2Id");
            
            if (usuario1Id == null || usuario2Id == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Los IDs de usuario son obligatorios"));
            }
            
            InventarioPorSector inventario = inventarioPorSectorService.asignarUsuariosAInventario(inventarioId, usuario1Id, usuario2Id);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Usuarios asignados exitosamente",
                "inventario", inventario
            ));
        } catch (Exception e) {
            System.err.println("❌ Error asignando usuarios: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Iniciar conteo de un inventario por sector
     */
    @PostMapping("/{inventarioId}/iniciar")
    public ResponseEntity<?> iniciarConteoInventario(
            @PathVariable Long empresaId,
            @PathVariable Long inventarioId,
            Authentication authentication) {
        try {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long usuarioId = usuarioPrincipal.getId();
            
            InventarioPorSector inventario = inventarioPorSectorService.iniciarConteoInventario(inventarioId, usuarioId);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Conteo de inventario iniciado exitosamente",
                "inventario", inventario
            ));
        } catch (Exception e) {
            System.err.println("❌ Error iniciando conteo de inventario: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Agregar producto al conteo
     */
    @PostMapping("/{inventarioId}/agregar-producto")
    public ResponseEntity<?> agregarProductoAlConteo(
            @PathVariable Long empresaId,
            @PathVariable Long inventarioId,
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        try {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long usuarioId = usuarioPrincipal.getId();
            
            Long productoId = Long.valueOf(request.get("productoId").toString());
            Integer cantidad = Integer.valueOf(request.get("cantidad").toString());
            String formulaCalculo = (String) request.get("formulaCalculo");
            
            // Si se proporciona una fórmula, evaluarla
            if (formulaCalculo != null && !formulaCalculo.trim().isEmpty()) {
                CalculadoraService.ResultadoCalculo resultado = calculadoraService.evaluarExpresion(formulaCalculo);
                if (resultado.isExito()) {
                    cantidad = resultado.getResultado();
                } else {
                    return ResponseEntity.badRequest().body(Map.of("error", resultado.getError()));
                }
            }
            
            DetalleConteo detalle = inventarioPorSectorService.agregarProductoAlConteo(
                inventarioId, productoId, cantidad, formulaCalculo, usuarioId);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Producto agregado al conteo exitosamente",
                "detalle", detalle
            ));
        } catch (Exception e) {
            System.err.println("❌ Error agregando producto al conteo: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Finalizar conteo de un inventario por sector
     */
    @PostMapping("/{inventarioId}/finalizar")
    public ResponseEntity<?> finalizarConteoInventario(
            @PathVariable Long empresaId,
            @PathVariable Long inventarioId,
            Authentication authentication) {
        try {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long usuarioId = usuarioPrincipal.getId();
            
            InventarioPorSector inventario = inventarioPorSectorService.finalizarConteoInventario(inventarioId, usuarioId);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Conteo de inventario finalizado exitosamente",
                "inventario", inventario
            ));
        } catch (Exception e) {
            System.err.println("❌ Error finalizando conteo de inventario: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Evaluar expresión matemática
     */
    @PostMapping("/evaluar-expresion")
    public ResponseEntity<?> evaluarExpresion(@RequestBody Map<String, String> request) {
        try {
            String expresion = request.get("expresion");
            
            if (expresion == null || expresion.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "La expresión es obligatoria"));
            }
            
            CalculadoraService.ResultadoCalculo resultado = calculadoraService.evaluarExpresion(expresion);
            
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            System.err.println("❌ Error evaluando expresión: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
