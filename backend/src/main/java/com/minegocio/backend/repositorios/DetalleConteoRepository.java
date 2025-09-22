package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.DetalleConteo;
import com.minegocio.backend.entidades.ConteoSector;
import com.minegocio.backend.entidades.InventarioPorSector;
import com.minegocio.backend.entidades.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DetalleConteoRepository extends JpaRepository<DetalleConteo, Long> {
    
    /**
     * Buscar detalles de conteo por conteo de sector
     */
    List<DetalleConteo> findByConteoSectorOrderByProductoNombre(ConteoSector conteoSector);
    
    /**
     * Buscar detalles de conteo por inventario por sector
     */
    List<DetalleConteo> findByInventarioPorSectorOrderByProductoNombre(InventarioPorSector inventarioPorSector);
    
    /**
     * Buscar detalles de conteo por conteo de sector y estado
     */
    List<DetalleConteo> findByConteoSectorAndEstadoOrderByProductoNombre(ConteoSector conteoSector, DetalleConteo.EstadoDetalle estado);
    
    /**
     * Buscar detalles de conteo por inventario por sector y estado
     */
    List<DetalleConteo> findByInventarioPorSectorAndEstadoOrderByProductoNombre(InventarioPorSector inventarioPorSector, DetalleConteo.EstadoDetalle estado);
    
    /**
     * Buscar detalle de conteo por conteo de sector y producto
     */
    Optional<DetalleConteo> findByConteoSectorAndProducto(ConteoSector conteoSector, Producto producto);
    
    /**
     * Buscar detalle de conteo por inventario por sector y producto
     */
    Optional<DetalleConteo> findByInventarioPorSectorAndProducto(InventarioPorSector inventarioPorSector, Producto producto);
    
    /**
     * Buscar detalles de conteo con diferencias por conteo de sector
     */
    @Query("SELECT d FROM DetalleConteo d WHERE d.conteoSector = :conteoSector AND d.diferenciaEntreConteos != 0")
    List<DetalleConteo> findDetallesConDiferencias(@Param("conteoSector") ConteoSector conteoSector);
    
    /**
     * Buscar detalles de conteo con diferencias por inventario por sector
     */
    @Query("SELECT d FROM DetalleConteo d WHERE d.inventarioPorSector = :inventarioPorSector AND d.diferenciaEntreConteos != 0")
    List<DetalleConteo> findDetallesConDiferenciasPorInventario(@Param("inventarioPorSector") InventarioPorSector inventarioPorSector);
    
    /**
     * Contar detalles de conteo por conteo de sector y estado
     */
    long countByConteoSectorAndEstado(ConteoSector conteoSector, DetalleConteo.EstadoDetalle estado);
    
    /**
     * Contar detalles de conteo por inventario por sector y estado
     */
    long countByInventarioPorSectorAndEstado(InventarioPorSector inventarioPorSector, DetalleConteo.EstadoDetalle estado);
    
    /**
     * Buscar detalles de conteo por producto (para verificar si ya fue contado)
     */
    @Query("SELECT d FROM DetalleConteo d WHERE d.producto = :producto AND (d.conteoSector.estado IN ('EN_PROGRESO', 'ESPERANDO_VERIFICACION', 'CON_DIFERENCIAS') OR d.inventarioPorSector.estado IN ('EN_PROGRESO', 'ESPERANDO_VERIFICACION', 'CON_DIFERENCIAS'))")
    List<DetalleConteo> findDetallesActivosPorProducto(@Param("producto") Producto producto);
}

