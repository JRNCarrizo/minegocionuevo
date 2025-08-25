package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.CierreDia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CierreDiaRepository extends JpaRepository<CierreDia, Long> {
    
    // Buscar por empresa y fecha
    Optional<CierreDia> findByEmpresaIdAndFecha(Long empresaId, LocalDate fecha);
    
    // Buscar todos los cierres de una empresa ordenados por fecha descendente
    List<CierreDia> findByEmpresaIdOrderByFechaDesc(Long empresaId);
    
    // Buscar el último cierre de una empresa
    @Query("SELECT c FROM CierreDia c WHERE c.empresaId = :empresaId ORDER BY c.fecha DESC LIMIT 1")
    Optional<CierreDia> findLastCierreByEmpresaId(@Param("empresaId") Long empresaId);
    
    // Buscar cierres cerrados de una empresa
    List<CierreDia> findByEmpresaIdAndCerradoTrueOrderByFechaDesc(Long empresaId);
    
    // Verificar si existe un cierre para una fecha específica
    boolean existsByEmpresaIdAndFecha(Long empresaId, LocalDate fecha);
    
    // Buscar cierres entre fechas
    @Query("SELECT c FROM CierreDia c WHERE c.empresaId = :empresaId AND c.fecha BETWEEN :fechaInicio AND :fechaFin ORDER BY c.fecha DESC")
    List<CierreDia> findByEmpresaIdAndFechaBetween(@Param("empresaId") Long empresaId, 
                                                  @Param("fechaInicio") LocalDate fechaInicio, 
                                                  @Param("fechaFin") LocalDate fechaFin);
}
