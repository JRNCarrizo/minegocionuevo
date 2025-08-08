package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.Cliente;
import com.minegocio.backend.entidades.Empresa;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio para la gestión de clientes
 */
@Repository
public interface ClienteRepository extends JpaRepository<Cliente, Long> {

    /**
     * Busca clientes por empresa
     */
    Page<Cliente> findByEmpresa(Empresa empresa, Pageable pageable);

    /**
     * Busca clientes activos por empresa
     */
    Page<Cliente> findByEmpresaAndActivoTrue(Empresa empresa, Pageable pageable);

    /**
     * Busca un cliente por email y empresa
     */
    Optional<Cliente> findByEmailAndEmpresa(String email, Empresa empresa);

    /**
     * Busca clientes por nombre (búsqueda parcial) y empresa
     */
    Page<Cliente> findByEmpresaAndNombreContainingIgnoreCaseOrApellidosContainingIgnoreCase(
            Empresa empresa, String nombre, String apellidos, Pageable pageable);

    /**
     * Busca clientes por tipo y empresa
     */
    List<Cliente> findByEmpresaAndTipo(Empresa empresa, Cliente.TipoCliente tipo);

    /**
     * Verifica si existe un cliente con el email dado en la empresa
     */
    boolean existsByEmailAndEmpresa(String email, Empresa empresa);

    /**
     * Busca cliente por token de verificación
     */
    Optional<Cliente> findByTokenVerificacion(String token);

    /**
     * Busca cliente por token de verificación y empresa ID
     */
    Optional<Cliente> findByTokenVerificacionAndEmpresaId(String token, Long empresaId);

    /**
     * Busca clientes por empresa y estado de verificación de email
     */
    List<Cliente> findByEmpresaAndEmailVerificado(Empresa empresa, Boolean emailVerificado);

    /**
     * Cuenta clientes activos por empresa
     */
    @Query("SELECT COUNT(c) FROM Cliente c WHERE c.empresa = :empresa AND c.activo = true")
    Long contarClientesActivosPorEmpresa(@Param("empresa") Empresa empresa);

    /**
     * Busca clientes que aceptan marketing por empresa
     */
    List<Cliente> findByEmpresaAndAceptaMarketingTrue(Empresa empresa);

    /**
     * Busca clientes por ciudad y empresa
     */
    List<Cliente> findByEmpresaAndCiudadIgnoreCase(Empresa empresa, String ciudad);

    /**
     * Busca cliente por ID y empresa (para seguridad multi-tenant)
     */
    Optional<Cliente> findByIdAndEmpresa(Long id, Empresa empresa);

    /**
     * Busca clientes activos por empresa (sin paginación)
     */
    List<Cliente> findByEmpresaAndActivoTrue(Empresa empresa);

    /**
     * Busca cliente por ID y empresa ID
     */
    Optional<Cliente> findByIdAndEmpresaIdAndActivoTrue(Long id, Long empresaId);

    /**
     * Busca cliente por email y empresa ID
     */
    Optional<Cliente> findByEmailAndEmpresaIdAndActivoTrue(String email, Long empresaId);

    /**
     * Busca cliente por email y empresa ID (sin importar estado de activación)
     */
    Optional<Cliente> findByEmailAndEmpresaId(String email, Long empresaId);

    /**
     * Cuenta clientes activos por empresa
     */
    Long countByEmpresaAndActivoTrue(Empresa empresa);

    /**
     * Busca clientes por término de búsqueda
     */
    @Query("SELECT c FROM Cliente c WHERE c.empresa = :empresa AND c.activo = true " +
           "AND (LOWER(c.nombre) LIKE LOWER(CONCAT('%', :termino, '%')) " +
           "OR LOWER(c.apellidos) LIKE LOWER(CONCAT('%', :termino, '%')) " +
           "OR LOWER(c.email) LIKE LOWER(CONCAT('%', :termino, '%')))")
    List<Cliente> buscarClientesPorTermino(@Param("empresa") Empresa empresa, @Param("termino") String termino);

    /**
     * Cuenta clientes por empresa ID
     */
    long countByEmpresaId(Long empresaId);

    /**
     * Cuenta clientes por empresa
     */
    Long countByEmpresa(Empresa empresa);
}
