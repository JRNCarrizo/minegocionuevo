package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.PermisoUsuario;
import com.minegocio.backend.entidades.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio para la gestión de permisos de usuario
 */
@Repository
public interface PermisoUsuarioRepository extends JpaRepository<PermisoUsuario, Long> {

    /**
     * Busca todos los permisos de un usuario
     */
    List<PermisoUsuario> findByUsuario(Usuario usuario);

    /**
     * Busca un permiso específico de un usuario
     */
    Optional<PermisoUsuario> findByUsuarioAndFuncionalidad(Usuario usuario, String funcionalidad);

    /**
     * Verifica si un usuario tiene un permiso específico
     */
    @Query("SELECT p.permitido FROM PermisoUsuario p WHERE p.usuario = :usuario AND p.funcionalidad = :funcionalidad")
    Optional<Boolean> tienePermiso(@Param("usuario") Usuario usuario, @Param("funcionalidad") String funcionalidad);

    /**
     * Obtiene todas las funcionalidades permitidas para un usuario
     */
    @Query("SELECT p.funcionalidad FROM PermisoUsuario p WHERE p.usuario = :usuario AND p.permitido = true")
    List<String> obtenerFuncionalidadesPermitidas(@Param("usuario") Usuario usuario);

    /**
     * Elimina todos los permisos de un usuario
     */
    void deleteByUsuario(Usuario usuario);

    /**
     * Cuenta los permisos de un usuario
     */
    long countByUsuario(Usuario usuario);
}








