package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.Vehiculo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehiculoRepository extends JpaRepository<Vehiculo, Long> {

    // Buscar todos los vehículos de un transportista
    List<Vehiculo> findByTransportistaIdOrderByMarcaAscModeloAsc(Long transportistaId);

    // Buscar vehículos activos de un transportista
    List<Vehiculo> findByTransportistaIdAndActivoTrueOrderByMarcaAscModeloAsc(Long transportistaId);

    // Buscar vehículo por patente
    Optional<Vehiculo> findByPatente(String patente);

    // Verificar si existe una patente
    boolean existsByPatente(String patente);

    // Buscar vehículos por marca o modelo (búsqueda parcial)
    @Query("SELECT v FROM Vehiculo v WHERE v.transportista.id = :transportistaId AND " +
           "(LOWER(v.marca) LIKE LOWER(CONCAT('%', :busqueda, '%')) OR " +
           "LOWER(v.modelo) LIKE LOWER(CONCAT('%', :busqueda, '%')) OR " +
           "LOWER(v.patente) LIKE LOWER(CONCAT('%', :busqueda, '%'))) " +
           "ORDER BY v.marca ASC, v.modelo ASC")
    List<Vehiculo> buscarPorMarcaModeloOPatente(@Param("transportistaId") Long transportistaId, @Param("busqueda") String busqueda);

    // Contar vehículos activos por transportista
    long countByTransportistaIdAndActivoTrue(Long transportistaId);

    // Buscar vehículos por empresa (a través del transportista)
    @Query("SELECT v FROM Vehiculo v WHERE v.transportista.empresa.id = :empresaId ORDER BY v.transportista.codigoInterno ASC, v.marca ASC")
    List<Vehiculo> findByEmpresaId(@Param("empresaId") Long empresaId);
}
