package com.minegocio.backend.controladores;

import com.minegocio.backend.entidades.*;
import com.minegocio.backend.dto.InventarioCompletoDTO;
import com.minegocio.backend.dto.ConteoSectorDTO;
import com.minegocio.backend.servicios.InventarioCompletoService;
import com.minegocio.backend.servicios.CalculadoraService;
import com.minegocio.backend.seguridad.UsuarioPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.HashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/empresas/{empresaId}/inventario-completo")
@CrossOrigin(origins = "*")
public class InventarioCompletoController {

    @Autowired
    private InventarioCompletoService inventarioCompletoService;

    @Autowired
    private CalculadoraService calculadoraService;

    @Autowired
    private com.minegocio.backend.repositorios.UsuarioRepository usuarioRepository;

    @Autowired
    private com.minegocio.backend.repositorios.EmpresaRepository empresaRepository;
    
    @Autowired
    private com.minegocio.backend.repositorios.DetalleConteoRepository detalleConteoRepository;


    /**
     * Obtener inventario activo de la empresa
     */
    @GetMapping("/activo")
    @Transactional(readOnly = true)
    public ResponseEntity<?> obtenerInventarioActivo(
            @PathVariable Long empresaId,
            Authentication authentication) {
        try {
            System.out.println("🔍 Obteniendo inventario activo para empresa: " + empresaId);
            
            // Verificar que la empresa existe
            if (!empresaRepository.existsById(empresaId)) {
                System.err.println("❌ Empresa no encontrada: " + empresaId);
                return ResponseEntity.status(404).body(Map.of("error", "Empresa no encontrada"));
            }
            
            Optional<InventarioCompleto> inventario = inventarioCompletoService.obtenerInventarioActivo(empresaId);
            
            if (inventario.isPresent()) {
                System.out.println("🔍 Inventario activo encontrado: " + inventario.get().getId());
                InventarioCompletoDTO inventarioDTO = new InventarioCompletoDTO(inventario.get());
                
                // Actualizar estados por usuario en los conteos de sector
                if (inventarioDTO.getConteosSectores() != null) {
                    for (ConteoSectorDTO conteoSectorDTO : inventarioDTO.getConteosSectores()) {
                        // Obtener el conteo sector original
                        Long conteoSectorId = conteoSectorDTO.getId();
                        Optional<ConteoSector> conteoSectorOpt = inventarioCompletoService.obtenerConteoSector(conteoSectorId);
                        
                        if (conteoSectorOpt.isPresent()) {
                            ConteoSector conteoSector = conteoSectorOpt.get();
                            
                            // Actualizar estados por usuario si hay usuarios asignados
                            if (conteoSector.getUsuarioAsignado1() != null && conteoSector.getUsuarioAsignado2() != null) {
                                String estadoUsuario1 = inventarioCompletoService.determinarEstadoUsuario(conteoSector, conteoSector.getUsuarioAsignado1().getId()).name();
                                String estadoUsuario2 = inventarioCompletoService.determinarEstadoUsuario(conteoSector, conteoSector.getUsuarioAsignado2().getId()).name();
                                conteoSectorDTO.actualizarEstadosUsuario(estadoUsuario1, estadoUsuario2);
                            }
                        }
                    }
                }
                
                return ResponseEntity.ok(inventarioDTO);
            } else {
                System.out.println("🔍 No hay inventario activo para la empresa: " + empresaId);
                return ResponseEntity.ok(Map.of(
                    "inventarioActivo", false,
                    "mensaje", "No hay inventario activo para esta empresa",
                    "empresaId", empresaId
                ));
            }
        } catch (Exception e) {
            System.err.println("❌ Error obteniendo inventario activo: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error interno del servidor: " + e.getMessage()));
        }
    }

    /**
     * Obtener usuarios por rol de la empresa
     */
    @GetMapping("/usuarios")
    public ResponseEntity<?> obtenerUsuariosPorRol(
            @PathVariable Long empresaId,
            @RequestParam(required = false) String rol,
            Authentication authentication) {
        try {
            System.out.println("🔍 Obteniendo usuarios para empresa: " + empresaId + ", rol: " + rol);
            
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            
            // Verificar que el usuario pertenece a la empresa
            if (!usuarioPrincipal.getEmpresaId().equals(empresaId)) {
                return ResponseEntity.status(403).body(Map.of("error", "No autorizado para acceder a esta empresa"));
            }
            
            Empresa empresa = empresaRepository.findById(empresaId)
                    .orElseThrow(() -> new RuntimeException("Empresa no encontrada"));
            
            List<Usuario> usuarios;
            if (rol != null && !rol.isEmpty()) {
                usuarios = usuarioRepository.findByRolAndEmpresa(Usuario.RolUsuario.valueOf(rol), empresa);
            } else {
                usuarios = usuarioRepository.findByEmpresaAndActivoTrue(empresa);
            }
            
            System.out.println("🔍 Usuarios encontrados: " + usuarios.size());
            
            return ResponseEntity.ok(usuarios);
        } catch (Exception e) {
            System.err.println("❌ Error obteniendo usuarios: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Crear un nuevo inventario completo
     */
    @PostMapping
    public ResponseEntity<?> crearInventarioCompleto(
            @PathVariable Long empresaId,
            Authentication authentication) {
        try {
            System.out.println("🔍 Creando inventario completo para empresa: " + empresaId);
            
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long usuarioAdminId = usuarioPrincipal.getId();
            
            InventarioCompleto inventario = inventarioCompletoService.crearInventarioCompleto(empresaId, usuarioAdminId);
            InventarioCompletoDTO inventarioDTO = new InventarioCompletoDTO(inventario);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Inventario completo creado exitosamente",
                "inventario", inventarioDTO
            ));
        } catch (Exception e) {
            System.err.println("❌ Error creando inventario completo: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Obtener inventarios completos por empresa
     */
    @GetMapping
    public ResponseEntity<?> obtenerInventariosCompletos(@PathVariable Long empresaId) {
        try {
            List<InventarioCompleto> inventarios = inventarioCompletoService.obtenerInventariosCompletosPorEmpresa(empresaId);
            return ResponseEntity.ok(inventarios);
        } catch (Exception e) {
            System.err.println("❌ Error obteniendo inventarios completos: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Obtener inventario completo por ID
     */
    @GetMapping("/{inventarioId}")
    public ResponseEntity<?> obtenerInventarioCompleto(
            @PathVariable Long empresaId,
            @PathVariable Long inventarioId) {
        try {
            Optional<InventarioCompleto> inventario = inventarioCompletoService.obtenerInventarioCompleto(inventarioId);
            
            if (inventario.isPresent()) {
                return ResponseEntity.ok(inventario.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("❌ Error obteniendo inventario completo: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }


    /**
     * Obtener conteo de sector por ID
     */
    @GetMapping("/conteos-sector/{conteoSectorId}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> obtenerConteoSector(
            @PathVariable Long empresaId,
            @PathVariable Long conteoSectorId) {
        try {
            System.out.println("🔍 Obteniendo conteo de sector: " + conteoSectorId + " para empresa: " + empresaId);
            
            Optional<ConteoSector> conteoSector = inventarioCompletoService.obtenerConteoSector(conteoSectorId);
            
            if (conteoSector.isPresent()) {
                ConteoSector conteo = conteoSector.get();
                
                // Verificar que el conteo pertenece a la empresa
                if (!conteo.getInventarioCompleto().getEmpresa().getId().equals(empresaId)) {
                    System.err.println("❌ El conteo de sector no pertenece a la empresa: " + empresaId);
                    return ResponseEntity.status(403).body(Map.of("error", "No autorizado para acceder a este conteo"));
                }
                
                ConteoSectorDTO conteoSectorDTO = new ConteoSectorDTO(conteo);
                return ResponseEntity.ok(conteoSectorDTO);
            } else {
                System.err.println("❌ Conteo de sector no encontrado: " + conteoSectorId);
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("❌ Error obteniendo conteo de sector: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error interno del servidor: " + e.getMessage()));
        }
    }

    /**
     * Asignar usuarios a un sector (endpoint para frontend)
     */
    @PostMapping("/{inventarioId}/sectores/{sectorId}/asignar")
    public ResponseEntity<?> asignarUsuariosASectorPorSectorId(
            @PathVariable Long empresaId,
            @PathVariable Long inventarioId,
            @PathVariable Long sectorId,
            @RequestBody Map<String, Long> request) {
        try {
            System.out.println("🔍 Asignando usuarios a sector - empresaId: " + empresaId + ", inventarioId: " + inventarioId + ", sectorId: " + sectorId);
            
            Long usuario1Id = request.get("usuario1Id");
            Long usuario2Id = request.get("usuario2Id");
            
            System.out.println("🔍 Usuarios a asignar - usuario1Id: " + usuario1Id + ", usuario2Id: " + usuario2Id);
            
            if (usuario1Id == null || usuario2Id == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Los IDs de usuario son obligatorios"));
            }
            
            ConteoSector conteoSector = inventarioCompletoService.asignarUsuariosASectorPorSectorId(inventarioId, sectorId, usuario1Id, usuario2Id);
            ConteoSectorDTO conteoSectorDTO = new ConteoSectorDTO(conteoSector);
            
            // Actualizar estados por usuario usando la nueva lógica
            String estadoUsuario1 = inventarioCompletoService.determinarEstadoUsuario(conteoSector, usuario1Id).name();
            String estadoUsuario2 = inventarioCompletoService.determinarEstadoUsuario(conteoSector, usuario2Id).name();
            conteoSectorDTO.actualizarEstadosUsuario(estadoUsuario1, estadoUsuario2);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Usuarios asignados exitosamente",
                "conteoSector", conteoSectorDTO
            ));
        } catch (Exception e) {
            System.err.println("❌ Error asignando usuarios: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error interno del servidor: " + e.getMessage()));
        }
    }

    /**
     * Obtener conteos de sector de un inventario completo
     */
    @GetMapping("/{inventarioId}/conteos-sector")
    public ResponseEntity<?> obtenerConteosSector(
            @PathVariable Long empresaId,
            @PathVariable Long inventarioId,
            Authentication authentication) {
        try {
            System.out.println("🔍 Obteniendo conteos de sector - empresaId: " + empresaId + ", inventarioId: " + inventarioId);
            
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            
            // Verificar que el usuario pertenece a la empresa
            if (!usuarioPrincipal.getEmpresaId().equals(empresaId)) {
                return ResponseEntity.status(403).body(Map.of("error", "No autorizado para acceder a esta empresa"));
            }
            
            List<ConteoSectorDTO> conteosSector = inventarioCompletoService.obtenerConteosSector(inventarioId);
            
            return ResponseEntity.ok(conteosSector);
        } catch (Exception e) {
            System.err.println("❌ Error obteniendo conteos de sector: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error interno del servidor: " + e.getMessage()));
        }
    }

    /**
     * Asignar usuarios a un conteo de sector
     */
    @PostMapping("/{inventarioId}/conteos-sector/{conteoSectorId}/asignar-usuarios")
    public ResponseEntity<?> asignarUsuariosASector(
            @PathVariable Long empresaId,
            @PathVariable Long inventarioId,
            @PathVariable Long conteoSectorId,
            @RequestBody Map<String, Long> request) {
        try {
            Long usuario1Id = request.get("usuario1Id");
            Long usuario2Id = request.get("usuario2Id");
            
            if (usuario1Id == null || usuario2Id == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Los IDs de usuario son obligatorios"));
            }
            
            ConteoSector conteoSector = inventarioCompletoService.asignarUsuariosASector(conteoSectorId, usuario1Id, usuario2Id);
            ConteoSectorDTO conteoSectorDTO = new ConteoSectorDTO(conteoSector);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Usuarios asignados exitosamente",
                "conteoSector", conteoSectorDTO
            ));
        } catch (Exception e) {
            System.err.println("❌ Error asignando usuarios: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Iniciar conteo de un sector
     */
    @PostMapping("/{inventarioId}/conteos-sector/{conteoSectorId}/iniciar")
    public ResponseEntity<?> iniciarConteoSector(
            @PathVariable Long empresaId,
            @PathVariable Long inventarioId,
            @PathVariable Long conteoSectorId,
            Authentication authentication) {
        try {
            System.out.println("🔍 ENDPOINT iniciarConteoSector llamado:");
            System.out.println("  - empresaId: " + empresaId);
            System.out.println("  - inventarioId: " + inventarioId);
            System.out.println("  - conteoSectorId: " + conteoSectorId);
            
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long usuarioId = usuarioPrincipal.getId();
            
            System.out.println("  - usuarioId: " + usuarioId);
            
            ConteoSector conteoSector = inventarioCompletoService.iniciarConteoSector(conteoSectorId, usuarioId);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Conteo de sector iniciado exitosamente",
                "conteoSector", conteoSector
            ));
        } catch (Exception e) {
            System.err.println("❌ Error iniciando conteo de sector: " + e.getMessage());
            e.printStackTrace(); // Agregar stack trace completo
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Obtener información del conteo sector
     */
    @GetMapping("/conteos-sector/{conteoSectorId}/info")
    public ResponseEntity<?> obtenerConteoSectorInfo(
            @PathVariable Long empresaId,
            @PathVariable Long conteoSectorId,
            Authentication authentication) {
        try {
            System.out.println("🔍 Obteniendo información del conteo sector: " + conteoSectorId);
            
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long usuarioId = usuarioPrincipal.getId();
            
            // Obtener el conteo sector
            ConteoSector conteoSector = inventarioCompletoService.obtenerConteoSectorPorId(conteoSectorId);
            if (conteoSector == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Verificar que el usuario tenga acceso a este conteo
            if (!conteoSector.getUsuarioAsignado1().getId().equals(usuarioId) && 
                !conteoSector.getUsuarioAsignado2().getId().equals(usuarioId)) {
                return ResponseEntity.status(403).body(Map.of("error", "No tienes acceso a este conteo"));
            }
            
            // Crear DTO con la información del conteo sector
            Map<String, Object> conteoSectorDTO = new HashMap<>();
            conteoSectorDTO.put("id", conteoSector.getId());
            conteoSectorDTO.put("sectorNombre", conteoSector.getSector().getNombre());
            conteoSectorDTO.put("sectorDescripcion", conteoSector.getSector().getDescripcion());
            conteoSectorDTO.put("usuario1Id", conteoSector.getUsuarioAsignado1().getId());
            conteoSectorDTO.put("usuario2Id", conteoSector.getUsuarioAsignado2().getId());
            conteoSectorDTO.put("usuario1Nombre", conteoSector.getUsuarioAsignado1().getNombre() + " " + conteoSector.getUsuarioAsignado1().getApellidos());
            conteoSectorDTO.put("usuario2Nombre", conteoSector.getUsuarioAsignado2().getNombre() + " " + conteoSector.getUsuarioAsignado2().getApellidos());
            conteoSectorDTO.put("estado", conteoSector.getEstado().toString());
            conteoSectorDTO.put("fechaInicio", conteoSector.getFechaCreacion()); // Usamos fecha de creación
            conteoSectorDTO.put("fechaFinalizacion", conteoSector.getFechaFinalizacion());
            conteoSectorDTO.put("productosContados", conteoSector.getProductosContados());
            conteoSectorDTO.put("totalProductos", 0); // Ya no tenemos este campo
            conteoSectorDTO.put("conteo1Finalizado", conteoSector.isConteo1Finalizado());
            conteoSectorDTO.put("conteo2Finalizado", conteoSector.isConteo2Finalizado());
            conteoSectorDTO.put("estadoUsuario1", conteoSector.getEstadoUsuario1().toString());
            conteoSectorDTO.put("estadoUsuario2", conteoSector.getEstadoUsuario2().toString());
            
            System.out.println("✅ Información del conteo sector obtenida: " + conteoSectorDTO);
            return ResponseEntity.ok(conteoSectorDTO);
            
        } catch (Exception e) {
            System.err.println("❌ Error obteniendo información del conteo sector: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error interno del servidor: " + e.getMessage()));
        }
    }

    /**
     * Obtener detalles consolidados para comparación de conteos
     */
    @GetMapping("/conteos-sector/{conteoSectorId}/comparacion")
    @Transactional(readOnly = true)
    public ResponseEntity<?> obtenerDetallesParaComparacion(
            @PathVariable Long empresaId,
            @PathVariable Long conteoSectorId) {
        try {
            System.out.println("🔍 Obteniendo detalles para comparación del sector: " + conteoSectorId);
            
            // Verificar que el conteo pertenece a la empresa
            Optional<ConteoSector> conteoSectorOpt = inventarioCompletoService.obtenerConteoSector(conteoSectorId);
            if (!conteoSectorOpt.isPresent()) {
                return ResponseEntity.notFound().build();
            }
            
            ConteoSector conteoSector = conteoSectorOpt.get();
            
            // Verificar que el conteo pertenece a la empresa con protección contra lazy loading
            try {
                if (!conteoSector.getInventarioCompleto().getEmpresa().getId().equals(empresaId)) {
                    return ResponseEntity.status(403).body(Map.of("error", "No autorizado para acceder a este conteo"));
                }
            } catch (Exception e) {
                System.err.println("⚠️ Error verificando empresa del conteo (posible proxy lazy): " + e.getMessage());
                return ResponseEntity.status(500).body(Map.of("error", "Error verificando autorización"));
            }
            
            // Obtener el usuario autenticado
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(401).body(Map.of("error", "No autorizado"));
            }
            
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long usuarioId = usuarioPrincipal.getUsuario().getId();
            
            List<Map<String, Object>> detallesComparacion = inventarioCompletoService.obtenerDetallesParaComparacion(conteoSectorId, usuarioId);
            
            System.out.println("✅ Detalles para comparación obtenidos: " + detallesComparacion.size());
            return ResponseEntity.ok(detallesComparacion);
            
        } catch (Exception e) {
            System.err.println("❌ Error obteniendo detalles para comparación: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error interno del servidor: " + e.getMessage()));
        }
    }

    /**
     * Obtener detalles de conteo de un sector
     */
    @GetMapping("/conteos-sector/{conteoSectorId}/detalles")
    @Transactional(readOnly = true)
    public ResponseEntity<?> obtenerDetallesConteo(
            @PathVariable Long empresaId,
            @PathVariable Long conteoSectorId,
            @RequestParam(required = false) Boolean modoReconteo,
            Authentication authentication) {
        try {
            System.out.println("🔍 Obteniendo detalles de conteo para sector: " + conteoSectorId + ", modoReconteo: " + modoReconteo);
            
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long usuarioId = usuarioPrincipal.getId();
            
            List<DetalleConteo> detalles;
            
            // Si es modo reconteo, obtener detalles consolidados con cantidades de ambos usuarios
            if (Boolean.TRUE.equals(modoReconteo)) {
                System.out.println("🔍 Modo reconteo activado - obteniendo detalles consolidados");
                System.out.println("🔍 DEBUG llamando a obtenerDetallesConteoParaReconteo con conteoSectorId: " + conteoSectorId);
                detalles = inventarioCompletoService.obtenerDetallesConteoParaReconteo(conteoSectorId);
                System.out.println("🔍 DEBUG detalles consolidados obtenidos: " + detalles.size());
                for (DetalleConteo detalle : detalles) {
                    // Forzar la carga de la entidad Producto para evitar lazy loading
                    if (detalle.getProducto() != null) {
                        System.out.println("  - Producto: " + detalle.getProducto().getNombre() + 
                                         " - CantidadConteo1: " + detalle.getCantidadConteo1() + 
                                         " - CantidadConteo2: " + detalle.getCantidadConteo2());
                    }
                }
            } else {
                // Modo normal - obtener detalles filtrados por usuario
                System.out.println("🔍 Modo normal - obteniendo detalles por usuario: " + usuarioId);
                detalles = inventarioCompletoService.obtenerDetallesConteoPorUsuario(conteoSectorId, usuarioId);
                System.out.println("🔍 DEBUG detalles por usuario obtenidos: " + detalles.size());
            }
            
            // Convertir a DTOs para evitar problemas de serialización
            List<Map<String, Object>> detallesDTO = detalles.stream().map(detalle -> {
                System.out.println("🔍 DEBUG convirtiendo detalle a DTO:");
                
                Map<String, Object> dto = new HashMap<>();
                dto.put("id", detalle.getId());
                
                // Manejar producto con protección contra lazy loading
                if (detalle.getProducto() != null) {
                    try {
                        dto.put("productoId", detalle.getProducto().getId());
                        dto.put("nombreProducto", detalle.getProducto().getNombre());
                        dto.put("codigoProducto", detalle.getProducto().getCodigoPersonalizado());
                        System.out.println("  - Producto: " + detalle.getProducto().getNombre());
                    } catch (Exception e) {
                        System.err.println("⚠️ Error accediendo a datos del producto (posible proxy lazy): " + e.getMessage());
                        dto.put("productoId", null);
                        dto.put("nombreProducto", "Producto no disponible");
                        dto.put("codigoProducto", null);
                    }
                } else {
                    dto.put("productoId", null);
                    dto.put("nombreProducto", "Producto no disponible");
                    dto.put("codigoProducto", null);
                }
                
                dto.put("stockSistema", detalle.getStockSistema());
                dto.put("cantidadConteo1", detalle.getCantidadConteo1());
                dto.put("cantidadConteo2", detalle.getCantidadConteo2());
                dto.put("cantidadFinal", detalle.getCantidadFinal());
                dto.put("formulaCalculo1", detalle.getFormulaCalculo1());
                dto.put("formulaCalculo2", detalle.getFormulaCalculo2());
                
                // Agregar todos los detalles del producto para mostrar conteos individuales
                if (Boolean.TRUE.equals(modoReconteo)) {
                    dto.put("todosLosDetallesDelProducto", obtenerTodosLosDetallesDelProducto(conteoSectorId, detalle.getProducto().getId()));
                }
                dto.put("estado", detalle.getEstado().toString());
                dto.put("diferenciaSistema", detalle.getDiferenciaSistema());
                dto.put("diferenciaEntreConteos", detalle.getDiferenciaEntreConteos());
                dto.put("fechaCreacion", detalle.getFechaCreacion());
                dto.put("fechaActualizacion", detalle.getFechaActualizacion());
                
                System.out.println("🔍 DEBUG DTO creado:");
                System.out.println("  - cantidadConteo1 en DTO: " + dto.get("cantidadConteo1"));
                System.out.println("  - cantidadConteo2 en DTO: " + dto.get("cantidadConteo2"));
                System.out.println("  - formulaCalculo1 en DTO: " + dto.get("formulaCalculo1"));
                System.out.println("  - formulaCalculo2 en DTO: " + dto.get("formulaCalculo2"));
                
                return dto;
            }).collect(Collectors.toList());
            
            return ResponseEntity.ok(detallesDTO);
        } catch (Exception e) {
            System.err.println("❌ Error obteniendo detalles de conteo: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error interno del servidor: " + e.getMessage()));
        }
    }

    /**
     * Agregar producto al conteo
     */
    @PostMapping("/{inventarioId}/conteos-sector/{conteoSectorId}/agregar-producto")
    public ResponseEntity<?> agregarProductoAlConteo(
            @PathVariable Long empresaId,
            @PathVariable Long inventarioId,
            @PathVariable Long conteoSectorId,
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        try {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long usuarioId = usuarioPrincipal.getId();
            
            Long productoId = Long.valueOf(request.get("productoId").toString());
            Integer cantidad = Integer.valueOf(request.get("cantidad").toString());
            String formulaCalculo = (String) request.get("formulaCalculo");
            
            System.out.println("🔍 DEBUG agregarProductoAlConteo - Controlador:");
            System.out.println("  - EmpresaId: " + empresaId);
            System.out.println("  - InventarioId: " + inventarioId);
            System.out.println("  - ConteoSectorId: " + conteoSectorId);
            System.out.println("  - UsuarioId: " + usuarioId);
            System.out.println("  - ProductoId: " + productoId);
            System.out.println("  - Cantidad: " + cantidad);
            System.out.println("  - FormulaCalculo: " + formulaCalculo);
            
            // Si se proporciona una fórmula, evaluarla
            if (formulaCalculo != null && !formulaCalculo.trim().isEmpty()) {
                CalculadoraService.ResultadoCalculo resultado = calculadoraService.evaluarExpresion(formulaCalculo);
                if (resultado.isExito()) {
                    cantidad = resultado.getResultado();
                } else {
                    return ResponseEntity.badRequest().body(Map.of("error", resultado.getError()));
                }
            }
            
            DetalleConteo detalle = inventarioCompletoService.agregarProductoAlConteo(
                conteoSectorId, productoId, cantidad, formulaCalculo, usuarioId);
            
            System.out.println("✅ Producto agregado exitosamente al conteo");
            System.out.println("  - Detalle ID: " + detalle.getId());
            System.out.println("  - Estado del detalle: " + detalle.getEstado());
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Producto agregado al conteo exitosamente",
                "productoId", detalle.getProducto().getId(),
                "cantidad", detalle.getCantidadConteo1() != null ? detalle.getCantidadConteo1() : detalle.getCantidadConteo2(),
                "estado", detalle.getEstado().toString()
            ));
        } catch (Exception e) {
            System.err.println("❌ Error agregando producto al conteo: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Agregar producto al reconteo (reemplaza cantidad existente)
     */
    @PostMapping("/{inventarioId}/conteos-sector/{conteoSectorId}/agregar-producto-reconteo")
    public ResponseEntity<?> agregarProductoAlReconteo(
            @PathVariable Long empresaId,
            @PathVariable Long inventarioId,
            @PathVariable Long conteoSectorId,
            @RequestBody Map<String, Object> request,
            Authentication authentication) {
        try {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long usuarioId = usuarioPrincipal.getId();
            
            Long productoId = Long.valueOf(request.get("productoId").toString());
            Integer cantidad = Integer.valueOf(request.get("cantidad").toString());
            String formulaCalculo = (String) request.get("formulaCalculo");
            
            System.out.println("🔄 DEBUG agregarProductoAlReconteo - Controlador:");
            System.out.println("  - EmpresaId: " + empresaId);
            System.out.println("  - InventarioId: " + inventarioId);
            System.out.println("  - ConteoSectorId: " + conteoSectorId);
            System.out.println("  - UsuarioId: " + usuarioId);
            System.out.println("  - ProductoId: " + productoId);
            System.out.println("  - Cantidad: " + cantidad);
            System.out.println("  - FormulaCalculo: " + formulaCalculo);
            
            // Si se proporciona una fórmula, evaluarla
            if (formulaCalculo != null && !formulaCalculo.trim().isEmpty()) {
                CalculadoraService.ResultadoCalculo resultado = calculadoraService.evaluarExpresion(formulaCalculo);
                if (resultado.isExito()) {
                    cantidad = resultado.getResultado();
                } else {
                    return ResponseEntity.badRequest().body(Map.of("error", resultado.getError()));
                }
            }
            
            DetalleConteo detalle = inventarioCompletoService.agregarProductoAlReconteo(
                conteoSectorId, productoId, cantidad, formulaCalculo, usuarioId);
            
            System.out.println("✅ Producto agregado exitosamente al reconteo");
            System.out.println("  - Detalle ID: " + detalle.getId());
            System.out.println("  - Estado del detalle: " + detalle.getEstado());
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Producto agregado al reconteo exitosamente",
                "productoId", detalle.getProducto().getId(),
                "cantidad", detalle.getCantidadConteo1() != null ? detalle.getCantidadConteo1() : detalle.getCantidadConteo2(),
                "estado", detalle.getEstado().toString()
            ));
        } catch (Exception e) {
            System.err.println("❌ Error agregando producto al reconteo: " + e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }


    /**
     * Cancelar inventario completo
     */
    @PostMapping("/{inventarioId}/cancelar")
    public ResponseEntity<?> cancelarInventarioCompleto(
            @PathVariable Long empresaId,
            @PathVariable Long inventarioId,
            Authentication authentication) {
        try {
            System.out.println("🔍 Cancelando inventario completo - empresaId: " + empresaId + ", inventarioId: " + inventarioId);
            
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            
            System.out.println("🔍 DEBUG Cancelar - Usuario ID: " + usuarioPrincipal.getId());
            System.out.println("🔍 DEBUG Cancelar - Usuario Empresa ID: " + usuarioPrincipal.getEmpresaId());
            System.out.println("🔍 DEBUG Cancelar - Empresa ID solicitada: " + empresaId);
            System.out.println("🔍 DEBUG Cancelar - Usuario Authorities: " + usuarioPrincipal.getAuthorities());
            
            // Verificar que el usuario pertenece a la empresa
            if (!usuarioPrincipal.getEmpresaId().equals(empresaId)) {
                System.err.println("❌ ERROR: Usuario no pertenece a la empresa - Usuario: " + usuarioPrincipal.getEmpresaId() + ", Solicitada: " + empresaId);
                return ResponseEntity.status(403).body(Map.of("error", "No autorizado para acceder a esta empresa"));
            }
            
            // Verificar que el usuario es administrador
            boolean esAdministrador = usuarioPrincipal.getAuthorities().stream()
                    .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMINISTRADOR"));
            
            System.out.println("🔍 DEBUG Cancelar - Es administrador: " + esAdministrador);
            
            if (!esAdministrador) {
                System.err.println("❌ ERROR: Usuario no es administrador - Authorities: " + usuarioPrincipal.getAuthorities());
                return ResponseEntity.status(403).body(Map.of("error", "Solo los administradores pueden cancelar inventarios"));
            }
            
            System.out.println("🔍 Llamando a cancelarInventarioCompleto...");
            InventarioCompleto inventario = inventarioCompletoService.cancelarInventarioCompleto(inventarioId);
            System.out.println("✅ Inventario cancelado en servicio, creando DTO...");
            
            InventarioCompletoDTO inventarioDTO = new InventarioCompletoDTO(inventario);
            System.out.println("✅ DTO creado exitosamente");
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Inventario cancelado exitosamente",
                "inventario", inventarioDTO
            ));
        } catch (Exception e) {
            System.err.println("❌ Error cancelando inventario: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error interno del servidor: " + e.getMessage()));
        }
    }

    /**
     * Finalizar inventario completo
     */
    @PostMapping("/{inventarioId}/finalizar")
    public ResponseEntity<?> finalizarInventarioCompleto(
            @PathVariable Long empresaId,
            @PathVariable Long inventarioId,
            Authentication authentication) {
        try {
            System.out.println("🔍 Finalizando inventario completo - empresaId: " + empresaId + ", inventarioId: " + inventarioId);
            
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            
            // Verificar que el usuario pertenece a la empresa
            if (!usuarioPrincipal.getEmpresaId().equals(empresaId)) {
                return ResponseEntity.status(403).body(Map.of("error", "No autorizado para acceder a esta empresa"));
            }
            
            // Verificar que el usuario es administrador
            if (!usuarioPrincipal.getAuthorities().stream()
                    .anyMatch(auth -> auth.getAuthority().equals("ROLE_ADMINISTRADOR"))) {
                return ResponseEntity.status(403).body(Map.of("error", "Solo los administradores pueden finalizar inventarios"));
            }
            
            InventarioCompleto inventario = inventarioCompletoService.finalizarInventarioCompleto(inventarioId);
            InventarioCompletoDTO inventarioDTO = new InventarioCompletoDTO(inventario);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Inventario finalizado exitosamente",
                "inventario", inventarioDTO
            ));
        } catch (Exception e) {
            System.err.println("❌ Error finalizando inventario: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error interno del servidor: " + e.getMessage()));
        }
    }

    /**
     * Finalizar conteo de sector
     */
    @PostMapping("/{inventarioId}/conteos-sector/{conteoSectorId}/finalizar")
    public ResponseEntity<?> finalizarConteoSector(
            @PathVariable Long empresaId,
            @PathVariable Long inventarioId,
            @PathVariable Long conteoSectorId,
            @RequestBody Map<String, Long> request,
            Authentication authentication) {
        try {
            System.out.println("🔍 Finalizando conteo de sector - empresaId: " + empresaId + ", inventarioId: " + inventarioId + ", conteoSectorId: " + conteoSectorId);
            
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long usuarioId = request.get("usuarioId");
            
            // Verificar que el usuario pertenece a la empresa
            if (!usuarioPrincipal.getEmpresaId().equals(empresaId)) {
                return ResponseEntity.status(403).body(Map.of("error", "No autorizado para acceder a esta empresa"));
            }
            
            // Verificar que el usuario está asignado al conteo
            if (!usuarioPrincipal.getId().equals(usuarioId)) {
                return ResponseEntity.status(403).body(Map.of("error", "No autorizado para finalizar este conteo"));
            }
            
            ConteoSector conteoSector = inventarioCompletoService.finalizarConteoSector(conteoSectorId, usuarioId);
            ConteoSectorDTO conteoSectorDTO = new ConteoSectorDTO(conteoSector);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Conteo finalizado exitosamente",
                "conteoSector", conteoSectorDTO
            ));
        } catch (Exception e) {
            System.err.println("❌ Error finalizando conteo de sector: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error interno del servidor: " + e.getMessage()));
        }
    }

    /**
     * Finalizar reconteo de sector
     */
    @PostMapping("/{inventarioId}/conteos-sector/{conteoSectorId}/finalizar-reconteo")
    public ResponseEntity<?> finalizarReconteoSector(
            @PathVariable Long empresaId,
            @PathVariable Long inventarioId,
            @PathVariable Long conteoSectorId,
            @RequestBody Map<String, Long> request,
            Authentication authentication) {
        try {
            System.out.println("🔍 Finalizando reconteo de sector - empresaId: " + empresaId + ", inventarioId: " + inventarioId + ", conteoSectorId: " + conteoSectorId);
            
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long usuarioId = request.get("usuarioId");
            
            // Verificar que el usuario pertenece a la empresa
            if (!usuarioPrincipal.getEmpresaId().equals(empresaId)) {
                return ResponseEntity.status(403).body(Map.of("error", "No autorizado para acceder a esta empresa"));
            }
            
            // Verificar que el usuario está asignado al conteo
            if (!usuarioPrincipal.getId().equals(usuarioId)) {
                return ResponseEntity.status(403).body(Map.of("error", "No autorizado para finalizar este reconteo"));
            }
            
            ConteoSector conteoSector = inventarioCompletoService.finalizarReconteoSector(conteoSectorId, usuarioId);
            ConteoSectorDTO conteoSectorDTO = new ConteoSectorDTO(conteoSector);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Reconteo finalizado exitosamente",
                "conteoSector", conteoSectorDTO,
                "estado", conteoSector.getEstado().toString()
            ));
        } catch (Exception e) {
            System.err.println("❌ Error finalizando reconteo de sector: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error interno del servidor: " + e.getMessage()));
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

    /**
     * Obtener TODOS los productos consolidados para reconteo (incluye productos con y sin diferencias)
     */
    @GetMapping("/conteos-sector/{conteoSectorId}/productos-diferencias")
    public ResponseEntity<?> obtenerProductosConDiferencias(
            @PathVariable Long empresaId,
            @PathVariable Long conteoSectorId,
            Authentication authentication) {
        try {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long usuarioId = usuarioPrincipal.getId();
            
            System.out.println("🔍 Obteniendo productos con diferencias en totales (con subcantidades):");
            System.out.println("  - EmpresaId: " + empresaId);
            System.out.println("  - ConteoSectorId: " + conteoSectorId);
            System.out.println("  - UsuarioId: " + usuarioId);
            
            List<Map<String, Object>> productosConDiferencias = inventarioCompletoService.obtenerProductosConDiferencias(conteoSectorId);
            
            System.out.println("✅ Productos con diferencias encontrados: " + productosConDiferencias.size());
            
            // Debug de la estructura completa
            for (Map<String, Object> producto : productosConDiferencias) {
                System.out.println("🔍 DEBUG producto con diferencias:");
                System.out.println("  - Producto: " + producto.get("nombreProducto"));
                System.out.println("  - Total Usuario1: " + producto.get("totalUsuario1"));
                System.out.println("  - Total Usuario2: " + producto.get("totalUsuario2"));
                System.out.println("  - Diferencia: " + producto.get("diferenciaEntreConteos"));
                System.out.println("  - Fórmula Total Usuario1: " + producto.get("formulaTotalUsuario1"));
                System.out.println("  - Fórmula Total Usuario2: " + producto.get("formulaTotalUsuario2"));
                
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> subcantidades = (List<Map<String, Object>>) producto.get("subcantidades");
                System.out.println("  - Subcantidades: " + (subcantidades != null ? subcantidades.size() : 0));
            }
            
            return ResponseEntity.ok(productosConDiferencias);
        } catch (Exception e) {
            System.err.println("❌ Error obteniendo productos con diferencias: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Endpoint temporal para debug - resetear estado de conteo
     */
    @PostMapping("/debug/reset-conteo/{conteoSectorId}")
    public ResponseEntity<?> resetConteoEstado(@PathVariable Long empresaId, @PathVariable Long conteoSectorId) {
        try {
            System.out.println("🔧 DEBUG: Reseteando estado del conteo " + conteoSectorId);
            
            ConteoSector conteoSector = inventarioCompletoService.resetearEstadoConteo(conteoSectorId);
            ConteoSectorDTO conteoSectorDTO = new ConteoSectorDTO(conteoSector);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Estado del conteo reseteado",
                "conteoSector", conteoSectorDTO
            ));
        } catch (Exception e) {
            System.err.println("❌ Error reseteando estado: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error interno del servidor: " + e.getMessage()));
        }
    }
    
    /**
     * Obtener todos los detalles de un producto para mostrar conteos individuales
     */
    private List<Map<String, Object>> obtenerTodosLosDetallesDelProducto(Long conteoSectorId, Long productoId) {
        try {
            // Obtener el conteo de sector
            ConteoSector conteoSector = inventarioCompletoService.obtenerConteoSectorPorId(conteoSectorId);
            if (conteoSector == null) {
                return new ArrayList<>();
            }
            
            // Obtener todos los detalles del sector y filtrar por producto
            List<DetalleConteo> todosLosDetalles = detalleConteoRepository.findByConteoSectorOrderByProductoNombre(conteoSector);
            List<DetalleConteo> detallesDelProducto = todosLosDetalles.stream()
                .filter(detalle -> detalle.getProducto().getId().equals(productoId))
                .collect(Collectors.toList());
            
            List<Map<String, Object>> detallesCompletos = new ArrayList<>();
            
            for (DetalleConteo detalle : detallesDelProducto) {
                Map<String, Object> detalleCompleto = new HashMap<>();
                detalleCompleto.put("id", detalle.getId());
                detalleCompleto.put("fechaCreacion", detalle.getFechaCreacion());
                detalleCompleto.put("cantidadConteo1", detalle.getCantidadConteo1());
                detalleCompleto.put("cantidadConteo2", detalle.getCantidadConteo2());
                detalleCompleto.put("formulaCalculo1", detalle.getFormulaCalculo1());
                detalleCompleto.put("formulaCalculo2", detalle.getFormulaCalculo2());
                detalleCompleto.put("estado", detalle.getEstado().toString());
                detallesCompletos.add(detalleCompleto);
            }
            
            // Ordenar por fecha de creación
            detallesCompletos.sort((a, b) -> {
                LocalDateTime fechaA = (LocalDateTime) a.get("fechaCreacion");
                LocalDateTime fechaB = (LocalDateTime) b.get("fechaCreacion");
                return fechaA.compareTo(fechaB);
            });
            
            return detallesCompletos;
        } catch (Exception e) {
            System.err.println("❌ Error obteniendo detalles del producto: " + e.getMessage());
            return new ArrayList<>();
        }
    }

}
