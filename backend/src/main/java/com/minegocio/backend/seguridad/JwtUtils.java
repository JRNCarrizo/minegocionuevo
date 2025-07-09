package com.minegocio.backend.seguridad;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;

/**
 * Utilidad para generar y validar tokens JWT
 */
@Component
public class JwtUtils {
    
    private static final Logger logger = LoggerFactory.getLogger(JwtUtils.class);

    @Value("${minegocio.app.jwtSecret:miNegocioSecretKeyParaJWT2024}")
    private String jwtSecret;

    @Value("${minegocio.app.jwtExpirationMs:86400000}") // 24 horas
    private int jwtExpirationMs;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    /**
     * Genera un token JWT a partir de la autenticación
     */
    public String generarJwtToken(Authentication authentication) {
        UsuarioPrincipal userPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
        
        return Jwts.builder()
                .subject(userPrincipal.getUsername())
                .claim("userId", userPrincipal.getId())
                .claim("empresaId", userPrincipal.getEmpresaId())
                .claim("nombreCompleto", userPrincipal.getNombreCompleto())
                .issuedAt(Date.from(Instant.now()))
                .expiration(Date.from(Instant.now().plusMillis(jwtExpirationMs)))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Genera un token JWT para un usuario específico
     */
    public String generarJwtToken(String email, Long userId, Long empresaId, String nombreCompleto) {
        return Jwts.builder()
                .subject(email)
                .claim("userId", userId)
                .claim("empresaId", empresaId)
                .claim("nombreCompleto", nombreCompleto)
                .issuedAt(Date.from(Instant.now()))
                .expiration(Date.from(Instant.now().plusMillis(jwtExpirationMs)))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Obtiene el email del usuario desde el token JWT
     */
    public String getEmailFromJwtToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    /**
     * Alias para compatibilidad - extrae el nombre de usuario (email) del token
     */
    public String extractUsername(String token) {
        return getEmailFromJwtToken(token);
    }

    /**
     * Obtiene el ID del usuario desde el token JWT
     */
    public Long getUserIdFromJwtToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        
        return claims.get("userId", Long.class);
    }

    /**
     * Obtiene el ID de la empresa desde el token JWT
     */
    public Long getEmpresaIdFromJwtToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        
        return claims.get("empresaId", Long.class);
    }

    /**
     * Valida un token JWT
     */
    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(authToken);
            return true;
        } catch (MalformedJwtException e) {
            logger.error("Token JWT malformado: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            logger.error("Token JWT expirado: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            logger.error("Token JWT no soportado: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            logger.error("JWT claims string está vacío: {}", e.getMessage());
        } catch (Exception e) {
            logger.error("Error validando token JWT: {}", e.getMessage());
        }
        
        return false;
    }

    /**
     * Obtiene el tiempo de expiración del token en milisegundos
     */
    public int getJwtExpirationMs() {
        return jwtExpirationMs;
    }
}
