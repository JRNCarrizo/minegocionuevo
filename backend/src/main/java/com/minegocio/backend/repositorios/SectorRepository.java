package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.Sector;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SectorRepository extends JpaRepository<Sector, Long> {
    
    /**
     * Obtiene todos los sectores activos de una empresa
     */
    List<Sector> findByEmpresaIdAndActivoOrderByNombre(Long empresaId, Boolean activo);
    
    /**
     * Obtiene todos los sectores de una empresa (activos e inactivos)
     */
    List<Sector> findByEmpresaIdOrderByNombre(Long empresaId);
    
    /**
     * Busca un sector por nombre y empresa
     */
    Optional<Sector> findByNombreAndEmpresaId(String nombre, Long empresaId);
    
    /**
     * Verifica si existe un sector con el mismo nombre en la empresa
     */
    boolean existsByNombreAndEmpresaId(String nombre, Long empresaId);
    
    /**
     * Obtiene sectores por empresa con conteo de productos
     */
    @Query("SELECT s, COUNT(sps.id) as cantidadProductos FROM Sector s " +
           "LEFT JOIN StockPorSector sps ON s.id = sps.sector.id " +
           "WHERE s.empresa.id = :empresaId AND s.activo = true " +
           "GROUP BY s.id, s.nombre, s.descripcion, s.ubicacion, s.activo, s.empresa, s.fechaCreacion, s.fechaActualizacion " +
           "ORDER BY s.nombre")
    List<Object[]> findSectoresConConteoProductos(@Param("empresaId") Long empresaId);
}










