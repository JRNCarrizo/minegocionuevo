package com.minegocio.backend.controladores;

import com.minegocio.backend.dto.RoturaPerdidaDTO;
import com.minegocio.backend.dto.RoturaPerdidaResponseDTO;
import com.minegocio.backend.entidades.RoturaPerdida;
import com.minegocio.backend.seguridad.UsuarioPrincipal;
import com.minegocio.backend.servicios.RoturaPerdidaService;
import com.minegocio.backend.utils.ApiResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/roturas-perdidas")
@CrossOrigin(origins = "*")
public class RoturaPerdidaController {

    @Autowired
    private RoturaPerdidaService roturaPerdidaService;

    /**
     * Crear una nueva rotura o pérdida
     */
    @PostMapping
    public ResponseEntity<ApiResponse<RoturaPerdida>> crearRoturaPerdida(
            @Valid @RequestBody RoturaPerdidaDTO dto,
            Authentication authentication) {
        
        try {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long empresaId = usuarioPrincipal.getEmpresaId();
            Long usuarioId = usuarioPrincipal.getId();
            
            System.out.println("💔 Creando rotura/pérdida para empresa ID: " + empresaId + ", usuario ID: " + usuarioId);
            System.out.println("💔 Datos: fecha=" + dto.getFecha() + ", cantidad=" + dto.getCantidad());
            
            RoturaPerdida roturaPerdida = roturaPerdidaService.crearRoturaPerdida(dto, empresaId, usuarioId);
            
            System.out.println("✅ Rotura/Pérdida creada con ID: " + roturaPerdida.getId());
            
            return ResponseEntity.ok(ApiResponse.success("Rotura/Pérdida registrada exitosamente", roturaPerdida));
        } catch (Exception e) {
            System.out.println("❌ Error al crear rotura/pérdida: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Error al registrar la rotura/pérdida: " + e.getMessage()));
        }
    }

    /**
     * Obtener todas las roturas y pérdidas de la empresa del usuario autenticado
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<RoturaPerdidaResponseDTO>>> obtenerRoturasPerdidas(Authentication authentication) {
        try {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long empresaId = usuarioPrincipal.getEmpresaId();
            
            System.out.println("🔍 Buscando roturas y pérdidas para empresa ID: " + empresaId);

            List<RoturaPerdidaResponseDTO> roturasPerdidas = roturaPerdidaService.obtenerRoturasPerdidasPorEmpresa(empresaId);
            
            System.out.println("📦 Roturas y pérdidas encontradas: " + roturasPerdidas.size());
            
            return ResponseEntity.ok(ApiResponse.success("Roturas y pérdidas obtenidas exitosamente", roturasPerdidas));
        } catch (Exception e) {
            System.out.println("❌ Error al obtener roturas y pérdidas: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Error al obtener las roturas y pérdidas: " + e.getMessage()));
        }
    }

    /**
     * Obtener roturas y pérdidas por fecha
     */
    @GetMapping("/fecha/{fecha}")
    public ResponseEntity<ApiResponse<List<RoturaPerdidaResponseDTO>>> obtenerRoturasPerdidasPorFecha(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
            Authentication authentication) {
        
        try {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long empresaId = usuarioPrincipal.getEmpresaId();

            List<RoturaPerdidaResponseDTO> roturasPerdidas = roturaPerdidaService.obtenerRoturasPerdidasPorEmpresaYFecha(empresaId, fecha);
            
            return ResponseEntity.ok(ApiResponse.success("Roturas y pérdidas obtenidas exitosamente", roturasPerdidas));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Error al obtener las roturas y pérdidas: " + e.getMessage()));
        }
    }

    /**
     * Obtener roturas y pérdidas por rango de fechas
     */
    @GetMapping("/rango-fechas")
    public ResponseEntity<ApiResponse<List<RoturaPerdidaResponseDTO>>> obtenerRoturasPerdidasPorRangoFechas(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin,
            Authentication authentication) {
        
        try {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long empresaId = usuarioPrincipal.getEmpresaId();

            List<RoturaPerdidaResponseDTO> roturasPerdidas = roturaPerdidaService.obtenerRoturasPerdidasPorEmpresaYRangoFechas(empresaId, fechaInicio, fechaFin);
            
            return ResponseEntity.ok(ApiResponse.success("Roturas y pérdidas obtenidas exitosamente", roturasPerdidas));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Error al obtener las roturas y pérdidas: " + e.getMessage()));
        }
    }

    /**
     * Obtener rotura/pérdida por ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RoturaPerdida>> obtenerRoturaPerdidaPorId(@PathVariable Long id) {
        try {
            Optional<RoturaPerdida> roturaPerdida = roturaPerdidaService.obtenerRoturaPerdidaPorId(id);
            
            if (roturaPerdida.isPresent()) {
                return ResponseEntity.ok(ApiResponse.success("Rotura/Pérdida obtenida exitosamente", roturaPerdida.get()));
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Error al obtener la rotura/pérdida: " + e.getMessage()));
        }
    }

    /**
     * Actualizar rotura/pérdida
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<RoturaPerdida>> actualizarRoturaPerdida(
            @PathVariable Long id,
            @Valid @RequestBody RoturaPerdidaDTO dto) {
        
        try {
            RoturaPerdida roturaPerdida = roturaPerdidaService.actualizarRoturaPerdida(id, dto);
            
            return ResponseEntity.ok(ApiResponse.success("Rotura/Pérdida actualizada exitosamente", roturaPerdida));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Error al actualizar la rotura/pérdida: " + e.getMessage()));
        }
    }

    /**
     * Eliminar rotura/pérdida
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> eliminarRoturaPerdida(@PathVariable Long id) {
        try {
            roturaPerdidaService.eliminarRoturaPerdida(id);
            
            return ResponseEntity.ok(ApiResponse.success("Rotura/Pérdida eliminada exitosamente", "Rotura/Pérdida eliminada"));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Error al eliminar la rotura/pérdida: " + e.getMessage()));
        }
    }

    /**
     * Obtener estadísticas de roturas y pérdidas
     */
    @GetMapping("/estadisticas")
    public ResponseEntity<ApiResponse<Map<String, Object>>> obtenerEstadisticas(Authentication authentication) {
        try {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long empresaId = usuarioPrincipal.getEmpresaId();

            long totalRoturasPerdidas = roturaPerdidaService.contarRoturasPerdidasPorEmpresa(empresaId);
            long roturasPerdidasHoy = roturaPerdidaService.contarRoturasPerdidasPorEmpresaYFecha(empresaId, LocalDate.now());
            Integer totalUnidadesHoy = roturaPerdidaService.obtenerTotalUnidadesPerdidasPorEmpresaYFecha(empresaId, LocalDate.now());

            Map<String, Object> estadisticas = new HashMap<>();
            estadisticas.put("totalRoturasPerdidas", totalRoturasPerdidas);
            estadisticas.put("roturasPerdidasHoy", roturasPerdidasHoy);
            estadisticas.put("totalUnidadesHoy", totalUnidadesHoy != null ? totalUnidadesHoy : 0);

            return ResponseEntity.ok(ApiResponse.success("Estadísticas obtenidas exitosamente", estadisticas));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Error al obtener las estadísticas: " + e.getMessage()));
        }
    }

    /**
     * Exportar roturas y pérdidas a Excel
     */
    @GetMapping("/exportar")
    public ResponseEntity<byte[]> exportarRoturasPerdidas(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaInicio,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fechaFin,
            Authentication authentication) {
        try {
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long empresaId = usuarioPrincipal.getEmpresaId();
            
            System.out.println("📊 [EXPORTAR] Exportando roturas y pérdidas para empresa ID: " + empresaId);
            System.out.println("📊 [EXPORTAR] Rango de fechas: " + fechaInicio + " a " + fechaFin);
            
            byte[] excelBytes = roturaPerdidaService.exportarRoturasPerdidasAExcel(empresaId, fechaInicio, fechaFin);
            
            System.out.println("✅ [EXPORTAR] Reporte exportado exitosamente. Tamaño: " + excelBytes.length + " bytes");
            
            return ResponseEntity.ok()
                    .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
                    .header("Content-Disposition", "attachment; filename=\"Roturas_Perdidas_" + fechaInicio + "_" + fechaFin + ".xlsx\"")
                    .body(excelBytes);
        } catch (Exception e) {
            System.out.println("❌ [EXPORTAR] Error al exportar roturas y pérdidas: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }
}
