package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.RegistroInventario;
import com.minegocio.backend.entidades.InventarioCompleto;
import com.minegocio.backend.entidades.Empresa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RegistroInventarioRepository extends JpaRepository<RegistroInventario, Long> {
    
    /**
     * Buscar registros por inventario completo
     */
    List<RegistroInventario> findByInventarioCompletoOrderByFechaGeneracionDesc(InventarioCompleto inventarioCompleto);
    
    /**
     * Buscar registro por inventario completo (el más reciente)
     */
    RegistroInventario findFirstByInventarioCompletoOrderByFechaGeneracionDesc(InventarioCompleto inventarioCompleto);
    
    /**
     * Buscar registros por empresa ordenados por fecha de generación descendente
     */
    List<RegistroInventario> findByEmpresaOrderByFechaGeneracionDesc(Empresa empresa);
}
