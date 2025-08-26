package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.RemitoIngreso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RemitoIngresoRepository extends JpaRepository<RemitoIngreso, Long> {
    
    // Buscar por empresa
    List<RemitoIngreso> findByEmpresaIdOrderByFechaCreacionDesc(Long empresaId);
    
    // Buscar por número de remito
    Optional<RemitoIngreso> findByNumeroRemitoAndEmpresaId(String numeroRemito, Long empresaId);
    
    // Buscar por fecha de remito
    @Query("SELECT r FROM RemitoIngreso r WHERE r.empresa.id = :empresaId AND DATE(r.fechaRemito) = DATE(:fecha) ORDER BY r.fechaCreacion DESC")
    List<RemitoIngreso> findByFechaRemitoAndEmpresaId(@Param("fecha") LocalDateTime fecha, @Param("empresaId") Long empresaId);
    
    // Buscar por rango de fechas
    @Query("SELECT r FROM RemitoIngreso r WHERE r.empresa.id = :empresaId AND r.fechaRemito BETWEEN :fechaInicio AND :fechaFin ORDER BY r.fechaCreacion DESC")
    List<RemitoIngreso> findByRangoFechasAndEmpresaId(@Param("fechaInicio") LocalDateTime fechaInicio, 
                                                      @Param("fechaFin") LocalDateTime fechaFin, 
                                                      @Param("empresaId") Long empresaId);
    
    // Buscar por observaciones (búsqueda parcial)
    @Query("SELECT r FROM RemitoIngreso r WHERE r.empresa.id = :empresaId AND (LOWER(r.observaciones) LIKE LOWER(CONCAT('%', :busqueda, '%')) OR LOWER(r.numeroRemito) LIKE LOWER(CONCAT('%', :busqueda, '%'))) ORDER BY r.fechaCreacion DESC")
    List<RemitoIngreso> findByBusquedaAndEmpresaId(@Param("busqueda") String busqueda, @Param("empresaId") Long empresaId);
    
    // Contar remitos por empresa
    long countByEmpresaId(Long empresaId);
    
    // Verificar si existe un número de remito
    boolean existsByNumeroRemitoAndEmpresaId(String numeroRemito, Long empresaId);
}




