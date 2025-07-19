package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.SuperAdmin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repositorio para la gestión de super administradores
 */
@Repository
public interface SuperAdminRepository extends JpaRepository<SuperAdmin, Long> {

    /**
     * Busca un super admin por email
     */
    Optional<SuperAdmin> findByEmail(String email);

    /**
     * Verifica si existe un super admin con el email dado
     */
    boolean existsByEmail(String email);

    /**
     * Busca super admins activos
     */
    java.util.List<SuperAdmin> findByActivoTrue();

    /**
     * Busca super admins por rol
     */
    java.util.List<SuperAdmin> findByRol(SuperAdmin.RolSuperAdmin rol);

    /**
     * Busca super admins activos por rol
     */
    java.util.List<SuperAdmin> findByActivoTrueAndRol(SuperAdmin.RolSuperAdmin rol);

    /**
     * Busca super admins con cuentas bloqueadas
     */
    java.util.List<SuperAdmin> findByCuentaBloqueadaTrue();
} 