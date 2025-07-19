package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.Usuario;
import com.minegocio.backend.entidades.Empresa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio para la gestión de usuarios
 */
@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    /**
     * Busca un usuario por su email
     */
    Optional<Usuario> findByEmail(String email);

    /**
     * Busca usuarios por empresa
     */
    List<Usuario> findByEmpresa(Empresa empresa);

    /**
     * Busca usuarios activos por empresa
     */
    List<Usuario> findByEmpresaAndActivoTrue(Empresa empresa);

    /**
     * Busca usuarios por rol y empresa
     */
    List<Usuario> findByRolAndEmpresa(Usuario.RolUsuario rol, Empresa empresa);

    /**
     * Verifica si existe un usuario con el email dado
     */
    boolean existsByEmail(String email);

    /**
     * Busca usuario por token de verificación
     */
    Optional<Usuario> findByTokenVerificacion(String token);

    /**
     * Busca usuarios por empresa y estado de verificación de email
     */
    List<Usuario> findByEmpresaAndEmailVerificado(Empresa empresa, Boolean emailVerificado);

    /**
     * Cuenta usuarios activos por empresa
     */
    @Query("SELECT COUNT(u) FROM Usuario u WHERE u.empresa = :empresa AND u.activo = true")
    Long contarUsuariosActivosPorEmpresa(@Param("empresa") Empresa empresa);

    /**
     * Busca administradores de una empresa
     */
    @Query("SELECT u FROM Usuario u WHERE u.empresa = :empresa AND u.rol = 'ADMINISTRADOR' AND u.activo = true")
    List<Usuario> findAdministradoresPorEmpresa(@Param("empresa") Empresa empresa);

    /**
     * Busca el usuario administrador principal de una empresa (el primero creado)
     */
    @Query("SELECT u FROM Usuario u WHERE u.empresa = :empresa AND u.rol = 'ADMINISTRADOR' ORDER BY u.fechaCreacion ASC")
    Optional<Usuario> findAdministradorPrincipal(@Param("empresa") Empresa empresa);

    /**
     * Busca usuario por ID y empresa ID
     */
    Optional<Usuario> findByIdAndEmpresaId(Long id, Long empresaId);

    /**
     * Cuenta usuarios activos en todo el sistema
     */
    Long countByActivoTrue();
}
