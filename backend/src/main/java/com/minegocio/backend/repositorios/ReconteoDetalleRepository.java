package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.ReconteoDetalle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReconteoDetalleRepository extends JpaRepository<ReconteoDetalle, Long> {

    /**
     * Buscar reconteos por conteo sector y producto
     */
    List<ReconteoDetalle> findByConteoSectorIdAndProductoIdAndEliminadoFalse(Long conteoSectorId, Long productoId);

    /**
     * Buscar reconteos por conteo sector, producto y número de reconteo
     */
    List<ReconteoDetalle> findByConteoSectorIdAndProductoIdAndNumeroReconteoAndEliminadoFalse(
            Long conteoSectorId, Long productoId, Integer numeroReconteo);

    /**
     * Buscar reconteos por conteo sector y número de reconteo
     */
    List<ReconteoDetalle> findByConteoSectorIdAndNumeroReconteoAndEliminadoFalse(
            Long conteoSectorId, Integer numeroReconteo);

    /**
     * Buscar reconteos por usuario y conteo sector
     */
    List<ReconteoDetalle> findByUsuarioIdAndConteoSectorIdAndEliminadoFalse(Long usuarioId, Long conteoSectorId);

    /**
     * Buscar reconteos por usuario, conteo sector y número de reconteo
     */
    Optional<ReconteoDetalle> findByUsuarioIdAndConteoSectorIdAndProductoIdAndNumeroReconteoAndEliminadoFalse(
            Long usuarioId, Long conteoSectorId, Long productoId, Integer numeroReconteo);

    /**
     * Obtener el número máximo de reconteo para un sector
     */
    @Query("SELECT COALESCE(MAX(r.numeroReconteo), 0) FROM ReconteoDetalle r WHERE r.conteoSector.id = :conteoSectorId AND r.eliminado = false")
    Integer findMaxNumeroReconteoByConteoSectorId(@Param("conteoSectorId") Long conteoSectorId);

    /**
     * Contar reconteos por sector y número de reconteo
     */
    @Query("SELECT COUNT(DISTINCT r.usuario.id) FROM ReconteoDetalle r WHERE r.conteoSector.id = :conteoSectorId AND r.numeroReconteo = :numeroReconteo AND r.eliminado = false")
    Long countUsuariosReconteoBySectorAndNumero(@Param("conteoSectorId") Long conteoSectorId, @Param("numeroReconteo") Integer numeroReconteo);
}

