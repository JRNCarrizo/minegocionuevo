package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.Pedido;
import com.minegocio.backend.entidades.Cliente;
import com.minegocio.backend.entidades.Empresa;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repositorio para la gestión de pedidos
 */
@Repository
public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    /**
     * Busca pedidos por empresa
     */
    Page<Pedido> findByEmpresa(Empresa empresa, Pageable pageable);

    /**
     * Busca pedidos por cliente
     */
    Page<Pedido> findByCliente(Cliente cliente, Pageable pageable);

    /**
     * Busca pedidos por estado y empresa
     */
    Page<Pedido> findByEmpresaAndEstado(Empresa empresa, Pedido.EstadoPedido estado, Pageable pageable);

    /**
     * Busca pedidos por cliente y estado
     */
    List<Pedido> findByClienteAndEstado(Cliente cliente, Pedido.EstadoPedido estado);

    /**
     * Busca pedido por número de pedido y empresa
     */
    Optional<Pedido> findByNumeroPedidoAndEmpresa(String numeroPedido, Empresa empresa);

    /**
     * Busca pedido por ID y empresa (para seguridad multi-tenant)
     */
    Optional<Pedido> findByIdAndEmpresa(Long id, Empresa empresa);

    /**
     * Busca pedidos en un rango de fechas por empresa
     */
    @Query("SELECT p FROM Pedido p WHERE p.empresa = :empresa AND p.fechaCreacion BETWEEN :fechaInicio AND :fechaFin")
    List<Pedido> findPedidosEnRangoFechas(@Param("empresa") Empresa empresa, 
                                         @Param("fechaInicio") LocalDateTime fechaInicio, 
                                         @Param("fechaFin") LocalDateTime fechaFin);

    /**
     * Cuenta pedidos por estado y empresa
     */
    @Query("SELECT COUNT(p) FROM Pedido p WHERE p.empresa = :empresa AND p.estado = :estado")
    Long contarPedidosPorEstado(@Param("empresa") Empresa empresa, @Param("estado") Pedido.EstadoPedido estado);

    /**
     * Suma total de ventas por empresa
     */
    @Query("SELECT COALESCE(SUM(p.total), 0) FROM Pedido p WHERE p.empresa = :empresa AND p.estado NOT IN ('CANCELADO')")
    Double sumaTotalVentasPorEmpresa(@Param("empresa") Empresa empresa);

    /**
     * Busca pedidos pendientes de más de X días
     */
    @Query("SELECT p FROM Pedido p WHERE p.empresa = :empresa AND p.estado = 'PENDIENTE' AND p.fechaCreacion < :fecha")
    List<Pedido> findPedidosPendientesAntiguos(@Param("empresa") Empresa empresa, @Param("fecha") LocalDateTime fecha);

    /**
     * Busca últimos pedidos por empresa
     */
    @Query("SELECT p FROM Pedido p WHERE p.empresa = :empresa ORDER BY p.fechaCreacion DESC")
    List<Pedido> findUltimosPedidos(@Param("empresa") Empresa empresa, Pageable pageable);

    /**
     * Estadísticas mensuales de pedidos
     */
    @Query("SELECT COUNT(p), SUM(p.total) FROM Pedido p WHERE p.empresa = :empresa " +
           "AND YEAR(p.fechaCreacion) = :año AND MONTH(p.fechaCreacion) = :mes " +
           "AND p.estado NOT IN ('CANCELADO')")
    Object[] getEstadisticasMensuales(@Param("empresa") Empresa empresa, 
                                     @Param("año") int año, 
                                     @Param("mes") int mes);
}
