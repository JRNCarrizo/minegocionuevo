package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.Empresa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repositorio para la gestión de empresas
 */
@Repository
public interface EmpresaRepository extends JpaRepository<Empresa, Long> {

    /**
     * Busca una empresa por su subdominio
     */
    Optional<Empresa> findBySubdominio(String subdominio);

    /**
     * Busca una empresa por su email
     */
    Optional<Empresa> findByEmail(String email);

    /**
     * Verifica si existe una empresa con el subdominio dado
     */
    boolean existsBySubdominio(String subdominio);

    /**
     * Verifica si existe una empresa con el email dado
     */
    boolean existsByEmail(String email);

    /**
     * Busca empresas activas
     */
    List<Empresa> findByActivaTrue();

    /**
     * Busca empresas por estado de suscripción
     */
    List<Empresa> findByEstadoSuscripcion(Empresa.EstadoSuscripcion estado);

    /**
     * Busca empresas cuya prueba gratuita ha expirado
     */
    @Query("SELECT e FROM Empresa e WHERE e.estadoSuscripcion = 'PRUEBA' AND e.fechaFinPrueba < :fecha")
    List<Empresa> findEmpresasConPruebaExpirada(@Param("fecha") LocalDateTime fecha);

    /**
     * Busca empresas cuya prueba expira en los próximos días
     */
    @Query("SELECT e FROM Empresa e WHERE e.estadoSuscripcion = 'PRUEBA' AND e.fechaFinPrueba BETWEEN :fechaInicio AND :fechaFin")
    List<Empresa> findEmpresasConPruebaPorExpirar(@Param("fechaInicio") LocalDateTime fechaInicio, 
                                                  @Param("fechaFin") LocalDateTime fechaFin);

    /**
     * Cuenta el total de empresas activas
     */
    @Query("SELECT COUNT(e) FROM Empresa e WHERE e.activa = true")
    Long contarEmpresasActivas();

    /**
     * Busca empresas creadas en un rango de fechas
     */
    @Query("SELECT e FROM Empresa e WHERE e.fechaCreacion BETWEEN :fechaInicio AND :fechaFin")
    List<Empresa> findEmpresasCreadasEntre(@Param("fechaInicio") LocalDateTime fechaInicio, 
                                          @Param("fechaFin") LocalDateTime fechaFin);

    /**
     * Cuenta empresas por estado de suscripción
     */
    long countByEstadoSuscripcion(Empresa.EstadoSuscripcion estado);

    /**
     * Cuenta empresas creadas entre dos fechas
     */
    long countByFechaCreacionBetween(LocalDateTime fechaInicio, LocalDateTime fechaFin);

    /**
     * Cuenta empresas con último acceso antes de una fecha
     * Nota: Este método no está implementado porque Empresa no tiene campo ultimoAcceso
     */
    // long countByUltimoAccesoBefore(LocalDateTime fecha);

    /**
     * Busca empresas dadas de baja
     */
    List<Empresa> findByActivaFalseAndFechaBajaIsNotNull();

    /**
     * Cuenta empresas activas
     */
    long countByActivaTrue();

    /**
     * Cuenta empresas dadas de baja
     */
    long countByActivaFalseAndFechaBajaIsNotNull();

    /**
     * Cuenta empresas con baja permanente
     */
    long countByBajaPermanenteTrue();
}
