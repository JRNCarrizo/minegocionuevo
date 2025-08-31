package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.Transportista;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransportistaRepository extends JpaRepository<Transportista, Long> {

    // Buscar todos los transportistas de una empresa
    List<Transportista> findByEmpresaIdOrderByCodigoInternoAsc(Long empresaId);

    // Buscar transportistas activos de una empresa
    List<Transportista> findByEmpresaIdAndActivoTrueOrderByCodigoInternoAsc(Long empresaId);

    // Buscar transportista por código interno y empresa
    Optional<Transportista> findByCodigoInternoAndEmpresaId(String codigoInterno, Long empresaId);

    // Verificar si existe un código interno en una empresa
    boolean existsByCodigoInternoAndEmpresaId(String codigoInterno, Long empresaId);

    // Buscar transportistas por nombre/apellido (búsqueda parcial)
    @Query("SELECT t FROM Transportista t WHERE t.empresa.id = :empresaId AND " +
           "(LOWER(t.nombreApellido) LIKE LOWER(CONCAT('%', :busqueda, '%')) OR " +
           "LOWER(t.codigoInterno) LIKE LOWER(CONCAT('%', :busqueda, '%'))) " +
           "ORDER BY t.codigoInterno ASC")
    List<Transportista> buscarPorNombreOCodigo(@Param("empresaId") Long empresaId, @Param("busqueda") String busqueda);

    // Contar transportistas activos por empresa
    long countByEmpresaIdAndActivoTrue(Long empresaId);
}
