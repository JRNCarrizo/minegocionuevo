package com.minegocio.backend.servicios;

import com.minegocio.backend.dto.HistorialMovimientoStockResponseDTO;
import com.minegocio.backend.entidades.*;
import com.minegocio.backend.repositorios.HistorialMovimientoStockRepository;
import com.minegocio.backend.repositorios.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class HistorialMovimientoStockService {
    
    @Autowired
    private HistorialMovimientoStockRepository historialRepository;
    
    @Autowired
    private UsuarioRepository usuarioRepository;
    
    /**
     * Registrar un movimiento en el historial
     */
    public void registrarMovimiento(Producto producto, Sector sectorOrigen, Sector sectorDestino,
                                  Integer cantidad, HistorialMovimientoStock.TipoMovimiento tipoMovimiento,
                                  Usuario usuario, Empresa empresa, String observaciones) {
        
        try {
            HistorialMovimientoStock movimiento = new HistorialMovimientoStock(
                producto, sectorOrigen, sectorDestino, cantidad, tipoMovimiento, 
                usuario, empresa, observaciones
            );
            
            historialRepository.save(movimiento);
            System.out.println("📝 Historial de Movimiento registrado: " + tipoMovimiento + 
                             " - Producto: " + producto.getNombre() + " - Cantidad: " + cantidad);
        } catch (Exception e) {
            System.err.println("⚠️ Error al registrar historial de movimiento: " + e.getMessage());
            // No lanzar la excepción para no afectar la operación principal
        }
    }
    
    /**
     * Obtener historial por empresa
     */
    public List<HistorialMovimientoStockResponseDTO> obtenerHistorialPorEmpresa(Long empresaId) {
        List<HistorialMovimientoStock> movimientos = historialRepository
            .findByEmpresaIdOrderByFechaMovimientoDesc(empresaId);
        
        return convertirADTO(movimientos);
    }
    
    /**
     * Obtener historial por sector
     */
    public List<HistorialMovimientoStockResponseDTO> obtenerHistorialPorSector(Long empresaId, Long sectorId) {
        System.out.println("🔍 HISTORIAL SERVICE - Buscando movimientos para empresa: " + empresaId + ", sector: " + sectorId);
        
        try {
            List<HistorialMovimientoStock> movimientos = historialRepository
                .findByEmpresaIdAndSectorIdOrderByFechaMovimientoDesc(empresaId, sectorId);
            
            System.out.println("🔍 HISTORIAL SERVICE - Movimientos encontrados en BD: " + movimientos.size());
            
            List<HistorialMovimientoStockResponseDTO> resultado = convertirADTO(movimientos);
            System.out.println("🔍 HISTORIAL SERVICE - DTOs convertidos: " + resultado.size());
            
            return resultado;
        } catch (Exception e) {
            System.err.println("🔍 HISTORIAL SERVICE - Error al obtener historial: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    /**
     * Obtener historial por producto
     */
    public List<HistorialMovimientoStockResponseDTO> obtenerHistorialPorProducto(Long empresaId, Long productoId) {
        List<HistorialMovimientoStock> movimientos = historialRepository
            .findByEmpresaIdAndProductoIdOrderByFechaMovimientoDesc(empresaId, productoId);
        
        return convertirADTO(movimientos);
    }
    
    /**
     * Obtener movimientos del día actual
     */
    public List<HistorialMovimientoStockResponseDTO> obtenerMovimientosDelDia(Long empresaId) {
        LocalDate hoy = LocalDate.now();
        LocalDateTime inicioDelDia = hoy.atStartOfDay();
        LocalDateTime finDelDia = hoy.plusDays(1).atStartOfDay();
        
        List<HistorialMovimientoStock> movimientos = historialRepository
            .findByEmpresaIdAndFechaMovimientoDateOrderByFechaMovimientoDesc(empresaId, inicioDelDia, finDelDia);
        
        return convertirADTO(movimientos);
    }
    
    /**
     * Obtener movimientos por rango de fechas
     */
    public List<HistorialMovimientoStockResponseDTO> obtenerMovimientosPorRangoFechas(
            Long empresaId, LocalDate fechaInicio, LocalDate fechaFin) {
        
        LocalDateTime inicio = fechaInicio.atStartOfDay();
        LocalDateTime fin = fechaFin.atTime(23, 59, 59);
        
        List<HistorialMovimientoStock> movimientos = historialRepository
            .findByEmpresaIdAndFechaMovimientoBetweenOrderByFechaMovimientoDesc(empresaId, inicio, fin);
        
        return convertirADTO(movimientos);
    }
    
    /**
     * Obtener resumen de movimientos por día
     */
    public List<Map<String, Object>> obtenerResumenMovimientosPorDia(Long empresaId, int diasAtras) {
        LocalDateTime fechaInicio = LocalDateTime.now().minusDays(diasAtras);
        
        List<Object[]> resultados = historialRepository.countMovimientosPorDia(empresaId, fechaInicio);
        
        return resultados.stream()
            .map(resultado -> Map.of(
                "fecha", resultado[0],
                "cantidad", resultado[1]
            ))
            .collect(Collectors.toList());
    }
    
    /**
     * Obtener estadísticas de movimientos
     */
    public Map<String, Object> obtenerEstadisticasMovimientos(Long empresaId, int diasAtras) {
        LocalDateTime fechaInicio = LocalDateTime.now().minusDays(diasAtras);
        LocalDateTime fechaFin = LocalDateTime.now();
        
        List<HistorialMovimientoStock> movimientos = historialRepository
            .findByEmpresaIdAndFechaMovimientoBetweenOrderByFechaMovimientoDesc(empresaId, fechaInicio, fechaFin);
        
        long totalMovimientos = movimientos.size();
        long transferencias = movimientos.stream()
            .filter(m -> m.getTipoMovimiento() == HistorialMovimientoStock.TipoMovimiento.TRANSFERENCIA)
            .count();
        long recepciones = movimientos.stream()
            .filter(m -> m.getTipoMovimiento() == HistorialMovimientoStock.TipoMovimiento.RECEPCION)
            .count();
        long asignaciones = movimientos.stream()
            .filter(m -> m.getTipoMovimiento() == HistorialMovimientoStock.TipoMovimiento.ASIGNACION)
            .count();
        long remociones = movimientos.stream()
            .filter(m -> m.getTipoMovimiento() == HistorialMovimientoStock.TipoMovimiento.REMOCION)
            .count();
        
        return Map.of(
            "totalMovimientos", totalMovimientos,
            "transferencias", transferencias,
            "recepciones", recepciones,
            "asignaciones", asignaciones,
            "remociones", remociones,
            "periodoDias", diasAtras
        );
    }
    
    /**
     * Convertir entidades a DTOs
     */
    private List<HistorialMovimientoStockResponseDTO> convertirADTO(List<HistorialMovimientoStock> movimientos) {
        return movimientos.stream()
            .map(this::convertirADTO)
            .collect(Collectors.toList());
    }
    
    private HistorialMovimientoStockResponseDTO convertirADTO(HistorialMovimientoStock movimiento) {
        try {
            System.out.println("🔍 CONVERTIR DTO - Convirtiendo movimiento ID: " + movimiento.getId());
            
            return new HistorialMovimientoStockResponseDTO(
                movimiento.getId(),
                movimiento.getProducto().getId(),
                movimiento.getProducto().getNombre(),
                movimiento.getProducto().getCodigoPersonalizado(),
                movimiento.getSectorOrigen() != null ? movimiento.getSectorOrigen().getId() : null,
                movimiento.getSectorOrigen() != null ? movimiento.getSectorOrigen().getNombre() : null,
                movimiento.getSectorDestino() != null ? movimiento.getSectorDestino().getId() : null,
                movimiento.getSectorDestino() != null ? movimiento.getSectorDestino().getNombre() : null,
                movimiento.getCantidad(),
                movimiento.getTipoMovimiento().name(),
                obtenerDescripcionTipoMovimiento(movimiento.getTipoMovimiento()),
                movimiento.getUsuario() != null ? movimiento.getUsuario().getId() : null,
                movimiento.getUsuario() != null ? movimiento.getUsuario().getNombreCompleto() : null,
                movimiento.getFechaMovimiento(),
                movimiento.getObservaciones()
            );
        } catch (Exception e) {
            System.err.println("🔍 CONVERTIR DTO - Error al convertir movimiento ID " + movimiento.getId() + ": " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
    }
    
    private String obtenerDescripcionTipoMovimiento(HistorialMovimientoStock.TipoMovimiento tipo) {
        switch (tipo) {
            case TRANSFERENCIA:
                return "Transferencia entre sectores";
            case RECEPCION:
                return "Recepción de stock";
            case ASIGNACION:
                return "Asignación desde stock general";
            case REMOCION:
                return "Remoción de producto";
            default:
                return tipo.name();
        }
    }
}
