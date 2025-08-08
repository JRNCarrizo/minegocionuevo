package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.Suscripcion;
import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Plan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

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
     * Busca suscripciones por empresa y estado
     */
    List<Suscripcion> findByEmpresaAndEstado(Empresa empresa, Suscripcion.EstadoSuscripcion estado);

    /**
     * Busca la suscripción activa de una empresa
     */
    Optional<Suscripcion> findFirstByEmpresaAndEstado(Empresa empresa, Suscripcion.EstadoSuscripcion estado);

    /**
     * Busca suscripciones por estado
     */
    List<Suscripcion> findByEstado(Suscripcion.EstadoSuscripcion estado);

    /**
     * Busca suscripciones por plan
     */
    List<Suscripcion> findByPlanOrderByFechaCreacionDesc(Plan plan);

    /**
     * Busca suscripciones que expiran en un rango de fechas
     */
    @Query("SELECT s FROM Suscripcion s WHERE s.fechaFin BETWEEN :fechaInicio AND :fechaFin AND s.estado = 'ACTIVA'")
    List<Suscripcion> findByFechaFinBetween(@Param("fechaInicio") LocalDateTime fechaInicio, 
                                           @Param("fechaFin") LocalDateTime fechaFin);

    /**
     * Busca suscripciones que expiran pronto (en los próximos días)
     */
    @Query("SELECT s FROM Suscripcion s WHERE s.fechaFin BETWEEN :ahora AND :fechaLimite AND s.estado = 'ACTIVA'")
    List<Suscripcion> findSuscripcionesPorExpirar(@Param("ahora") LocalDateTime ahora, 
                                                  @Param("fechaLimite") LocalDateTime fechaLimite);

    /**
     * Busca suscripciones expiradas
     */
    @Query("SELECT s FROM Suscripcion s WHERE s.fechaFin < :ahora AND s.estado = 'ACTIVA'")
    List<Suscripcion> findSuscripcionesExpiradas(@Param("ahora") LocalDateTime ahora);

    /**
     * Cuenta suscripciones por estado
     */
    @Query("SELECT s.estado, COUNT(s) FROM Suscripcion s GROUP BY s.estado")
    List<Object[]> contarSuscripcionesPorEstado();

    /**
     * Calcula ingresos por período
     */
    @Query("SELECT SUM(s.precio) FROM Suscripcion s WHERE s.estado = 'ACTIVA' AND s.fechaInicio BETWEEN :fechaInicio AND :fechaFin")
    Double calcularIngresosPorPeriodo(@Param("fechaInicio") LocalDateTime fechaInicio, 
                                      @Param("fechaFin") LocalDateTime fechaFin);

    /**
     * Busca suscripciones con información completa
     */
    @Query("SELECT s, e.nombre as empresaNombre, e.subdominio as empresaSubdominio, p.nombre as planNombre " +
           "FROM Suscripcion s " +
           "JOIN s.empresa e " +
           "JOIN s.plan p " +
           "ORDER BY s.fechaCreacion DESC")
    List<Object[]> findSuscripcionesConDetalles();

    /**
     * Busca suscripciones por empresa con detalles
     */
    @Query("SELECT s, p.nombre as planNombre " +
           "FROM Suscripcion s " +
           "JOIN s.plan p " +
           "WHERE s.empresa = :empresa " +
           "ORDER BY s.fechaCreacion DESC")
    List<Object[]> findSuscripcionesPorEmpresaConDetalles(@Param("empresa") Empresa empresa);

    /**
     * Verifica si una empresa tiene una suscripción activa
     */
    boolean existsByEmpresaAndEstado(Empresa empresa, Suscripcion.EstadoSuscripcion estado);

    /**
     * Busca la última suscripción de una empresa
     */
    Optional<Suscripcion> findFirstByEmpresaOrderByFechaCreacionDesc(Empresa empresa);
} 