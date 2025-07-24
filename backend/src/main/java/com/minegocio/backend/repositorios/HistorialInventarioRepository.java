package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.HistorialInventario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface HistorialInventarioRepository extends JpaRepository<HistorialInventario, Long> {

    /**
     * Buscar historial por empresa
     */
    @Query("SELECT h FROM HistorialInventario h WHERE h.empresa.id = :empresaId ORDER BY h.fechaOperacion DESC")
    Page<HistorialInventario> findByEmpresaId(@Param("empresaId") Long empresaId, Pageable pageable);

    /**
     * Buscar historial por empresa y producto
     */
    @Query("SELECT h FROM HistorialInventario h WHERE h.empresa.id = :empresaId AND h.producto.id = :productoId ORDER BY h.fechaOperacion DESC")
    List<HistorialInventario> findByEmpresaIdAndProductoId(@Param("empresaId") Long empresaId, @Param("productoId") Long productoId);

    /**
     * Buscar historial por empresa y rango de fechas
     */
    @Query("SELECT h FROM HistorialInventario h WHERE h.empresa.id = :empresaId AND h.fechaOperacion BETWEEN :fechaInicio AND :fechaFin ORDER BY h.fechaOperacion DESC")
    List<HistorialInventario> findByEmpresaIdAndFechaOperacionBetween(
        @Param("empresaId") Long empresaId, 
        @Param("fechaInicio") LocalDateTime fechaInicio, 
        @Param("fechaFin") LocalDateTime fechaFin
    );

    /**
     * Buscar historial por empresa, producto y rango de fechas
     */
    @Query("SELECT h FROM HistorialInventario h WHERE h.empresa.id = :empresaId AND h.producto.id = :productoId AND h.fechaOperacion BETWEEN :fechaInicio AND :fechaFin ORDER BY h.fechaOperacion DESC")
    List<HistorialInventario> findByEmpresaIdAndProductoIdAndFechaOperacionBetween(
        @Param("empresaId") Long empresaId, 
        @Param("productoId") Long productoId,
        @Param("fechaInicio") LocalDateTime fechaInicio, 
        @Param("fechaFin") LocalDateTime fechaFin
    );

    /**
     * Buscar historial por empresa y tipo de operación
     */
    @Query("SELECT h FROM HistorialInventario h WHERE h.empresa.id = :empresaId AND h.tipoOperacion = :tipoOperacion ORDER BY h.fechaOperacion DESC")
    List<HistorialInventario> findByEmpresaIdAndTipoOperacion(
        @Param("empresaId") Long empresaId, 
        @Param("tipoOperacion") HistorialInventario.TipoOperacion tipoOperacion
    );

    /**
     * Buscar historial por empresa y usuario
     */
    @Query("SELECT h FROM HistorialInventario h WHERE h.empresa.id = :empresaId AND h.usuario.id = :usuarioId ORDER BY h.fechaOperacion DESC")
    List<HistorialInventario> findByEmpresaIdAndUsuarioId(@Param("empresaId") Long empresaId, @Param("usuarioId") Long usuarioId);

    /**
     * Buscar historial por código de barras
     */
    @Query("SELECT h FROM HistorialInventario h WHERE h.empresa.id = :empresaId AND h.codigoBarras = :codigoBarras ORDER BY h.fechaOperacion DESC")
    List<HistorialInventario> findByEmpresaIdAndCodigoBarras(@Param("empresaId") Long empresaId, @Param("codigoBarras") String codigoBarras);

    /**
     * Obtener estadísticas de inventario por empresa
     */
    @Query("SELECT " +
           "COUNT(h) as totalOperaciones, " +
           "COUNT(CASE WHEN h.tipoOperacion = 'INCREMENTO' OR (h.tipoOperacion = 'INVENTARIO_FISICO' AND h.stockNuevo > h.stockAnterior) THEN 1 END) as totalIncrementos, " +
           "COUNT(CASE WHEN h.tipoOperacion = 'DECREMENTO' OR (h.tipoOperacion = 'INVENTARIO_FISICO' AND h.stockNuevo < h.stockAnterior) THEN 1 END) as totalDecrementos, " +
           "COUNT(CASE WHEN h.tipoOperacion = 'AJUSTE' OR (h.tipoOperacion = 'INVENTARIO_FISICO' AND h.stockNuevo = h.stockAnterior) THEN 1 END) as totalAjustes, " +
           "COALESCE(SUM(CASE WHEN h.tipoOperacion = 'INCREMENTO' OR (h.tipoOperacion = 'INVENTARIO_FISICO' AND h.stockNuevo > h.stockAnterior) THEN h.valorTotal ELSE 0 END), 0) as valorTotalIncrementos, " +
           "COALESCE(SUM(CASE WHEN h.tipoOperacion = 'DECREMENTO' OR (h.tipoOperacion = 'INVENTARIO_FISICO' AND h.stockNuevo < h.stockAnterior) THEN h.valorTotal ELSE 0 END), 0) as valorTotalDecrementos, " +
           "COALESCE(SUM(CASE WHEN h.tipoOperacion = 'AJUSTE' OR (h.tipoOperacion = 'INVENTARIO_FISICO' AND h.stockNuevo = h.stockAnterior) THEN h.valorTotal ELSE 0 END), 0) as valorTotalAjustes, " +
           "COALESCE(SUM(h.valorTotal), 0) as valorTotalMovimientos " +
           "FROM HistorialInventario h WHERE h.empresa.id = :empresaId")
    Object[] getEstadisticasByEmpresaId(@Param("empresaId") Long empresaId);

    /**
     * Obtener estadísticas de inventario por empresa y rango de fechas
     */
    @Query("SELECT " +
           "COUNT(h) as totalOperaciones, " +
           "COUNT(CASE WHEN h.tipoOperacion = 'INCREMENTO' OR (h.tipoOperacion = 'INVENTARIO_FISICO' AND h.stockNuevo > h.stockAnterior) THEN 1 END) as totalIncrementos, " +
           "COUNT(CASE WHEN h.tipoOperacion = 'DECREMENTO' OR (h.tipoOperacion = 'INVENTARIO_FISICO' AND h.stockNuevo < h.stockAnterior) THEN 1 END) as totalDecrementos, " +
           "COUNT(CASE WHEN h.tipoOperacion = 'AJUSTE' OR (h.tipoOperacion = 'INVENTARIO_FISICO' AND h.stockNuevo = h.stockAnterior) THEN 1 END) as totalAjustes, " +
           "COALESCE(SUM(CASE WHEN h.tipoOperacion = 'INCREMENTO' OR (h.tipoOperacion = 'INVENTARIO_FISICO' AND h.stockNuevo > h.stockAnterior) THEN h.valorTotal ELSE 0 END), 0) as valorTotalIncrementos, " +
           "COALESCE(SUM(CASE WHEN h.tipoOperacion = 'DECREMENTO' OR (h.tipoOperacion = 'INVENTARIO_FISICO' AND h.stockNuevo < h.stockAnterior) THEN h.valorTotal ELSE 0 END), 0) as valorTotalDecrementos, " +
           "COALESCE(SUM(CASE WHEN h.tipoOperacion = 'AJUSTE' OR (h.tipoOperacion = 'INVENTARIO_FISICO' AND h.stockNuevo = h.stockAnterior) THEN h.valorTotal ELSE 0 END), 0) as valorTotalAjustes, " +
           "COALESCE(SUM(h.valorTotal), 0) as valorTotalMovimientos " +
           "FROM HistorialInventario h WHERE h.empresa.id = :empresaId AND h.fechaOperacion BETWEEN :fechaInicio AND :fechaFin")
    Object[] getEstadisticasByEmpresaIdAndFechaOperacionBetween(
        @Param("empresaId") Long empresaId, 
        @Param("fechaInicio") LocalDateTime fechaInicio, 
        @Param("fechaFin") LocalDateTime fechaFin
    );

    /**
     * Obtener productos más movidos en inventario
     */
    @Query("SELECT h.producto.id, h.producto.nombre, COUNT(h) as totalOperaciones " +
           "FROM HistorialInventario h WHERE h.empresa.id = :empresaId " +
           "GROUP BY h.producto.id, h.producto.nombre " +
           "ORDER BY totalOperaciones DESC")
    List<Object[]> getProductosMasMovidos(@Param("empresaId") Long empresaId, Pageable pageable);

    /**
     * Obtener usuarios más activos en inventario
     */
    @Query("SELECT h.usuario.id, h.usuario.nombre, COUNT(h) as totalOperaciones " +
           "FROM HistorialInventario h WHERE h.empresa.id = :empresaId " +
           "GROUP BY h.usuario.id, h.usuario.nombre " +
           "ORDER BY totalOperaciones DESC")
    List<Object[]> getUsuariosMasActivos(@Param("empresaId") Long empresaId, Pageable pageable);
} 