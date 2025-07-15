package com.minegocio.backend.controladores;

import com.minegocio.backend.dto.EstadisticasInventarioDTO;
import com.minegocio.backend.dto.HistorialInventarioDTO;
import com.minegocio.backend.dto.InventarioRequestDTO;
import com.minegocio.backend.entidades.HistorialInventario;
import com.minegocio.backend.repositorios.HistorialInventarioRepository;
import com.minegocio.backend.seguridad.UsuarioPrincipal;
import com.minegocio.backend.servicios.HistorialInventarioService;
import com.minegocio.backend.utils.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Arrays;
import java.util.ArrayList;
import java.util.stream.Collectors;
import java.math.BigDecimal;

@RestController
@RequestMapping("/api/admin/inventario")
@CrossOrigin(origins = "*")
public class HistorialInventarioController {

    @Autowired
    private HistorialInventarioService historialInventarioService;
    
    @Autowired
    private HistorialInventarioRepository historialInventarioRepository;

    /**
     * Registrar una operación de inventario
     */
    @PostMapping("/operacion")
    public ResponseEntity<ApiResponse<HistorialInventarioDTO>> registrarOperacion(
            @Valid @RequestBody InventarioRequestDTO request) {
        
        try {
            // Obtener información del usuario autenticado
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            Long usuarioId = null;
            Long empresaId = null;
            
            if (authentication.getPrincipal() instanceof UsuarioPrincipal) {
                UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
                usuarioId = usuarioPrincipal.getId();
                empresaId = usuarioPrincipal.getEmpresaId();
            } else {
                return ResponseEntity.badRequest()
                        .body(new ApiResponse<>(false, "No se pudo obtener la información del usuario", null));
            }

            ApiResponse<HistorialInventarioDTO> response = historialInventarioService
                    .registrarOperacionInventario(request, usuarioId, empresaId);

            if (response.isSuccess()) {
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ApiResponse<>(false, "Error interno del servidor: " + e.getMessage(), null));
        }
    }

