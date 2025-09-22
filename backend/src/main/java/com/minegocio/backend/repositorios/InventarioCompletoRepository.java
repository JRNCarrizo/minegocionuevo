package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.InventarioCompleto;
import com.minegocio.backend.entidades.Empresa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventarioCompletoRepository extends JpaRepository<InventarioCompleto, Long> {
    
    /**
     * Buscar inventarios completos por empresa
     */
    List<InventarioCompleto> findByEmpresaOrderByFechaInicioDesc(Empresa empresa);
    
    /**
     * Buscar inventarios completos por empresa y estado
     */
    List<InventarioCompleto> findByEmpresaAndEstadoOrderByFechaInicioDesc(Empresa empresa, InventarioCompleto.EstadoInventario estado);
    
    /**
     * Buscar inventario completo activo por empresa
     */
    @Query("SELECT i FROM InventarioCompleto i WHERE i.empresa = :empresa AND i.estado IN ('PENDIENTE', 'EN_PROGRESO') ORDER BY i.fechaInicio DESC")
    Optional<InventarioCompleto> findInventarioActivoByEmpresa(@Param("empresa") Empresa empresa);
    
    /**
     * Contar inventarios completos por empresa y estado
     */
    long countByEmpresaAndEstado(Empresa empresa, InventarioCompleto.EstadoInventario estado);
    
    /**
     * Buscar inventarios completos por usuario administrador
     */
    @Query("SELECT i FROM InventarioCompleto i WHERE i.usuarioAdministrador.id = :usuarioAdministradorId ORDER BY i.fechaInicio DESC")
    List<InventarioCompleto> findByUsuarioAdministradorOrderByFechaInicioDesc(@Param("usuarioAdministradorId") Long usuarioAdministradorId);
}
