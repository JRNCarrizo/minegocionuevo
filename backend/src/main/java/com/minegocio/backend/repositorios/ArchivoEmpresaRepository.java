package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.ArchivoEmpresa;
import com.minegocio.backend.entidades.Empresa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio para la gestión de archivos de empresa
 */
@Repository
public interface ArchivoEmpresaRepository extends JpaRepository<ArchivoEmpresa, Long> {

    /**
     * Busca archivos por empresa
     */
    List<ArchivoEmpresa> findByEmpresa(Empresa empresa);

    /**
     * Busca archivos activos por empresa
     */
    List<ArchivoEmpresa> findByEmpresaAndActivoTrue(Empresa empresa);

    /**
     * Busca archivos por empresa y tipo
     */
    List<ArchivoEmpresa> findByEmpresaAndTipoArchivoAndActivoTrue(Empresa empresa, String tipoArchivo);

    /**
     * Busca archivo por URL
     */
    Optional<ArchivoEmpresa> findByUrlArchivo(String urlArchivo);

    /**
     * Busca archivo por public_id de Cloudinary
     */
    Optional<ArchivoEmpresa> findByPublicId(String publicId);

    /**
     * Cuenta archivos activos por empresa
     */
    Long countByEmpresaAndActivoTrue(Empresa empresa);

    /**
     * Suma el tamaño total de archivos activos por empresa
     */
    @Query("SELECT COALESCE(SUM(a.tamañoBytes), 0) FROM ArchivoEmpresa a WHERE a.empresa = :empresa AND a.activo = true")
    Long sumTamañoBytesByEmpresaAndActivoTrue(@Param("empresa") Empresa empresa);

    /**
     * Suma el tamaño total de archivos activos por empresa y tipo
     */
    @Query("SELECT COALESCE(SUM(a.tamañoBytes), 0) FROM ArchivoEmpresa a WHERE a.empresa = :empresa AND a.tipoArchivo = :tipoArchivo AND a.activo = true")
    Long sumTamañoBytesByEmpresaAndTipoArchivoAndActivoTrue(@Param("empresa") Empresa empresa, @Param("tipoArchivo") String tipoArchivo);

    /**
     * Obtiene estadísticas de almacenamiento por empresa
     */
    @Query("SELECT " +
           "COUNT(a) as totalArchivos, " +
           "COALESCE(SUM(a.tamañoBytes), 0) as tamañoTotalBytes, " +
           "COALESCE(SUM(a.tamañoMB), 0) as tamañoTotalMB " +
           "FROM ArchivoEmpresa a " +
           "WHERE a.empresa = :empresa AND a.activo = true")
    Object[] getEstadisticasAlmacenamiento(@Param("empresa") Empresa empresa);

    /**
     * Obtiene estadísticas de almacenamiento por empresa y tipo
     */
    @Query("SELECT " +
           "COUNT(a) as totalArchivos, " +
           "COALESCE(SUM(a.tamañoBytes), 0) as tamañoTotalBytes, " +
           "COALESCE(SUM(a.tamañoMB), 0) as tamañoTotalMB " +
           "FROM ArchivoEmpresa a " +
           "WHERE a.empresa = :empresa AND a.tipoArchivo = :tipoArchivo AND a.activo = true")
    Object[] getEstadisticasAlmacenamientoPorTipo(@Param("empresa") Empresa empresa, @Param("tipoArchivo") String tipoArchivo);
}
