package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.DetalleRemitoIngreso;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DetalleRemitoIngresoRepository extends JpaRepository<DetalleRemitoIngreso, Long> {
    
    // Buscar detalles por remito de ingreso
    List<DetalleRemitoIngreso> findByRemitoIngresoIdOrderByFechaCreacionAsc(Long remitoIngresoId);
    
    // Buscar detalles por producto
    List<DetalleRemitoIngreso> findByProductoId(Long productoId);
    
    // Eliminar detalles por remito de ingreso
    void deleteByRemitoIngresoId(Long remitoIngresoId);
}












