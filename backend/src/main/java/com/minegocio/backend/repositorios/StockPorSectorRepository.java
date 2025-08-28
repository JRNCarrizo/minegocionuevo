package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.StockPorSector;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StockPorSectorRepository extends JpaRepository<StockPorSector, Long> {
    
    /**
     * Obtiene el stock de un producto en un sector específico
     */
    Optional<StockPorSector> findByProductoIdAndSectorId(Long productoId, Long sectorId);
    
    /**
     * Obtiene todos los stocks de un producto
     */
    List<StockPorSector> findByProductoId(Long productoId);
    
    /**
     * Obtiene todos los stocks de un sector
     */
    List<StockPorSector> findBySectorId(Long sectorId);
    
    /**
     * Obtiene todos los stocks de productos de una empresa
     */
    @Query("SELECT sps FROM StockPorSector sps " +
           "JOIN sps.producto p " +
           "WHERE p.empresa.id = :empresaId")
    List<StockPorSector> findByEmpresaId(@Param("empresaId") Long empresaId);
    
    /**
     * Obtiene el stock total de un producto (suma de todos los sectores)
     */
    @Query("SELECT COALESCE(SUM(sps.cantidad), 0) FROM StockPorSector sps " +
           "WHERE sps.producto.id = :productoId")
    Integer getStockTotalByProductoId(@Param("productoId") Long productoId);
    
    /**
     * Obtiene productos con stock en un sector específico
     */
    @Query("SELECT sps FROM StockPorSector sps " +
           "JOIN sps.producto p " +
           "WHERE sps.sector.id = :sectorId AND p.empresa.id = :empresaId AND sps.cantidad > 0")
    List<StockPorSector> findProductosConStockEnSector(@Param("sectorId") Long sectorId, @Param("empresaId") Long empresaId);
    
    /**
     * Verifica si existe stock de un producto en un sector
     */
    boolean existsByProductoIdAndSectorId(Long productoId, Long sectorId);
}




