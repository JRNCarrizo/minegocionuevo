package com.minegocio.backend.controladores;

import com.minegocio.backend.dto.HistorialCargaProductosDTO;
import com.minegocio.backend.entidades.HistorialCargaProductos;
import com.minegocio.backend.servicios.HistorialCargaProductosService;
import com.minegocio.backend.utils.ApiResponse;
import com.minegocio.backend.repositorios.HistorialCargaProductosRepository;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.ProductoRepository;
import com.minegocio.backend.repositorios.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/historial-carga-productos")
@CrossOrigin(origins = "*")
public class HistorialCargaProductosController {
    
    @Autowired
    private HistorialCargaProductosService historialService;
    
    @Autowired
    private HistorialCargaProductosRepository historialRepository;
    
    @Autowired
    private EmpresaRepository empresaRepository;
    
    @Autowired
    private ProductoRepository productoRepository;
    
    @Autowired
    private UsuarioRepository usuarioRepository;
    
    // Registrar una nueva operación de carga
    @PostMapping("/registrar")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<HistorialCargaProductosDTO>> registrarOperacion(
            @RequestParam Long empresaId,
            @RequestParam Long productoId,
            @RequestParam Long usuarioId,
            @RequestParam HistorialCargaProductos.TipoOperacion tipoOperacion,
            @RequestParam Integer cantidad,
            @RequestParam BigDecimal precioUnitario,
            @RequestParam(required = false) String observacion,
            @RequestParam(required = false) String metodoEntrada,
            @RequestParam(required = false) String codigoBarras) {
        
        ApiResponse<HistorialCargaProductosDTO> response = historialService.registrarOperacion(
                empresaId, productoId, usuarioId, tipoOperacion, cantidad, 
                precioUnitario, observacion, metodoEntrada, codigoBarras);
        
        return ResponseEntity.ok(response);
    }
    
    // Obtener historial paginado por empresa
    @GetMapping("/empresa/{empresaId}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<Page<HistorialCargaProductosDTO>>> obtenerHistorialPorEmpresa(
            @PathVariable Long empresaId,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamanio) {
        
        ApiResponse<Page<HistorialCargaProductosDTO>> response = historialService
                .obtenerHistorialPorEmpresa(empresaId, pagina, tamanio);
        
        return ResponseEntity.ok(response);
    }
    
