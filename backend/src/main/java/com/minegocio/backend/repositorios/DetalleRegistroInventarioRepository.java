package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.DetalleRegistroInventario;
import com.minegocio.backend.entidades.RegistroInventario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DetalleRegistroInventarioRepository extends JpaRepository<DetalleRegistroInventario, Long> {
    
    /**
     * Buscar detalles por registro de inventario
     */
    List<DetalleRegistroInventario> findByRegistroInventarioOrderByNombreProducto(RegistroInventario registroInventario);
    
    /**
     * Buscar detalles por registro de inventario (sin orden específico)
     */
    List<DetalleRegistroInventario> findByRegistroInventario(RegistroInventario registroInventario);
}
