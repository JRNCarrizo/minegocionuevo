package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.DetallePlanillaPedido;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DetallePlanillaPedidoRepository extends JpaRepository<DetallePlanillaPedido, Long> {

    /**
     * Buscar detalles por planilla de pedido
     */
    List<DetallePlanillaPedido> findByPlanillaPedidoIdOrderByFechaCreacionAsc(Long planillaPedidoId);

    /**
     * Buscar detalles por producto
     */
    List<DetallePlanillaPedido> findByProductoId(Long productoId);

    /**
     * Contar detalles por planilla de pedido
     */
    long countByPlanillaPedidoId(Long planillaPedidoId);

    /**
     * Eliminar detalles por planilla de pedido
     */
    void deleteByPlanillaPedidoId(Long planillaPedidoId);
}
