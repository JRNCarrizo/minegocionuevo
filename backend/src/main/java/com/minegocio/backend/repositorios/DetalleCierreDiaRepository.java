package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.DetalleCierreDia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DetalleCierreDiaRepository extends JpaRepository<DetalleCierreDia, Long> {
    
    // Buscar detalles por cierre de día
    List<DetalleCierreDia> findByCierreDiaIdOrderByFechaCreacionAsc(Long cierreDiaId);
    
    // Buscar detalles por cierre de día y tipo de movimiento
    List<DetalleCierreDia> findByCierreDiaIdAndTipoMovimientoOrderByFechaCreacionAsc(Long cierreDiaId, DetalleCierreDia.TipoMovimiento tipoMovimiento);
    
    // Buscar detalles por empresa y tipo de movimiento
    @Query("SELECT d FROM DetalleCierreDia d JOIN d.cierreDia c WHERE c.empresaId = :empresaId AND d.tipoMovimiento = :tipoMovimiento ORDER BY c.fecha DESC, d.fechaCreacion ASC")
    List<DetalleCierreDia> findByEmpresaIdAndTipoMovimiento(@Param("empresaId") Long empresaId, 
                                                           @Param("tipoMovimiento") DetalleCierreDia.TipoMovimiento tipoMovimiento);
    
    // Eliminar detalles por cierre de día
    void deleteByCierreDiaId(Long cierreDiaId);
    
    // Contar detalles por cierre de día y tipo
    long countByCierreDiaIdAndTipoMovimiento(Long cierreDiaId, DetalleCierreDia.TipoMovimiento tipoMovimiento);
}
