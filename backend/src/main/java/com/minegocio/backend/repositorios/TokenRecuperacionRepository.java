package com.minegocio.backend.repositorios;

import com.minegocio.backend.entidades.TokenRecuperacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface TokenRecuperacionRepository extends JpaRepository<TokenRecuperacion, Long> {

    /**
     * Busca un token por su valor
     */
    Optional<TokenRecuperacion> findByToken(String token);

    /**
     * Busca un token válido por email
     */
    @Query("SELECT t FROM TokenRecuperacion t WHERE t.email = ?1 AND t.usado = false AND t.fechaExpiracion > ?2")
    Optional<TokenRecuperacion> findTokenValidoByEmail(String email, LocalDateTime ahora);

    /**
     * Marca un token como usado
     */
    @Modifying
    @Query("UPDATE TokenRecuperacion t SET t.usado = true WHERE t.token = ?1")
    void marcarComoUsado(String token);

    /**
     * Elimina tokens expirados
     */
    @Modifying
    @Query("DELETE FROM TokenRecuperacion t WHERE t.fechaExpiracion < ?1")
    void eliminarTokensExpirados(LocalDateTime fechaLimite);

    /**
     * Elimina tokens usados
     */
    @Modifying
    @Query("DELETE FROM TokenRecuperacion t WHERE t.usado = true")
    void eliminarTokensUsados();
} 