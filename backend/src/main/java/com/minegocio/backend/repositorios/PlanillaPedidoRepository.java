package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.PlanillaPedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface PlanillaPedidoRepository extends JpaRepository<PlanillaPedido, Long> {

    /**
     * Buscar planillas por empresa
     */
    List<PlanillaPedido> findByEmpresaIdOrderByFechaPlanillaDesc(Long empresaId);

    /**
     * Buscar planillas por empresa y fecha
     */
    List<PlanillaPedido> findByEmpresaIdAndFechaPlanillaOrderByFechaCreacionDesc(Long empresaId, LocalDate fechaPlanilla);

    /**
     * Buscar planillas por empresa y rango de fechas
     */
    @Query("SELECT p FROM PlanillaPedido p WHERE p.empresa.id = :empresaId AND p.fechaPlanilla BETWEEN :fechaInicio AND :fechaFin ORDER BY p.fechaPlanilla DESC, p.fechaCreacion DESC")
    List<PlanillaPedido> findByEmpresaIdAndFechaPlanillaBetweenOrderByFechaPlanillaDesc(
            @Param("empresaId") Long empresaId,
            @Param("fechaInicio") LocalDate fechaInicio,
            @Param("fechaFin") LocalDate fechaFin
    );

    /**
     * Buscar planilla por número de planilla
     */
    Optional<PlanillaPedido> findByNumeroPlanilla(String numeroPlanilla);

    /**
     * Verificar si existe una planilla con el número dado
     */
    boolean existsByNumeroPlanilla(String numeroPlanilla);

    /**
     * Contar planillas por empresa
     */
    long countByEmpresaId(Long empresaId);

    /**
     * Contar planillas por empresa y fecha
     */
    long countByEmpresaIdAndFechaPlanilla(Long empresaId, LocalDate fechaPlanilla);
}
