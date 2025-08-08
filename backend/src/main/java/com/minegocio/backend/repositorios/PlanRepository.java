package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.Plan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio para la gestión de planes de suscripción
 */
@Repository
public interface PlanRepository extends JpaRepository<Plan, Long> {

    /**
     * Busca planes activos ordenados por orden
     */
    List<Plan> findByActivoTrueOrderByOrdenAsc();

    /**
     * Busca planes destacados
     */
    List<Plan> findByDestacadoTrueAndActivoTrue();

    /**
     * Verifica si existe un plan con el nombre dado
     */
    boolean existsByNombre(String nombre);

    /**
     * Busca un plan por nombre
     */
    Optional<Plan> findByNombre(String nombre);

    /**
     * Busca el plan por defecto
     */
    Optional<Plan> findByPlanPorDefectoTrue();

    /**
     * Cuenta el total de suscripciones por plan
     */
    @Query("SELECT p.id, COUNT(s) FROM Plan p LEFT JOIN p.suscripciones s GROUP BY p.id")
    List<Object[]> contarSuscripcionesPorPlan();

    /**
     * Cuenta las suscripciones activas por plan
     */
    @Query("SELECT p.id, COUNT(s) FROM Plan p LEFT JOIN p.suscripciones s WHERE s.estado = 'ACTIVA' GROUP BY p.id")
    List<Object[]> contarSuscripcionesActivasPorPlan();

    /**
     * Calcula los ingresos totales por plan
     */
    @Query("SELECT p.id, SUM(s.precio) FROM Plan p LEFT JOIN p.suscripciones s WHERE s.estado = 'ACTIVA' GROUP BY p.id")
    List<Object[]> calcularIngresosPorPlan();

    /**
     * Busca planes con estadísticas completas
     */
    @Query("SELECT p, " +
           "COUNT(s) as totalSuscripciones, " +
           "COUNT(CASE WHEN s.estado = 'ACTIVA' THEN 1 END) as suscripcionesActivas, " +
           "SUM(CASE WHEN s.estado = 'ACTIVA' THEN s.precio ELSE 0 END) as ingresosTotales " +
           "FROM Plan p LEFT JOIN p.suscripciones s " +
           "WHERE p.activo = true " +
           "GROUP BY p.id " +
           "ORDER BY p.orden ASC")
    List<Object[]> findPlanesConEstadisticas();
} 