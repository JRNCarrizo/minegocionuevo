package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.HistorialCargaProductos;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface HistorialCargaProductosRepository extends JpaRepository<HistorialCargaProductos, Long> {
    
    // Buscar por empresa
    Page<HistorialCargaProductos> findByEmpresaIdOrderByFechaOperacionDesc(Long empresaId, Pageable pageable);
    
    // Buscar por empresa y producto
    Page<HistorialCargaProductos> findByEmpresaIdAndProductoIdOrderByFechaOperacionDesc(
        Long empresaId, Long productoId, Pageable pageable);
    
    // Buscar por empresa y tipo de operación
    Page<HistorialCargaProductos> findByEmpresaIdAndTipoOperacionOrderByFechaOperacionDesc(
        Long empresaId, HistorialCargaProductos.TipoOperacion tipoOperacion, Pageable pageable);
    
    // Buscar por empresa y usuario
    Page<HistorialCargaProductos> findByEmpresaIdAndUsuarioIdOrderByFechaOperacionDesc(
        Long empresaId, Long usuarioId, Pageable pageable);
    
    // Buscar por empresa y rango de fechas
    @Query("SELECT h FROM HistorialCargaProductos h WHERE h.empresa.id = :empresaId " +
           "AND h.fechaOperacion BETWEEN :fechaInicio AND :fechaFin " +
           "ORDER BY h.fechaOperacion DESC")
    Page<HistorialCargaProductos> findByEmpresaIdAndFechaOperacionBetween(
        @Param("empresaId") Long empresaId,
        @Param("fechaInicio") LocalDateTime fechaInicio,
        @Param("fechaFin") LocalDateTime fechaFin,
        Pageable pageable);
    
    // Búsqueda avanzada con múltiples filtros
    @Query("SELECT h FROM HistorialCargaProductos h WHERE h.empresa.id = :empresaId " +
           "AND (:productoId IS NULL OR h.producto.id = :productoId) " +
           "AND (:tipoOperacion IS NULL OR h.tipoOperacion = :tipoOperacion) " +
           "AND (:usuarioId IS NULL OR h.usuario.id = :usuarioId OR h.usuario.id IS NULL) " +
           "AND (:fechaInicio IS NULL OR h.fechaOperacion >= :fechaInicio) " +
           "AND (:fechaFin IS NULL OR h.fechaOperacion <= :fechaFin) " +
           "AND (:codigoBarras IS NULL OR h.codigoBarras LIKE %:codigoBarras%) " +
           "ORDER BY h.fechaOperacion DESC")
    Page<HistorialCargaProductos> buscarConFiltros(
        @Param("empresaId") Long empresaId,
        @Param("productoId") Long productoId,
        @Param("tipoOperacion") HistorialCargaProductos.TipoOperacion tipoOperacion,
        @Param("usuarioId") Long usuarioId,
        @Param("fechaInicio") LocalDateTime fechaInicio,
        @Param("fechaFin") LocalDateTime fechaFin,
        @Param("codigoBarras") String codigoBarras,
        Pageable pageable);
    
    // Estadísticas por empresa
    @Query("SELECT COUNT(h) FROM HistorialCargaProductos h WHERE h.empresa.id = :empresaId")
    Long countByEmpresaId(@Param("empresaId") Long empresaId);
    
    // Estadísticas por empresa y tipo de operación
    @Query("SELECT h.tipoOperacion, COUNT(h) FROM HistorialCargaProductos h " +
           "WHERE h.empresa.id = :empresaId GROUP BY h.tipoOperacion")
    List<Object[]> countByEmpresaIdAndTipoOperacion(@Param("empresaId") Long empresaId);
    
    // Total de productos cargados por empresa
    @Query("SELECT SUM(h.cantidad) FROM HistorialCargaProductos h WHERE h.empresa.id = :empresaId " +
           "AND h.tipoOperacion IN ('CARGA_INICIAL', 'REPOSICION', 'AJUSTE_POSITIVO', 'DEVOLUCION', 'TRANSFERENCIA_ENTRADA')")
    Long sumCantidadCargadaByEmpresaId(@Param("empresaId") Long empresaId);
    
    // Valor total de productos cargados por empresa
    @Query("SELECT SUM(h.valorTotal) FROM HistorialCargaProductos h WHERE h.empresa.id = :empresaId " +
           "AND h.tipoOperacion IN ('CARGA_INICIAL', 'REPOSICION', 'AJUSTE_POSITIVO', 'DEVOLUCION', 'TRANSFERENCIA_ENTRADA')")
    Double sumValorTotalCargadoByEmpresaId(@Param("empresaId") Long empresaId);
    
    // Buscar por código de barras
    List<HistorialCargaProductos> findByEmpresaIdAndCodigoBarrasOrderByFechaOperacionDesc(
        Long empresaId, String codigoBarras);
    
    // Últimas operaciones por empresa (para dashboard)
    @Query("SELECT h FROM HistorialCargaProductos h WHERE h.empresa.id = :empresaId " +
           "ORDER BY h.fechaOperacion DESC")
    List<HistorialCargaProductos> findTop10ByEmpresaIdOrderByFechaOperacionDesc(@Param("empresaId") Long empresaId);
} 