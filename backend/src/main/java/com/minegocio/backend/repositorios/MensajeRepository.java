package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.Mensaje;
import com.minegocio.backend.entidades.Cliente;
import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Producto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repositorio para la gestión de mensajes
 */
@Repository
public interface MensajeRepository extends JpaRepository<Mensaje, Long> {

    /**
     * Busca mensajes por empresa
     */
    Page<Mensaje> findByEmpresa(Empresa empresa, Pageable pageable);

    /**
     * Busca mensajes por cliente
     */
    Page<Mensaje> findByCliente(Cliente cliente, Pageable pageable);

    /**
     * Busca mensajes por tipo y empresa
     */
    Page<Mensaje> findByEmpresaAndTipo(Empresa empresa, Mensaje.TipoMensaje tipo, Pageable pageable);

    /**
     * Busca mensajes por estado y empresa
     */
    Page<Mensaje> findByEmpresaAndEstado(Empresa empresa, Mensaje.EstadoMensaje estado, Pageable pageable);

    /**
     * Busca mensajes no leídos por empresa
     */
    List<Mensaje> findByEmpresaAndLeidoFalse(Empresa empresa);

    /**
     * Busca mensajes por producto
     */
    List<Mensaje> findByProducto(Producto producto);

    /**
     * Busca mensaje por ID y empresa (para seguridad multi-tenant)
     */
    Optional<Mensaje> findByIdAndEmpresa(Long id, Empresa empresa);

    /**
     * Cuenta mensajes no leídos por empresa
     */
    @Query("SELECT COUNT(m) FROM Mensaje m WHERE m.empresa = :empresa AND m.leido = false")
    Long contarMensajesNoLeidos(@Param("empresa") Empresa empresa);

    /**
     * Cuenta mensajes pendientes por empresa
     */
    @Query("SELECT COUNT(m) FROM Mensaje m WHERE m.empresa = :empresa AND m.estado = 'PENDIENTE'")
    Long contarMensajesPendientes(@Param("empresa") Empresa empresa);

    /**
     * Busca mensajes recientes por empresa
     */
    @Query("SELECT m FROM Mensaje m WHERE m.empresa = :empresa ORDER BY m.fechaCreacion DESC")
    List<Mensaje> findMensajesRecientes(@Param("empresa") Empresa empresa, Pageable pageable);

    /**
     * Busca mensajes por cliente y estado
     */
    List<Mensaje> findByClienteAndEstado(Cliente cliente, Mensaje.EstadoMensaje estado);

    /**
     * Busca mensajes por asunto (búsqueda parcial) y empresa
     */
    Page<Mensaje> findByEmpresaAndAsuntoContainingIgnoreCase(Empresa empresa, String asunto, Pageable pageable);
}
