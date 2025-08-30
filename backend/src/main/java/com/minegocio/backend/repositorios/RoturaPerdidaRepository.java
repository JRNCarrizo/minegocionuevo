package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.RoturaPerdida;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RoturaPerdidaRepository extends JpaRepository<RoturaPerdida, Long> {

    /**
     * Buscar roturas y pérdidas por empresa
     */
    List<RoturaPerdida> findByEmpresaIdOrderByFechaDesc(Long empresaId);

    /**
     * Buscar roturas y pérdidas por empresa y fecha
     */
    List<RoturaPerdida> findByEmpresaIdAndFechaOrderByFechaCreacionDesc(Long empresaId, LocalDate fecha);

    /**
     * Buscar roturas y pérdidas por empresa y rango de fechas
     */
    @Query("SELECT r FROM RoturaPerdida r WHERE r.empresa.id = :empresaId AND r.fecha BETWEEN :fechaInicio AND :fechaFin ORDER BY r.fecha DESC, r.fechaCreacion DESC")
    List<RoturaPerdida> findByEmpresaIdAndFechaBetweenOrderByFechaDesc(
            @Param("empresaId") Long empresaId,
            @Param("fechaInicio") java.time.LocalDateTime fechaInicio,
            @Param("fechaFin") java.time.LocalDateTime fechaFin
    );

    /**
     * Buscar rotura/pérdida por ID y empresa
     */
    Optional<RoturaPerdida> findByIdAndEmpresaId(Long id, Long empresaId);

    /**
     * Contar roturas y pérdidas por empresa
     */
    long countByEmpresaId(Long empresaId);

    /**
     * Contar roturas y pérdidas por empresa y fecha
     */
    long countByEmpresaIdAndFecha(Long empresaId, LocalDate fecha);

    /**
     * Obtener total de unidades perdidas por empresa y fecha
     */
    @Query("SELECT COALESCE(SUM(r.cantidad), 0) FROM RoturaPerdida r WHERE r.empresa.id = :empresaId AND r.fecha = :fecha")
    Integer sumCantidadByEmpresaIdAndFecha(@Param("empresaId") Long empresaId, @Param("fecha") LocalDate fecha);

    /**
     * Obtener total de unidades perdidas por empresa y rango de fechas
     */
    @Query("SELECT COALESCE(SUM(r.cantidad), 0) FROM RoturaPerdida r WHERE r.empresa.id = :empresaId AND r.fecha BETWEEN :fechaInicio AND :fechaFin")
    Integer sumCantidadByEmpresaIdAndFechaBetween(
            @Param("empresaId") Long empresaId,
            @Param("fechaInicio") LocalDateTime fechaInicio,
            @Param("fechaFin") LocalDateTime fechaFin
    );

    /**
     * Buscar roturas y pérdidas por empresa y rango de fechas usando LocalDateTime
     */
    @Query("SELECT r FROM RoturaPerdida r WHERE r.empresa.id = :empresaId AND r.fecha BETWEEN :fechaInicio AND :fechaFin ORDER BY r.fechaCreacion DESC")
    List<RoturaPerdida> findByEmpresaIdAndFechaBetweenOrderByFechaCreacionDesc(
            @Param("empresaId") Long empresaId,
            @Param("fechaInicio") java.time.LocalDateTime fechaInicio,
            @Param("fechaFin") java.time.LocalDateTime fechaFin
    );
}
