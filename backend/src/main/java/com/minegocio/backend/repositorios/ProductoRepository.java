package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.Producto;
import com.minegocio.backend.entidades.Empresa;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * Repositorio para la gestión de productos
 */
@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {

    /**
     * Busca productos por empresa
     */
    Page<Producto> findByEmpresa(Empresa empresa, Pageable pageable);

    /**
     * Busca productos activos por empresa
     */
    Page<Producto> findByEmpresaAndActivoTrue(Empresa empresa, Pageable pageable);

    /**
     * Busca productos por nombre (búsqueda parcial) y empresa
     */
    Page<Producto> findByEmpresaAndNombreContainingIgnoreCase(Empresa empresa, String nombre, Pageable pageable);

    /**
     * Busca productos por categoría y empresa
     */
    Page<Producto> findByEmpresaAndCategoriaIgnoreCase(Empresa empresa, String categoria, Pageable pageable);

    /**
     * Busca productos por marca y empresa
     */
    Page<Producto> findByEmpresaAndMarcaIgnoreCase(Empresa empresa, String marca, Pageable pageable);

    /**
     * Busca productos destacados por empresa
     */
    List<Producto> findByEmpresaAndDestacadoTrueAndActivoTrue(Empresa empresa);

    /**
     * Busca productos con stock bajo (menor o igual al stock mínimo)
     */
    @Query("SELECT p FROM Producto p WHERE p.empresa = :empresa AND p.stock <= p.stockMinimo AND p.activo = true")
    List<Producto> findProductosConStockBajo(@Param("empresa") Empresa empresa);

    /**
     * Busca productos por rango de precios y empresa
     */
    @Query("SELECT p FROM Producto p WHERE p.empresa = :empresa AND p.precio BETWEEN :precioMin AND :precioMax AND p.activo = true")
    Page<Producto> findByEmpresaAndPrecioBetween(@Param("empresa") Empresa empresa, 
                                               @Param("precioMin") BigDecimal precioMin, 
                                               @Param("precioMax") BigDecimal precioMax, 
                                               Pageable pageable);

    /**
     * Busca producto por ID y empresa (para seguridad multi-tenant)
     */
    Optional<Producto> findByIdAndEmpresa(Long id, Empresa empresa);

    /**
     * Cuenta productos activos por empresa
     */
    @Query("SELECT COUNT(p) FROM Producto p WHERE p.empresa = :empresa AND p.activo = true")
    Long contarProductosActivosPorEmpresa(@Param("empresa") Empresa empresa);

    /**
     * Obtiene todas las categorías únicas de una empresa
     */
    @Query("SELECT DISTINCT p.categoria FROM Producto p WHERE p.empresa = :empresa AND p.categoria IS NOT NULL AND p.activo = true ORDER BY p.categoria")
    List<String> findCategoriasPorEmpresa(@Param("empresa") Empresa empresa);

    /**
     * Obtiene todas las marcas únicas de una empresa
     */
    @Query("SELECT DISTINCT p.marca FROM Producto p WHERE p.empresa = :empresa AND p.marca IS NOT NULL AND p.activo = true ORDER BY p.marca")
    List<String> findMarcasPorEmpresa(@Param("empresa") Empresa empresa);

    /**
     * Busca productos más vendidos por empresa
     */
    @Query("SELECT p FROM Producto p JOIN p.detallesPedidos dp GROUP BY p ORDER BY SUM(dp.cantidad) DESC")
    List<Producto> findProductosMasVendidosPorEmpresa(@Param("empresa") Empresa empresa, Pageable pageable);

    /**
     * Búsqueda avanzada de productos
     */
    @Query("SELECT p FROM Producto p WHERE p.empresa = :empresa " +
           "AND (:nombre IS NULL OR LOWER(p.nombre) LIKE LOWER(CONCAT('%', :nombre, '%'))) " +
           "AND (:categoria IS NULL OR LOWER(p.categoria) = LOWER(:categoria)) " +
           "AND (:marca IS NULL OR LOWER(p.marca) = LOWER(:marca)) " +
           "AND (:precioMin IS NULL OR p.precio >= :precioMin) " +
           "AND (:precioMax IS NULL OR p.precio <= :precioMax) " +
           "AND p.activo = true")
    Page<Producto> busquedaAvanzada(@Param("empresa") Empresa empresa,
                                   @Param("nombre") String nombre,
                                   @Param("categoria") String categoria,
                                   @Param("marca") String marca,
                                   @Param("precioMin") BigDecimal precioMin,
                                   @Param("precioMax") BigDecimal precioMax,
                                   Pageable pageable);

    /**
     * Busca productos activos por empresa usando ID
     */
    List<Producto> findByEmpresaIdAndActivoTrue(Long empresaId);
    
    /**
     * Busca productos activos por empresa usando ID con paginación
     */
    Page<Producto> findByEmpresaIdAndActivoTrue(Long empresaId, Pageable pageable);
    
    /**
     * Busca producto por ID y empresa ID
     */
    Optional<Producto> findByIdAndEmpresaIdAndActivoTrue(Long id, Long empresaId);
    
    /**
     * Busca productos por categoría y empresa ID
     */
    List<Producto> findByEmpresaIdAndCategoriaAndActivoTrue(Long empresaId, String categoria);
    
    /**
     * Búsqueda por nombre o categoría
     */
    @Query("SELECT p FROM Producto p WHERE p.empresa.id = :empresaId AND p.activo = true " +
           "AND (LOWER(p.nombre) LIKE LOWER(CONCAT('%', :termino, '%')) OR LOWER(p.categoria) LIKE LOWER(CONCAT('%', :termino, '%')))")
    List<Producto> buscarPorNombreOCategoria(@Param("empresaId") Long empresaId, @Param("termino") String termino);

    /**
     * Busca productos por empresa ID y estado específico
     */
    List<Producto> findByEmpresaIdAndActivo(Long empresaId, Boolean activo);
    
    /**
     * Busca productos por empresa ID y estado específico con paginación
     */
    Page<Producto> findByEmpresaIdAndActivo(Long empresaId, Boolean activo, Pageable pageable);
    
    /**
     * Busca TODOS los productos por empresa ID (activos e inactivos)
     */
    List<Producto> findByEmpresaId(Long empresaId);
    
    /**
     * Busca TODOS los productos por empresa ID con paginación (activos e inactivos)
     */
    Page<Producto> findByEmpresaId(Long empresaId, Pageable pageable);
    
    /**
     * Busca producto por ID y empresa ID (sin filtro de activo)
     */
    Optional<Producto> findByIdAndEmpresaId(Long id, Long empresaId);
}
