package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.PlanillaDevolucion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlanillaDevolucionRepository extends JpaRepository<PlanillaDevolucion, Long> {

    /**
     * Buscar planillas de devolución por empresa
     */
    List<PlanillaDevolucion> findByEmpresaIdOrderByFechaPlanillaDesc(Long empresaId);

    /**
     * Buscar planilla de devolución por número de planilla
     */
    Optional<PlanillaDevolucion> findByNumeroPlanilla(String numeroPlanilla);

    /**
     * Verificar si existe una planilla de devolución con el número dado
     */
    boolean existsByNumeroPlanilla(String numeroPlanilla);

    /**
     * Contar planillas de devolución por empresa
     */
    long countByEmpresaId(Long empresaId);

    /**
     * Buscar planilla de devolución por ID y empresa
     */
    Optional<PlanillaDevolucion> findByIdAndEmpresaId(Long id, Long empresaId);
}