    // Búsqueda avanzada con filtros - Estructura compatible con frontend
    @GetMapping("/buscar")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Map<String, Object>> buscarConFiltros(
            @RequestParam Long empresaId,
            @RequestParam(required = false) Long productoId,
            @RequestParam(required = false) HistorialCargaProductos.TipoOperacion tipoOperacion,
            @RequestParam(required = false) Long usuarioId,
            @RequestParam(required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaInicio,
            @RequestParam(required = false) 
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaFin,
            @RequestParam(required = false) String codigoBarras,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamanio) {
        
        System.out.println("=== DEBUG HISTORIAL CARGA PRODUCTOS ===");
        System.out.println("EmpresaId: " + empresaId);
        System.out.println("ProductoId: " + productoId);
        System.out.println("TipoOperacion: " + tipoOperacion);
        System.out.println("UsuarioId: " + usuarioId);
        System.out.println("FechaInicio: " + fechaInicio);
        System.out.println("FechaFin: " + fechaFin);
        System.out.println("CodigoBarras: " + codigoBarras);
        System.out.println("Pagina: " + pagina);
        System.out.println("Tamanio: " + tamanio);
        
        ApiResponse<Page<HistorialCargaProductosDTO>> response = historialService.buscarConFiltros(
                empresaId, productoId, tipoOperacion, usuarioId, 
                fechaInicio, fechaFin, codigoBarras, pagina, tamanio);
        
        System.out.println("Respuesta del servicio:");
        System.out.println("  - Success: " + response.isSuccess());
        System.out.println("  - Mensaje: " + response.getMensaje());
        System.out.println("  - Data: " + (response.getData() != null ? "No null" : "null"));
        
        if (response.isSuccess() && response.getData() != null) {
            Page<HistorialCargaProductosDTO> page = response.getData();
            
            System.out.println("Datos de la página:");
            System.out.println("  - Total elementos: " + page.getTotalElements());
            System.out.println("  - Total páginas: " + page.getTotalPages());
            System.out.println("  - Página actual: " + page.getNumber());
            System.out.println("  - Tamaño: " + page.getSize());
            System.out.println("  - Contenido: " + page.getContent().size() + " elementos");
            
            // Crear la estructura que espera el frontend
            Map<String, Object> resultado = new HashMap<>();
            resultado.put("contenido", page.getContent());
            resultado.put("totalElementos", page.getTotalElements());
            resultado.put("totalPaginas", page.getTotalPages());
            resultado.put("paginaActual", page.getNumber());
            resultado.put("tamano", page.getSize());
            
            System.out.println("Resultado final enviado al frontend:");
            System.out.println("  - contenido: " + page.getContent().size() + " elementos");
            System.out.println("  - totalElementos: " + page.getTotalElements());
            System.out.println("  - totalPaginas: " + page.getTotalPages());
            System.out.println("=== FIN DEBUG HISTORIAL CARGA PRODUCTOS ===");
            
            return ResponseEntity.ok(resultado);
        } else {
            System.out.println("Error en la respuesta del servicio");
            System.out.println("=== FIN DEBUG HISTORIAL CARGA PRODUCTOS ===");
            
            // Si hay error, devolver estructura vacía
            Map<String, Object> resultado = new HashMap<>();
            resultado.put("contenido", new ArrayList<>());
            resultado.put("totalElementos", 0L);
            resultado.put("totalPaginas", 0);
            resultado.put("paginaActual", 0);
            resultado.put("tamano", tamanio);
            
            return ResponseEntity.ok(resultado);
        }
    }
    
    // Obtener estadísticas por empresa
    @GetMapping("/estadisticas/{empresaId}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> obtenerEstadisticasPorEmpresa(
            @PathVariable Long empresaId) {
        
        ApiResponse<Map<String, Object>> response = historialService
                .obtenerEstadisticasPorEmpresa(empresaId);
        
        return ResponseEntity.ok(response);
    }
    
    // Obtener historial por producto específico
    @GetMapping("/producto/{productoId}/empresa/{empresaId}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<Page<HistorialCargaProductosDTO>>> obtenerHistorialPorProducto(
            @PathVariable Long empresaId,
            @PathVariable Long productoId,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamanio) {
        
        ApiResponse<Page<HistorialCargaProductosDTO>> response = historialService
                .obtenerHistorialPorProducto(empresaId, productoId, pagina, tamanio);
        
        return ResponseEntity.ok(response);
    }
    
    // Buscar por código de barras
    @GetMapping("/codigo-barras/{codigoBarras}/empresa/{empresaId}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<List<HistorialCargaProductosDTO>>> buscarPorCodigoBarras(
            @PathVariable Long empresaId,
            @PathVariable String codigoBarras) {
        
        ApiResponse<List<HistorialCargaProductosDTO>> response = historialService
                .buscarPorCodigoBarras(empresaId, codigoBarras);
        
        return ResponseEntity.ok(response);
    }
    
    // Obtener operación específica por ID
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<HistorialCargaProductosDTO>> obtenerOperacionPorId(
            @PathVariable Long id) {
        
        ApiResponse<HistorialCargaProductosDTO> response = historialService
                .obtenerOperacionPorId(id);
        
        return ResponseEntity.ok(response);
    }
    
    // Obtener tipos de operación disponibles
    @GetMapping("/tipos-operacion")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<HistorialCargaProductos.TipoOperacion[]>> obtenerTiposOperacion() {
        
        HistorialCargaProductos.TipoOperacion[] tipos = HistorialCargaProductos.TipoOperacion.values();
        
        ApiResponse<HistorialCargaProductos.TipoOperacion[]> response = new ApiResponse<>(
                true, "Tipos de operación obtenidos correctamente", tipos);
        
        return ResponseEntity.ok(response);
    }
    
    // Endpoint para obtener historial por rango de fechas
    @GetMapping("/fechas/empresa/{empresaId}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<Page<HistorialCargaProductosDTO>>> obtenerHistorialPorFechas(
            @PathVariable Long empresaId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fechaFin,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamanio) {
        
        ApiResponse<Page<HistorialCargaProductosDTO>> response = historialService.buscarConFiltros(
                empresaId, null, null, null, fechaInicio, fechaFin, null, pagina, tamanio);
        
        return ResponseEntity.ok(response);
    }
    
    // Endpoint para obtener historial por tipo de operación
    @GetMapping("/tipo/{tipoOperacion}/empresa/{empresaId}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<ApiResponse<Page<HistorialCargaProductosDTO>>> obtenerHistorialPorTipo(
            @PathVariable Long empresaId,
            @PathVariable HistorialCargaProductos.TipoOperacion tipoOperacion,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamanio) {
        
        ApiResponse<Page<HistorialCargaProductosDTO>> response = historialService.buscarConFiltros(
                empresaId, null, tipoOperacion, null, null, null, null, pagina, tamanio);
        
        return ResponseEntity.ok(response);
    }
    
    // Endpoint de debug para verificar datos
    @GetMapping("/debug/{empresaId}")
    @PreAuthorize("hasRole('ADMINISTRADOR')")
    public ResponseEntity<Map<String, Object>> debugHistorial(@PathVariable Long empresaId) {
        System.out.println("=== DEBUG HISTORIAL CARGA PRODUCTOS - ENDPOINT DEBUG ===");
        System.out.println("EmpresaId: " + empresaId);
        
        Map<String, Object> debugInfo = new HashMap<>();
        
        try {
            // Verificar si la empresa existe
            boolean empresaExiste = empresaRepository.existsById(empresaId);
            debugInfo.put("empresaExiste", empresaExiste);
            System.out.println("Empresa existe: " + empresaExiste);
            
            // Contar total de registros en historial
            long totalRegistros = historialRepository.count();
            debugInfo.put("totalRegistrosHistorial", totalRegistros);
            System.out.println("Total registros en historial: " + totalRegistros);
            
            // Contar registros por empresa
            long registrosPorEmpresa = historialRepository.countByEmpresaId(empresaId);
            debugInfo.put("registrosPorEmpresa", registrosPorEmpresa);
            System.out.println("Registros por empresa: " + registrosPorEmpresa);
            
            // Verificar si hay productos en la empresa
            long productosEnEmpresa = productoRepository.count();
            debugInfo.put("productosEnEmpresa", productosEnEmpresa);
            System.out.println("Productos en empresa: " + productosEnEmpresa);
            
            // Verificar si hay usuarios en la empresa
            long usuariosEnEmpresa = usuarioRepository.count();
            debugInfo.put("usuariosEnEmpresa", usuariosEnEmpresa);
            System.out.println("Usuarios en empresa: " + usuariosEnEmpresa);
            
            System.out.println("=== FIN DEBUG HISTORIAL CARGA PRODUCTOS ===");
            
            return ResponseEntity.ok(debugInfo);
            
        } catch (Exception e) {
            System.err.println("Error en debug: " + e.getMessage());
            e.printStackTrace();
            debugInfo.put("error", e.getMessage());
            return ResponseEntity.ok(debugInfo);
        }
    }
} 