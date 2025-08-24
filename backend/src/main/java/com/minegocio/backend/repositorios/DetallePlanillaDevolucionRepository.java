package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.DetallePlanillaDevolucion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DetallePlanillaDevolucionRepository extends JpaRepository<DetallePlanillaDevolucion, Long> {

    /**
     * Buscar detalles por planilla de devolución
     */
    List<DetallePlanillaDevolucion> findByPlanillaDevolucionIdOrderByFechaCreacionAsc(Long planillaDevolucionId);

    /**
     * Eliminar detalles por planilla de devolución
     */
    void deleteByPlanillaDevolucionId(Long planillaDevolucionId);
}
