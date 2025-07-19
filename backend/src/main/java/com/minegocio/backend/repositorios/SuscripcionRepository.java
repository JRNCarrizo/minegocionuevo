package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.Suscripcion;
import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Plan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repositorio para la gestión de suscripciones
 */
@Repository
public interface SuscripcionRepository extends JpaRepository<Suscripcion, Long> {

    /**
     * Busca suscripciones por empresa
     */
    List<Suscripcion> findByEmpresaOrderByFechaCreacionDesc(Empresa empresa);

    /**
     * Busca la suscripción activa de una empresa
     */
    Optional<Suscripcion> findByEmpresaAndEstado(Empresa empresa, Suscripcion.EstadoSuscripcion estado);

    /**
     * Busca suscripciones por estado
     */
    List<Suscripcion> findByEstado(Suscripcion.EstadoSuscripcion estado);

    /**
     * Busca suscripciones por plan
     */
    List<Suscripcion> findByPlan(Plan plan);

    /**
     * Busca suscripciones por plan y estado
     */
    List<Suscripcion> findByPlanAndEstado(Plan plan, Suscripcion.EstadoSuscripcion estado);

    /**
     * Cuenta suscripciones por estado
     */
    Long countByEstado(Suscripcion.EstadoSuscripcion estado);

    /**
     * Cuenta suscripciones por plan y estado
     */
    Long countByPlanIdAndEstado(Long planId, Suscripcion.EstadoSuscripcion estado);

    /**
     * Busca suscripciones que expiran en un rango de fechas
     */
    @Query("SELECT s FROM Suscripcion s WHERE s.fechaFin BETWEEN :fechaInicio AND :fechaFin AND s.estado = 'ACTIVA'")
    List<Suscripcion> findSuscripcionesPorExpirar(@Param("fechaInicio") LocalDateTime fechaInicio, 
                                                  @Param("fechaFin") LocalDateTime fechaFin);

    /**
     * Busca suscripciones expiradas
     */
    @Query("SELECT s FROM Suscripcion s WHERE s.fechaFin < :fecha AND s.estado = 'ACTIVA'")
    List<Suscripcion> findSuscripcionesExpiradas(@Param("fecha") LocalDateTime fecha);

    /**
     * Busca suscripciones que necesitan renovación automática
     */
    @Query("SELECT s FROM Suscripcion s WHERE s.renovacionAutomatica = true AND s.fechaFin BETWEEN :fechaInicio AND :fechaFin AND s.estado = 'ACTIVA'")
    List<Suscripcion> findSuscripcionesParaRenovar(@Param("fechaInicio") LocalDateTime fechaInicio, 
                                                   @Param("fechaFin") LocalDateTime fechaFin);

    /**
     * Calcula ingresos totales por período
     */
    @Query("SELECT SUM(s.precio) FROM Suscripcion s WHERE s.fechaCreacion BETWEEN :fechaInicio AND :fechaFin AND s.estado = 'ACTIVA'")
    BigDecimal calcularIngresosPorPeriodo(@Param("fechaInicio") LocalDateTime fechaInicio, 
                                          @Param("fechaFin") LocalDateTime fechaFin);

    /**
     * Calcula ingresos por plan en un período
     */
    @Query("SELECT s.plan.id, SUM(s.precio) FROM Suscripcion s WHERE s.fechaCreacion BETWEEN :fechaInicio AND :fechaFin AND s.estado = 'ACTIVA' GROUP BY s.plan.id")
    List<Object[]> calcularIngresosPorPlan(@Param("fechaInicio") LocalDateTime fechaInicio, 
                                           @Param("fechaFin") LocalDateTime fechaFin);

    /**
     * Busca suscripciones con paginación y filtros
     */
    @Query("SELECT s FROM Suscripcion s WHERE " +
           "(:empresaId IS NULL OR s.empresa.id = :empresaId) AND " +
           "(:planId IS NULL OR s.plan.id = :planId) AND " +
           "(:estado IS NULL OR s.estado = :estado) AND " +
           "(:fechaInicio IS NULL OR s.fechaCreacion >= :fechaInicio) AND " +
           "(:fechaFin IS NULL OR s.fechaCreacion <= :fechaFin)")
    Page<Suscripcion> findSuscripcionesConFiltros(@Param("empresaId") Long empresaId,
                                                  @Param("planId") Long planId,
                                                  @Param("estado") Suscripcion.EstadoSuscripcion estado,
                                                  @Param("fechaInicio") LocalDateTime fechaInicio,
                                                  @Param("fechaFin") LocalDateTime fechaFin,
                                                  Pageable pageable);

    /**
     * Busca suscripciones canceladas recientemente
     */
    @Query("SELECT s FROM Suscripcion s WHERE s.fechaCancelacion BETWEEN :fechaInicio AND :fechaFin ORDER BY s.fechaCancelacion DESC")
    List<Suscripcion> findSuscripcionesCanceladas(@Param("fechaInicio") LocalDateTime fechaInicio, 
                                                  @Param("fechaFin") LocalDateTime fechaFin);

    /**
     * Calcula estadísticas de retención
     */
    @Query("SELECT COUNT(s) FROM Suscripcion s WHERE s.empresa.id = :empresaId AND s.estado = 'ACTIVA'")
    Long contarSuscripcionesActivasPorEmpresa(@Param("empresaId") Long empresaId);

    /**
     * Busca la última suscripción de una empresa
     */
    @Query("SELECT s FROM Suscripcion s WHERE s.empresa = :empresa ORDER BY s.fechaCreacion DESC")
    List<Suscripcion> findUltimasSuscripciones(@Param("empresa") Empresa empresa, Pageable pageable);
} 