    /**
     * Obtener historial de inventario paginado
     */
    @GetMapping("/historial")
    public ResponseEntity<ApiResponse<Page<HistorialInventarioDTO>>> obtenerHistorial(
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamano) {
        
        try {
            Long empresaId = obtenerEmpresaIdDelUsuarioAutenticado();
            ApiResponse<Page<HistorialInventarioDTO>> response = historialInventarioService
                    .obtenerHistorialPorEmpresa(empresaId, pagina, tamano);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ApiResponse<>(false, "Error al obtener el historial: " + e.getMessage(), null));
        }
    }

    /**
     * Obtener historial de inventario por producto
     */
    @GetMapping("/historial/producto/{productoId}")
    public ResponseEntity<ApiResponse<List<HistorialInventarioDTO>>> obtenerHistorialPorProducto(
            @PathVariable Long productoId) {
        
        try {
            Long empresaId = obtenerEmpresaIdDelUsuarioAutenticado();
            ApiResponse<List<HistorialInventarioDTO>> response = historialInventarioService
                    .obtenerHistorialPorProducto(empresaId, productoId);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ApiResponse<>(false, "Error al obtener el historial del producto: " + e.getMessage(), null));
        }
    }

    /**
     * Obtener historial de inventario por rango de fechas
     */
    @GetMapping("/historial/fechas")
    public ResponseEntity<ApiResponse<List<HistorialInventarioDTO>>> obtenerHistorialPorFechas(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime fechaInicio,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime fechaFin) {
        
        try {
            Long empresaId = obtenerEmpresaIdDelUsuarioAutenticado();
            ApiResponse<List<HistorialInventarioDTO>> response = historialInventarioService
                    .obtenerHistorialPorFechas(empresaId, fechaInicio, fechaFin);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ApiResponse<>(false, "Error al obtener el historial por fechas: " + e.getMessage(), null));
        }
    }

    /**
     * Obtener estadísticas de inventario
     */
    @GetMapping("/estadisticas")
    public ResponseEntity<ApiResponse<EstadisticasInventarioDTO>> obtenerEstadisticas() {
        try {
            Long empresaId = obtenerEmpresaIdDelUsuarioAutenticado();
            ApiResponse<EstadisticasInventarioDTO> response = historialInventarioService
                    .obtenerEstadisticas(empresaId);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ApiResponse<>(false, "Error al obtener las estadísticas: " + e.getMessage(), null));
        }
    }

    /**
     * Obtener estadísticas de inventario por rango de fechas
     */
    @GetMapping("/estadisticas/fechas")
    public ResponseEntity<ApiResponse<EstadisticasInventarioDTO>> obtenerEstadisticasPorFechas(
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime fechaInicio,
            @RequestParam @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss") LocalDateTime fechaFin) {
        
        try {
            Long empresaId = obtenerEmpresaIdDelUsuarioAutenticado();
            ApiResponse<EstadisticasInventarioDTO> response = historialInventarioService
                    .obtenerEstadisticasPorFechas(empresaId, fechaInicio, fechaFin);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ApiResponse<>(false, "Error al obtener las estadísticas por fechas: " + e.getMessage(), null));
        }
    }

    /**
     * Obtener productos más movidos en inventario
     */
    @GetMapping("/productos-mas-movidos")
    public ResponseEntity<ApiResponse<List<Object[]>>> obtenerProductosMasMovidos(
            @RequestParam(defaultValue = "10") int limite) {
        
        try {
            Long empresaId = obtenerEmpresaIdDelUsuarioAutenticado();
            ApiResponse<List<Object[]>> response = historialInventarioService
                    .obtenerProductosMasMovidos(empresaId, limite);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ApiResponse<>(false, "Error al obtener los productos más movidos: " + e.getMessage(), null));
        }
    }

    /**
     * Obtener usuarios más activos en inventario
     */
    @GetMapping("/usuarios-mas-activos")
    public ResponseEntity<ApiResponse<List<Object[]>>> obtenerUsuariosMasActivos(
            @RequestParam(defaultValue = "10") int limite) {
        
        try {
            Long empresaId = obtenerEmpresaIdDelUsuarioAutenticado();
            ApiResponse<List<Object[]>> response = historialInventarioService
                    .obtenerUsuariosMasActivos(empresaId, limite);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ApiResponse<>(false, "Error al obtener los usuarios más activos: " + e.getMessage(), null));
        }
    }

    /**
     * Buscar historial por código de barras
     */
    @GetMapping("/buscar/codigo-barras/{codigoBarras}")
    public ResponseEntity<ApiResponse<List<HistorialInventarioDTO>>> buscarPorCodigoBarras(
            @PathVariable String codigoBarras) {
        
        try {
            Long empresaId = obtenerEmpresaIdDelUsuarioAutenticado();
            ApiResponse<List<HistorialInventarioDTO>> response = historialInventarioService
                    .buscarPorCodigoBarras(empresaId, codigoBarras);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(new ApiResponse<>(false, "Error al buscar por código de barras: " + e.getMessage(), null));
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

    private Long obtenerEmpresaIdDelUsuario(Long usuarioId) {
        // Este método ya no se usa, pero lo mantenemos por compatibilidad
        return obtenerEmpresaIdDelUsuarioAutenticado();
    }
    
    /**
     * Endpoint de prueba para verificar datos en la base de datos
     */
    @GetMapping("/debug")
    public ResponseEntity<?> debugHistorial() {
        try {
            Long empresaId = obtenerEmpresaIdDelUsuarioAutenticado();
            System.out.println("=== DEBUG ENDPOINT ===");
            System.out.println("Empresa ID: " + empresaId);
            
            // Consultar directamente el repositorio
            List<HistorialInventario> todos = historialInventarioRepository.findAll();
            
            // Consultar estadísticas específicas para la empresa
            Object[] estadisticas = historialInventarioRepository.getEstadisticasByEmpresaId(empresaId);
            
            // Crear respuesta de debug
            Map<String, Object> debugInfo = new HashMap<>();
            debugInfo.put("empresaId", empresaId);
            debugInfo.put("totalRegistrosEnBD", todos.size());
            debugInfo.put("registrosPorEmpresa", todos.stream()
                .filter(h -> h.getEmpresa() != null && h.getEmpresa().getId().equals(empresaId))
                .count());
            
            if (estadisticas != null) {
                debugInfo.put("estadisticasRaw", Arrays.asList(estadisticas));
                debugInfo.put("totalOperaciones", estadisticas[0]);
                debugInfo.put("totalIncrementos", estadisticas[1]);
                debugInfo.put("totalDecrementos", estadisticas[2]);
                debugInfo.put("totalAjustes", estadisticas[3]);
            } else {
                debugInfo.put("estadisticasRaw", null);
            }
            
            // Mostrar algunos registros de ejemplo
            List<Map<String, Object>> registrosEjemplo = todos.stream()
                .filter(h -> h.getEmpresa() != null && h.getEmpresa().getId().equals(empresaId))
                .limit(5)
                .map(h -> {
                    Map<String, Object> registro = new HashMap<>();
                    registro.put("id", h.getId());
                    registro.put("productoNombre", h.getProducto() != null ? h.getProducto().getNombre() : "N/A");
                    registro.put("tipoOperacion", h.getTipoOperacion());
                    registro.put("cantidad", h.getCantidad());
                    registro.put("fechaOperacion", h.getFechaOperacion());
                    return registro;
                })
                .collect(Collectors.toList());
            
            debugInfo.put("registrosEjemplo", registrosEjemplo);
            
            System.out.println("Debug info: " + debugInfo);
            System.out.println("=== FIN DEBUG ENDPOINT ===");
            
            return ResponseEntity.ok(debugInfo);
            System.out.println("Total de registros en la tabla: " + todos.size());
            
            // Filtrar por empresa
            List<HistorialInventario> deEstaEmpresa = todos.stream()
                    .filter(h -> h.getEmpresa().getId().equals(empresaId))
                    .collect(java.util.stream.Collectors.toList());
            
            System.out.println("Registros de esta empresa: " + deEstaEmpresa.size());
            
            if (!deEstaEmpresa.isEmpty()) {
                System.out.println("Último registro:");
                HistorialInventario ultimo = deEstaEmpresa.get(0);
                System.out.println("  ID: " + ultimo.getId());
                System.out.println("  Producto: " + ultimo.getProducto().getNombre());
                System.out.println("  Tipo: " + ultimo.getTipoOperacion());
                System.out.println("  Cantidad: " + ultimo.getCantidad());
                System.out.println("  Fecha: " + ultimo.getFechaOperacion());
            }
            
            System.out.println("=== FIN DEBUG ENDPOINT ===");
            
            return ResponseEntity.ok(java.util.Map.of(
                "totalRegistros", todos.size(),
                "registrosEmpresa", deEstaEmpresa.size(),
                "empresaId", empresaId
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Endpoint de prueba para crear un registro de historial manualmente
     */
    @PostMapping("/test-registro")
    public ResponseEntity<?> testRegistro() {
        try {
            Long empresaId = obtenerEmpresaIdDelUsuarioAutenticado();
            Long usuarioId = obtenerUsuarioIdDelUsuarioAutenticado();
            
            System.out.println("=== TEST REGISTRO MANUAL ===");
            System.out.println("Empresa ID: " + empresaId);
            System.out.println("Usuario ID: " + usuarioId);
            
            // Crear un request de prueba
            InventarioRequestDTO request = new InventarioRequestDTO();
            request.setProductoId(1L); // Asumiendo que existe un producto con ID 1
            request.setTipoOperacion("INCREMENTO");
            request.setCantidad(10);
            request.setPrecioUnitario(new java.math.BigDecimal("100.00"));
            request.setObservacion("Prueba manual desde endpoint");
            request.setCodigoBarras("123456789");
            request.setMetodoEntrada("MANUAL");
            
            // Intentar registrar
            ApiResponse<HistorialInventarioDTO> response = historialInventarioService
                    .registrarOperacionInventario(request, usuarioId, empresaId);
            
            System.out.println("Respuesta del servicio: " + response.isSuccess());
            System.out.println("Mensaje: " + response.getMensaje());
            
            if (response.isSuccess()) {
                System.out.println("✅ Registro creado exitosamente");
            } else {
                System.out.println("❌ Error al crear registro: " + response.getMensaje());
            }
            
            System.out.println("=== FIN TEST REGISTRO MANUAL ===");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Endpoint de prueba simple para verificar que el controlador funciona
     */
    @GetMapping("/test-ping")
    public ResponseEntity<?> testPing() {
        try {
            Long empresaId = obtenerEmpresaIdDelUsuarioAutenticado();
            Long usuarioId = obtenerUsuarioIdDelUsuarioAutenticado();
            
            System.out.println("=== TEST PING ===");
            System.out.println("✅ Controlador funcionando correctamente");
            System.out.println("Empresa ID: " + empresaId);
            System.out.println("Usuario ID: " + usuarioId);
            System.out.println("=== FIN TEST PING ===");
            
            return ResponseEntity.ok(java.util.Map.of(
                "status", "OK",
                "empresaId", empresaId,
                "usuarioId", usuarioId,
                "mensaje", "Controlador funcionando correctamente"
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of("error", e.getMessage()));
        }
    }

    /**
     * Endpoint de prueba sin autenticación para verificar que el backend funciona
     */
    @GetMapping("/test-public")
    public ResponseEntity<?> testPublic() {
        System.out.println("=== TEST PUBLIC ===");
        System.out.println("✅ Backend funcionando correctamente");
        System.out.println("=== FIN TEST PUBLIC ===");
        
        return ResponseEntity.ok(java.util.Map.of(
            "status", "OK",
            "mensaje", "Backend funcionando correctamente",
            "timestamp", java.time.LocalDateTime.now().toString()
        ));
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