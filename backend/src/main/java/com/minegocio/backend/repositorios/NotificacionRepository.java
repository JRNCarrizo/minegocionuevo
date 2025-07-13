package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.Notificacion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {
    
    // Obtener notificaciones por empresa, ordenadas por fecha de creación descendente
    Page<Notificacion> findByEmpresaIdOrderByFechaCreacionDesc(Long empresaId, Pageable pageable);
    
    // Obtener notificaciones no leídas por empresa
    List<Notificacion> findByEmpresaIdAndLeidaFalseOrderByFechaCreacionDesc(Long empresaId);
    
    // Contar notificaciones no leídas por empresa
    long countByEmpresaIdAndLeidaFalse(Long empresaId);
    
    // Obtener notificaciones recientes (últimas 24 horas)
    @Query("SELECT n FROM Notificacion n WHERE n.empresaId = :empresaId AND n.fechaCreacion >= :fechaLimite ORDER BY n.fechaCreacion DESC")
    List<Notificacion> findNotificacionesRecientes(@Param("empresaId") Long empresaId, @Param("fechaLimite") LocalDateTime fechaLimite);
    
    // Obtener notificaciones por tipo y empresa
    List<Notificacion> findByTipoAndEmpresaIdOrderByFechaCreacionDesc(String tipo, Long empresaId);
    
    // Buscar notificaciones antiguas (para contar antes de eliminar)
    List<Notificacion> findByEmpresaIdAndFechaCreacionBefore(Long empresaId, LocalDateTime fechaLimite);
    
    // Eliminar notificaciones antiguas (más de 30 días)
    @Modifying
    @Transactional
    @Query("DELETE FROM Notificacion n WHERE n.empresaId = :empresaId AND n.fechaCreacion < :fechaLimite")
    void deleteNotificacionesAntiguas(@Param("empresaId") Long empresaId, @Param("fechaLimite") LocalDateTime fechaLimite);
} 