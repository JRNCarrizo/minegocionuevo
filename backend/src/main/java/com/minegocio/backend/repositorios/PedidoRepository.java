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
     * Busca pedidos por empresa ordenados por fecha de creación descendente
     */
    @Query("SELECT p FROM Pedido p WHERE p.empresa = :empresa ORDER BY p.fechaCreacion DESC")
    List<Pedido> findByEmpresaOrderByFechaCreacionDesc(@Param("empresa") Empresa empresa);

    /**
     * Busca pedidos por cliente
     */
    Page<Pedido> findByCliente(Cliente cliente, Pageable pageable);

    /**
     * Busca pedidos por cliente ordenados por fecha de creación descendente
     */
    @Query("SELECT p FROM Pedido p WHERE p.cliente = :cliente ORDER BY p.fechaCreacion DESC")
    List<Pedido> findByClienteOrderByFechaCreacionDesc(@Param("cliente") Cliente cliente);

    /**
     * Busca pedidos por cliente y empresa (para seguridad multi-tenant)
     */
    Page<Pedido> findByClienteAndEmpresa(Cliente cliente, Empresa empresa, Pageable pageable);

    /**
     * Busca pedidos por cliente y empresa (sin paginación) ordenados por fecha descendente
     */
    @Query("SELECT p FROM Pedido p WHERE p.cliente = :cliente AND p.empresa = :empresa ORDER BY p.fechaCreacion DESC")
    List<Pedido> findByClienteAndEmpresaOrderByFechaCreacionDesc(@Param("cliente") Cliente cliente, @Param("empresa") Empresa empresa);
    
    /**
     * Busca pedidos por cliente y empresa (sin paginación) - método original para compatibilidad
     */
    @Query("SELECT p FROM Pedido p WHERE p.cliente = :cliente AND p.empresa = :empresa ORDER BY p.fechaCreacion DESC")
    List<Pedido> findByClienteAndEmpresa(@Param("cliente") Cliente cliente, @Param("empresa") Empresa empresa);

    /**
     * Busca pedidos por estado y empresa
     */
    Page<Pedido> findByEmpresaAndEstado(Empresa empresa, Pedido.EstadoPedido estado, Pageable pageable);

    /**
     * Busca pedidos por cliente y estado ordenados por fecha descendente
     */
    @Query("SELECT p FROM Pedido p WHERE p.cliente = :cliente AND p.estado = :estado ORDER BY p.fechaCreacion DESC")
    List<Pedido> findByClienteAndEstado(@Param("cliente") Cliente cliente, @Param("estado") Pedido.EstadoPedido estado);

    /**
     * Busca pedido por número de pedido y empresa
     */
    Optional<Pedido> findByNumeroPedidoAndEmpresa(String numeroPedido, Empresa empresa);

    /**
     * Busca pedido por ID y empresa (para seguridad multi-tenant)
     */
    Optional<Pedido> findByIdAndEmpresa(Long id, Empresa empresa);

    /**
     * Busca pedidos en un rango de fechas por empresa ordenados por fecha descendente
     */
    @Query("SELECT p FROM Pedido p WHERE p.empresa = :empresa AND p.fechaCreacion BETWEEN :fechaInicio AND :fechaFin ORDER BY p.fechaCreacion DESC")
    List<Pedido> findPedidosEnRangoFechas(@Param("empresa") Empresa empresa, 
                                         @Param("fechaInicio") LocalDateTime fechaInicio, 
                                         @Param("fechaFin") LocalDateTime fechaFin);

    /**
     * Busca pedidos por empresa y rango de fechas (método para estadísticas)
     */
    List<Pedido> findByEmpresaAndFechaCreacionBetween(Empresa empresa, LocalDateTime fechaInicio, LocalDateTime fechaFin);

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
     * Busca pedidos pendientes de más de X días ordenados por fecha descendente
     */
    @Query("SELECT p FROM Pedido p WHERE p.empresa = :empresa AND p.estado = 'PENDIENTE' AND p.fechaCreacion < :fecha ORDER BY p.fechaCreacion DESC")
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
    
    /**
     * Cuenta total de pedidos por cliente y empresa
     */
    @Query("SELECT COUNT(p) FROM Pedido p WHERE p.cliente = :cliente AND p.empresa = :empresa AND p.estado NOT IN ('CANCELADO')")
    Long contarPedidosPorCliente(@Param("cliente") Cliente cliente, @Param("empresa") Empresa empresa);
    
    /**
     * Suma total de compras por cliente y empresa
     */
    @Query("SELECT COALESCE(SUM(p.total), 0) FROM Pedido p WHERE p.cliente = :cliente AND p.empresa = :empresa AND p.estado NOT IN ('CANCELADO')")
    Double sumaTotalComprasPorCliente(@Param("cliente") Cliente cliente, @Param("empresa") Empresa empresa);
    
    /**
     * Obtiene todos los pedidos de un cliente en una empresa
     */
    @Query("SELECT p FROM Pedido p WHERE p.cliente = :cliente AND p.empresa = :empresa ORDER BY p.fechaCreacion DESC")
    List<Pedido> findPedidosCompletosPorCliente(@Param("cliente") Cliente cliente, @Param("empresa") Empresa empresa);
    
    /**
     * Obtiene todos los pedidos de un cliente por email en una empresa (incluye pedidos públicos)
     */
    @Query("SELECT p FROM Pedido p WHERE p.empresa = :empresa AND (p.cliente = :cliente OR p.clienteEmail = :clienteEmail) ORDER BY p.fechaCreacion DESC")
    List<Pedido> findPedidosPorClienteOEmail(@Param("cliente") Cliente cliente, @Param("clienteEmail") String clienteEmail, @Param("empresa") Empresa empresa);
    
    /**
     * Busca pedidos por empresa, rango de fechas y observaciones que contengan un texto específico
     */
    @Query("SELECT p FROM Pedido p WHERE p.empresa.id = :empresaId AND p.fechaCreacion BETWEEN :fechaInicio AND :fechaFin AND p.observaciones LIKE %:observacion% ORDER BY p.fechaCreacion DESC")
    List<Pedido> findByEmpresaIdAndFechaCreacionBetweenAndObservacionesContaining(@Param("empresaId") Long empresaId, 
                                                                                  @Param("fechaInicio") LocalDateTime fechaInicio, 
                                                                                  @Param("fechaFin") LocalDateTime fechaFin, 
                                                                                  @Param("observacion") String observacion);

    /**
     * Cuenta pedidos por empresa ID
     */
    long countByEmpresaId(Long empresaId);
    
    /**
     * Busca pedidos por empresa con detalles cargados (para estadísticas)
     */
    @Query("SELECT DISTINCT p FROM Pedido p LEFT JOIN FETCH p.detalles WHERE p.empresa = :empresa ORDER BY p.fechaCreacion DESC")
    List<Pedido> findByEmpresaWithDetallesOrderByFechaCreacionDesc(@Param("empresa") Empresa empresa);
    
    /**
     * Busca pedidos por empresa y rango de fechas con detalles cargados (para estadísticas)
     */
    @Query("SELECT DISTINCT p FROM Pedido p LEFT JOIN FETCH p.detalles WHERE p.empresa = :empresa AND p.fechaCreacion BETWEEN :fechaInicio AND :fechaFin ORDER BY p.fechaCreacion DESC")
    List<Pedido> findByEmpresaAndFechaCreacionBetweenWithDetalles(@Param("empresa") Empresa empresa, @Param("fechaInicio") LocalDateTime fechaInicio, @Param("fechaFin") LocalDateTime fechaFin);
}
