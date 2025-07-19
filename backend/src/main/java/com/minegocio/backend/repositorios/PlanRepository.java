package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.Plan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio para la gestión de planes
 */
@Repository
public interface PlanRepository extends JpaRepository<Plan, Long> {

    /**
     * Busca planes activos
     */
    List<Plan> findByActivoTrue();

    /**
     * Busca planes activos ordenados por orden
     */
    List<Plan> findByActivoTrueOrderByOrdenAsc();

    /**
     * Busca planes destacados
     */
    List<Plan> findByActivoTrueAndDestacadoTrue();

    /**
     * Busca planes por período
     */
    List<Plan> findByActivoTrueAndPeriodo(Plan.PeriodoPlan periodo);

    /**
     * Cuenta planes activos
     */
    Long countByActivoTrue();

    /**
     * Busca el plan más popular (con más suscripciones activas)
     */
    @Query("SELECT p FROM Plan p WHERE p.activo = true ORDER BY SIZE(p.suscripciones) DESC")
    List<Plan> findPlanesMasPopulares();

    /**
     * Busca planes por rango de precio
     */
    @Query("SELECT p FROM Plan p WHERE p.activo = true AND p.precio BETWEEN :precioMin AND :precioMax ORDER BY p.precio ASC")
    List<Plan> findByPrecioBetween(@Param("precioMin") Double precioMin, @Param("precioMax") Double precioMax);

    /**
     * Busca planes que incluyen una característica específica
     */
    @Query("SELECT p FROM Plan p WHERE p.activo = true AND " +
           "(:personalizacionCompleta IS NULL OR p.personalizacionCompleta = :personalizacionCompleta) AND " +
           "(:estadisticasAvanzadas IS NULL OR p.estadisticasAvanzadas = :estadisticasAvanzadas) AND " +
           "(:soportePrioritario IS NULL OR p.soportePrioritario = :soportePrioritario) AND " +
           "(:integracionesAvanzadas IS NULL OR p.integracionesAvanzadas = :integracionesAvanzadas) AND " +
           "(:backupAutomatico IS NULL OR p.backupAutomatico = :backupAutomatico) AND " +
           "(:dominioPersonalizado IS NULL OR p.dominioPersonalizado = :dominioPersonalizado)")
    List<Plan> findByCaracteristicas(@Param("personalizacionCompleta") Boolean personalizacionCompleta,
                                    @Param("estadisticasAvanzadas") Boolean estadisticasAvanzadas,
                                    @Param("soportePrioritario") Boolean soportePrioritario,
                                    @Param("integracionesAvanzadas") Boolean integracionesAvanzadas,
                                    @Param("backupAutomatico") Boolean backupAutomatico,
                                    @Param("dominioPersonalizado") Boolean dominioPersonalizado);

    /**
     * Busca el siguiente orden disponible
     */
    @Query("SELECT COALESCE(MAX(p.orden), 0) + 1 FROM Plan p")
    Integer findNextOrden();
} 