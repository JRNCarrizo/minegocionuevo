package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.VentaRapida;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repositorio para la entidad VentaRapida
 */
@Repository
public interface VentaRapidaRepository extends JpaRepository<VentaRapida, Long> {

    /**
     * Busca ventas rápidas por empresa
     */
    List<VentaRapida> findByEmpresaIdOrderByFechaVentaDesc(Long empresaId);

    /**
     * Busca ventas rápidas por empresa y rango de fechas
     */
    List<VentaRapida> findByEmpresaIdAndFechaVentaBetweenOrderByFechaVentaDesc(
        Long empresaId, LocalDateTime fechaInicio, LocalDateTime fechaFin);

    /**
     * Busca ventas rápidas por método de pago
     */
    List<VentaRapida> findByEmpresaIdAndMetodoPagoOrderByFechaVentaDesc(Long empresaId, String metodoPago);

    /**
     * Busca ventas rápidas por cliente
     */
    List<VentaRapida> findByEmpresaIdAndClienteIdOrderByFechaVentaDesc(Long empresaId, Long clienteId);

    /**
     * Cuenta el total de ventas rápidas por empresa
     */
    long countByEmpresaId(Long empresaId);

    /**
     * Obtiene el total de ventas por empresa en un rango de fechas
     */
    @Query("SELECT SUM(v.total) FROM VentaRapida v WHERE v.empresa.id = :empresaId AND v.fechaVenta BETWEEN :fechaInicio AND :fechaFin")
    java.math.BigDecimal sumTotalByEmpresaIdAndFechaVentaBetween(
        @Param("empresaId") Long empresaId, 
        @Param("fechaInicio") LocalDateTime fechaInicio, 
        @Param("fechaFin") LocalDateTime fechaFin);

    /**
     * Busca ventas rápidas por número de comprobante
     */
    Optional<VentaRapida> findByNumeroComprobante(String numeroComprobante);

    /**
     * Verifica si existe una venta rápida con el número de comprobante
     */
    boolean existsByNumeroComprobante(String numeroComprobante);
} 