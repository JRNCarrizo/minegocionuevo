package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.HistorialMovimientoStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface HistorialMovimientoStockRepository extends JpaRepository<HistorialMovimientoStock, Long> {
    
    // Buscar movimientos por empresa
    List<HistorialMovimientoStock> findByEmpresaIdOrderByFechaMovimientoDesc(Long empresaId);
    
    // Buscar movimientos por sector
    @Query("SELECT h FROM HistorialMovimientoStock h WHERE " +
           "h.empresa.id = :empresaId AND " +
           "(h.sectorOrigen.id = :sectorId OR h.sectorDestino.id = :sectorId) " +
           "ORDER BY h.fechaMovimiento DESC")
    List<HistorialMovimientoStock> findByEmpresaIdAndSectorIdOrderByFechaMovimientoDesc(
            @Param("empresaId") Long empresaId, 
            @Param("sectorId") Long sectorId);
    
    // Buscar movimientos por producto
    List<HistorialMovimientoStock> findByEmpresaIdAndProductoIdOrderByFechaMovimientoDesc(Long empresaId, Long productoId);
    
    // Buscar movimientos por rango de fechas
    List<HistorialMovimientoStock> findByEmpresaIdAndFechaMovimientoBetweenOrderByFechaMovimientoDesc(
            Long empresaId, LocalDateTime fechaInicio, LocalDateTime fechaFin);
    
    // Buscar movimientos por tipo
    List<HistorialMovimientoStock> findByEmpresaIdAndTipoMovimientoOrderByFechaMovimientoDesc(
            Long empresaId, HistorialMovimientoStock.TipoMovimiento tipoMovimiento);
    
    // Buscar movimientos del día actual
    @Query("SELECT h FROM HistorialMovimientoStock h WHERE " +
           "h.empresa.id = :empresaId AND " +
           "h.fechaMovimiento >= :fechaInicio AND h.fechaMovimiento < :fechaFin " +
           "ORDER BY h.fechaMovimiento DESC")
    List<HistorialMovimientoStock> findByEmpresaIdAndFechaMovimientoDateOrderByFechaMovimientoDesc(
            @Param("empresaId") Long empresaId, 
            @Param("fechaInicio") LocalDateTime fechaInicio,
            @Param("fechaFin") LocalDateTime fechaFin);
    
    // Contar movimientos por día
    @Query("SELECT CAST(h.fechaMovimiento AS date) as fecha, COUNT(h) as cantidad " +
           "FROM HistorialMovimientoStock h " +
           "WHERE h.empresa.id = :empresaId " +
           "AND h.fechaMovimiento >= :fechaInicio " +
           "GROUP BY CAST(h.fechaMovimiento AS date) " +
           "ORDER BY fecha DESC")
    List<Object[]> countMovimientosPorDia(@Param("empresaId") Long empresaId, @Param("fechaInicio") LocalDateTime fechaInicio);
}
