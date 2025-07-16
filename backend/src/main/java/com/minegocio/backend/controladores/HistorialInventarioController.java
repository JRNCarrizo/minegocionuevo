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
                debugInfo.put("longitudArray", estadisticas.length);
                
                // Acceder a los elementos de forma segura
                if (estadisticas.length > 0) {
                    debugInfo.put("totalOperaciones", estadisticas[0]);
                }
                if (estadisticas.length > 1) {
                    debugInfo.put("totalIncrementos", estadisticas[1]);
                }
                if (estadisticas.length > 2) {
                    debugInfo.put("totalDecrementos", estadisticas[2]);
                }
                if (estadisticas.length > 3) {
                    debugInfo.put("totalAjustes", estadisticas[3]);
                }
                
                // Mostrar todos los elementos del array
                for (int i = 0; i < estadisticas.length; i++) {
                    debugInfo.put("elemento_" + i, estadisticas[i]);
                }
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
            

            
            return ResponseEntity.ok(debugInfo);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of("error", e.getMessage()));
        }
    }
    
    /**
     * Endpoint de prueba para crear múltiples registros de historial
     */
    @PostMapping("/test-registro")
    public ResponseEntity<?> testRegistro() {
        try {
            Long empresaId = obtenerEmpresaIdDelUsuarioAutenticado();
            Long usuarioId = obtenerUsuarioIdDelUsuarioAutenticado();
            
            System.out.println("=== CREANDO OPERACIONES DE PRUEBA ===");
            System.out.println("Empresa ID: " + empresaId);
            System.out.println("Usuario ID: " + usuarioId);
            
            // Crear múltiples operaciones de prueba
            List<InventarioRequestDTO> operacionesPrueba = new ArrayList<>();
            
            // Operación 1: Incremento
            InventarioRequestDTO op1 = new InventarioRequestDTO();
            op1.setProductoId(1L);
            op1.setTipoOperacion("INCREMENTO");
            op1.setCantidad(10);
            op1.setPrecioUnitario(new BigDecimal("29.99"));
            op1.setObservacion("Compra de stock inicial");
            op1.setCodigoBarras("123456789");
            op1.setMetodoEntrada("manual");
            operacionesPrueba.add(op1);
            
            // Operación 2: Decremento
            InventarioRequestDTO op2 = new InventarioRequestDTO();
            op2.setProductoId(2L);
            op2.setTipoOperacion("DECREMENTO");
            op2.setCantidad(5);
            op2.setPrecioUnitario(new BigDecimal("79.99"));
            op2.setObservacion("Venta a cliente");
            op2.setCodigoBarras("987654321");
            op2.setMetodoEntrada("manual");
            operacionesPrueba.add(op2);
            
            // Operación 3: Ajuste
            InventarioRequestDTO op3 = new InventarioRequestDTO();
            op3.setProductoId(3L);
            op3.setTipoOperacion("AJUSTE");
            op3.setCantidad(15);
            op3.setStockNuevo(15);
            op3.setPrecioUnitario(new BigDecimal("199.99"));
            op3.setObservacion("Ajuste de inventario físico");
            op3.setCodigoBarras("456789123");
            op3.setMetodoEntrada("manual");
            operacionesPrueba.add(op3);
            
            // Operación 4: Incremento adicional
            InventarioRequestDTO op4 = new InventarioRequestDTO();
            op4.setProductoId(1L);
            op4.setTipoOperacion("INCREMENTO");
            op4.setCantidad(20);
            op4.setPrecioUnitario(new BigDecimal("29.99"));
            op4.setObservacion("Reposición de stock");
            op4.setCodigoBarras("123456789");
            op4.setMetodoEntrada("manual");
            operacionesPrueba.add(op4);
            
            // Operación 5: Decremento adicional
            InventarioRequestDTO op5 = new InventarioRequestDTO();
            op5.setProductoId(4L);
            op5.setTipoOperacion("DECREMENTO");
            op5.setCantidad(3);
            op5.setPrecioUnitario(new BigDecimal("199.99"));
            op5.setObservacion("Venta de monitor");
            op5.setCodigoBarras("789123456");
            op5.setMetodoEntrada("manual");
            operacionesPrueba.add(op5);
            
            // Operación 6: Inventario físico
            InventarioRequestDTO op6 = new InventarioRequestDTO();
            op6.setProductoId(5L);
            op6.setTipoOperacion("INVENTARIO_FISICO");
            op6.setCantidad(8);
            op6.setStockNuevo(8);
            op6.setPrecioUnitario(new BigDecimal("299.99"));
            op6.setObservacion("Conteo físico");
            op6.setCodigoBarras("321654987");
            op6.setMetodoEntrada("manual");
            operacionesPrueba.add(op6);
            
            List<HistorialInventarioDTO> operacionesCreadas = new ArrayList<>();
            
            for (InventarioRequestDTO operacion : operacionesPrueba) {
                ApiResponse<HistorialInventarioDTO> response = historialInventarioService
                        .registrarOperacionInventario(operacion, usuarioId, empresaId);
                
                if (response.isSuccess()) {
                    operacionesCreadas.add(response.getData());
                    System.out.println("✅ Operación creada: " + operacion.getTipoOperacion() + " - " + operacion.getCantidad() + " unidades");
                } else {
                    System.out.println("❌ Error al crear operación: " + response.getMensaje());
                }
            }
            
            System.out.println("Total operaciones creadas: " + operacionesCreadas.size());
            System.out.println("=== FIN CREANDO OPERACIONES DE PRUEBA ===");
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Operaciones de prueba creadas",
                "operacionesCreadas", operacionesCreadas.size(),
                "detalles", operacionesCreadas
            ));
            
        } catch (Exception e) {
            System.err.println("Error en test-registro: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Error al crear operaciones de prueba: " + e.getMessage()));
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
    
    /**
     * Endpoint para probar la consulta SQL de estadísticas directamente
     */
    @GetMapping("/test-sql-estadisticas")
    public ResponseEntity<?> testSqlEstadisticas() {
        try {
            Long empresaId = obtenerEmpresaIdDelUsuarioAutenticado();
            System.out.println("=== TEST SQL ESTADÍSTICAS ===");
            System.out.println("Empresa ID: " + empresaId);
            
            // Obtener todos los registros
            List<HistorialInventario> todos = historialInventarioRepository.findAll();
            System.out.println("Total registros: " + todos.size());
            
            // Filtrar por empresa
            List<HistorialInventario> deEstaEmpresa = todos.stream()
                .filter(h -> h.getEmpresa() != null && h.getEmpresa().getId().equals(empresaId))
                .collect(java.util.stream.Collectors.toList());
            System.out.println("Registros de empresa " + empresaId + ": " + deEstaEmpresa.size());
            
            // Contar por tipo de operación manualmente
            long totalIncrementos = deEstaEmpresa.stream()
                .filter(h -> "INCREMENTO".equals(h.getTipoOperacion().name()))
                .count();
            long totalDecrementos = deEstaEmpresa.stream()
                .filter(h -> "DECREMENTO".equals(h.getTipoOperacion().name()))
                .count();
            long totalAjustes = deEstaEmpresa.stream()
                .filter(h -> "AJUSTE".equals(h.getTipoOperacion().name()))
                .count();
            
            System.out.println("Conteo manual:");
            System.out.println("  Total: " + deEstaEmpresa.size());
            System.out.println("  Incrementos: " + totalIncrementos);
            System.out.println("  Decrementos: " + totalDecrementos);
            System.out.println("  Ajustes: " + totalAjustes);
            
            // Ejecutar la consulta SQL
            Object[] estadisticas = historialInventarioRepository.getEstadisticasByEmpresaId(empresaId);
            System.out.println("Resultado SQL:");
            if (estadisticas != null) {
                for (int i = 0; i < estadisticas.length; i++) {
                    System.out.println("  [" + i + "]: " + estadisticas[i]);
                }
            }
            
            System.out.println("=== FIN TEST SQL ESTADÍSTICAS ===");
            
            return ResponseEntity.ok(Map.of(
                "empresaId", empresaId,
                "totalRegistros", todos.size(),
                "registrosEmpresa", deEstaEmpresa.size(),
                "conteoManual", Map.of(
                    "total", deEstaEmpresa.size(),
                    "incrementos", totalIncrementos,
                    "decrementos", totalDecrementos,
                    "ajustes", totalAjustes
                ),
                "resultadoSQL", estadisticas != null ? Arrays.asList(estadisticas) : null
            ));
            
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
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