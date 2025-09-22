package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.ConteoSector;
import com.minegocio.backend.entidades.InventarioCompleto;
import com.minegocio.backend.entidades.Sector;
import com.minegocio.backend.entidades.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConteoSectorRepository extends JpaRepository<ConteoSector, Long> {
    
    /**
     * Buscar conteos de sector por inventario completo
     */
    List<ConteoSector> findByInventarioCompleto(InventarioCompleto inventarioCompleto);
    
    /**
     * Buscar conteos de sector por inventario completo ordenados por nombre de sector
     */
    List<ConteoSector> findByInventarioCompletoOrderBySectorNombre(InventarioCompleto inventarioCompleto);
    
    /**
     * Buscar conteos de sector por inventario completo y estado
     */
    List<ConteoSector> findByInventarioCompletoAndEstadoOrderBySectorNombre(InventarioCompleto inventarioCompleto, ConteoSector.EstadoConteo estado);
    
    /**
     * Buscar conteo de sector por inventario completo y sector
     */
    Optional<ConteoSector> findByInventarioCompletoAndSector(InventarioCompleto inventarioCompleto, Sector sector);
    
    /**
     * Buscar conteos de sector asignados a un usuario
     */
    @Query("SELECT c FROM ConteoSector c WHERE (c.usuarioAsignado1 = :usuario OR c.usuarioAsignado2 = :usuario) AND c.estado IN ('PENDIENTE', 'EN_PROGRESO', 'ESPERANDO_VERIFICACION', 'CON_DIFERENCIAS')")
    List<ConteoSector> findConteosAsignadosAUsuario(@Param("usuario") Usuario usuario);
    
    /**
     * Buscar conteo de sector específico asignado a un usuario
     */
    @Query("SELECT c FROM ConteoSector c WHERE c.id = :conteoId AND (c.usuarioAsignado1 = :usuario OR c.usuarioAsignado2 = :usuario)")
    Optional<ConteoSector> findConteoAsignadoAUsuario(@Param("conteoId") Long conteoId, @Param("usuario") Usuario usuario);
    
    /**
     * Contar conteos de sector por inventario completo y estado
     */
    long countByInventarioCompletoAndEstado(InventarioCompleto inventarioCompleto, ConteoSector.EstadoConteo estado);
    
    /**
     * Buscar conteos de sector pendientes de verificación
     */
    @Query("SELECT c FROM ConteoSector c WHERE c.inventarioCompleto = :inventario AND c.estado = 'ESPERANDO_VERIFICACION'")
    List<ConteoSector> findConteosPendientesVerificacion(@Param("inventario") InventarioCompleto inventario);

}
