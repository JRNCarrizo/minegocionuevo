package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.ProductoFavorito;
import com.minegocio.backend.entidades.Cliente;
import com.minegocio.backend.entidades.Producto;
import com.minegocio.backend.entidades.Empresa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductoFavoritoRepository extends JpaRepository<ProductoFavorito, Long> {
    
    /**
     * Obtener todos los productos favoritos de un cliente
     */
    @Query("SELECT pf FROM ProductoFavorito pf WHERE pf.cliente = :cliente AND pf.empresa = :empresa ORDER BY pf.fechaAgregado DESC")
    List<ProductoFavorito> findByClienteAndEmpresa(@Param("cliente") Cliente cliente, @Param("empresa") Empresa empresa);
    
    /**
     * Verificar si un producto es favorito de un cliente
     */
    @Query("SELECT pf FROM ProductoFavorito pf WHERE pf.cliente = :cliente AND pf.producto = :producto AND pf.empresa = :empresa")
    Optional<ProductoFavorito> findByClienteAndProductoAndEmpresa(
        @Param("cliente") Cliente cliente, 
        @Param("producto") Producto producto, 
        @Param("empresa") Empresa empresa
    );
    
    /**
     * Contar productos favoritos de un cliente
     */
    @Query("SELECT COUNT(pf) FROM ProductoFavorito pf WHERE pf.cliente = :cliente AND pf.empresa = :empresa")
    long countByClienteAndEmpresa(@Param("cliente") Cliente cliente, @Param("empresa") Empresa empresa);
    
    /**
     * Eliminar un producto favorito específico
     */
    @Query("DELETE FROM ProductoFavorito pf WHERE pf.cliente = :cliente AND pf.producto = :producto AND pf.empresa = :empresa")
    void deleteByClienteAndProductoAndEmpresa(
        @Param("cliente") Cliente cliente, 
        @Param("producto") Producto producto, 
        @Param("empresa") Empresa empresa
    );
    
    /**
     * Obtener productos favoritos con información del producto
     */
    @Query("SELECT pf FROM ProductoFavorito pf " +
           "JOIN FETCH pf.producto p " +
           "WHERE pf.cliente = :cliente AND pf.empresa = :empresa " +
           "AND p.activo = true " +
           "ORDER BY pf.fechaAgregado DESC")
    List<ProductoFavorito> findFavoritosConProducto(@Param("cliente") Cliente cliente, @Param("empresa") Empresa empresa);
} 