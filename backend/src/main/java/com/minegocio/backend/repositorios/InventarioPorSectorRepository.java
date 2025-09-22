package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.InventarioPorSector;
import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Sector;
import com.minegocio.backend.entidades.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventarioPorSectorRepository extends JpaRepository<InventarioPorSector, Long> {
    
    /**
     * Buscar inventarios por sector por empresa
     */
    List<InventarioPorSector> findByEmpresaOrderByFechaInicioDesc(Empresa empresa);
    
    /**
     * Buscar inventarios por sector por empresa y estado
     */
    List<InventarioPorSector> findByEmpresaAndEstadoOrderByFechaInicioDesc(Empresa empresa, InventarioPorSector.EstadoInventario estado);
    
    /**
     * Buscar inventarios por sector por sector
     */
    List<InventarioPorSector> findBySectorOrderByFechaInicioDesc(Sector sector);
    
    /**
     * Buscar inventario por sector activo por empresa y sector
     */
    @Query("SELECT i FROM InventarioPorSector i WHERE i.empresa = :empresa AND i.sector = :sector AND i.estado IN ('PENDIENTE', 'EN_PROGRESO', 'ESPERANDO_VERIFICACION', 'CON_DIFERENCIAS') ORDER BY i.fechaInicio DESC")
    Optional<InventarioPorSector> findInventarioActivoByEmpresaAndSector(@Param("empresa") Empresa empresa, @Param("sector") Sector sector);
    
    /**
     * Buscar inventarios por sector asignados a un usuario
     */
    @Query("SELECT i FROM InventarioPorSector i WHERE (i.usuarioAsignado1 = :usuario OR i.usuarioAsignado2 = :usuario) AND i.estado IN ('PENDIENTE', 'EN_PROGRESO', 'ESPERANDO_VERIFICACION', 'CON_DIFERENCIAS')")
    List<InventarioPorSector> findInventariosAsignadosAUsuario(@Param("usuario") Usuario usuario);
    
    /**
     * Buscar inventario por sector específico asignado a un usuario
     */
    @Query("SELECT i FROM InventarioPorSector i WHERE i.id = :inventarioId AND (i.usuarioAsignado1 = :usuario OR i.usuarioAsignado2 = :usuario)")
    Optional<InventarioPorSector> findInventarioAsignadoAUsuario(@Param("inventarioId") Long inventarioId, @Param("usuario") Usuario usuario);
    
    /**
     * Contar inventarios por sector por empresa y estado
     */
    long countByEmpresaAndEstado(Empresa empresa, InventarioPorSector.EstadoInventario estado);
    
    /**
     * Buscar inventarios por sector por usuario administrador
     */
    @Query("SELECT i FROM InventarioPorSector i WHERE i.usuarioAdministrador.id = :usuarioAdministradorId ORDER BY i.fechaInicio DESC")
    List<InventarioPorSector> findByUsuarioAdministradorOrderByFechaInicioDesc(@Param("usuarioAdministradorId") Long usuarioAdministradorId);
}
