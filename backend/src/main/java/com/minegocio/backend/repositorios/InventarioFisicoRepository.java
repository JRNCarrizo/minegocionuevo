package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.InventarioFisico;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface InventarioFisicoRepository extends JpaRepository<InventarioFisico, Long> {

    /**
     * Buscar inventarios físicos por empresa
     */
    @Query("SELECT i FROM InventarioFisico i WHERE i.empresa.id = :empresaId ORDER BY i.fechaInventario DESC")
    Page<InventarioFisico> findByEmpresaId(@Param("empresaId") Long empresaId, Pageable pageable);

    /**
     * Buscar inventarios físicos por empresa y estado
     */
    @Query("SELECT i FROM InventarioFisico i WHERE i.empresa.id = :empresaId AND i.estado = :estado ORDER BY i.fechaInventario DESC")
    List<InventarioFisico> findByEmpresaIdAndEstado(@Param("empresaId") Long empresaId, @Param("estado") InventarioFisico.EstadoInventario estado);

    /**
     * Buscar inventarios físicos por empresa y rango de fechas
     */
    @Query("SELECT i FROM InventarioFisico i WHERE i.empresa.id = :empresaId AND i.fechaInventario BETWEEN :fechaInicio AND :fechaFin ORDER BY i.fechaInventario DESC")
    List<InventarioFisico> findByEmpresaIdAndFechaInventarioBetween(
        @Param("empresaId") Long empresaId, 
        @Param("fechaInicio") LocalDateTime fechaInicio, 
        @Param("fechaFin") LocalDateTime fechaFin
    );

    /**
     * Contar inventarios físicos por empresa
     */
    @Query("SELECT COUNT(i) FROM InventarioFisico i WHERE i.empresa.id = :empresaId")
    Long countByEmpresaId(@Param("empresaId") Long empresaId);

    /**
     * Obtener el último inventario físico de una empresa
     */
    @Query("SELECT i FROM InventarioFisico i WHERE i.empresa.id = :empresaId ORDER BY i.fechaInventario DESC")
    List<InventarioFisico> findTopByEmpresaIdOrderByFechaInventarioDesc(@Param("empresaId") Long empresaId, Pageable pageable);
} 