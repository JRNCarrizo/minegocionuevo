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

    @Value("${MINE_NEGOCIO_APP_JWT_SECRET:miNegocioSecretKeyParaJWT2024}")
    private String jwtSecret;

    @Value("${minegocio.app.jwtExpirationMs:86400000}") // 24 horas
    private int jwtExpirationMs;

    private SecretKey getSigningKey() {
        System.out.println("🔑 JWT Secret actual: " + jwtSecret);
        System.out.println("🔑 JWT Secret longitud: " + jwtSecret.length());
        System.out.println("🔑 JWT Secret bytes: " + jwtSecret.getBytes().length);
        return Keys.hmacShaKeyFor(jwtSecret.getBytes());
    }

    /**
     * Genera un token JWT a partir de la autenticación
     */
    public String generarJwtToken(Authentication authentication) {
        try {
            System.out.println("🎯 JWT - Authentication principal type: " + authentication.getPrincipal().getClass().getName());
            System.out.println("🎯 JWT - Authentication principal: " + authentication.getPrincipal());
            
            // Intentar obtener UsuarioPrincipal primero
            if (authentication.getPrincipal() instanceof UsuarioPrincipal) {
                UsuarioPrincipal userPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
                System.out.println("🎯 JWT - UsuarioPrincipal obtenido: " + userPrincipal.getUsername());
                System.out.println("🎯 JWT - UsuarioPrincipal ID: " + userPrincipal.getId());
                
                return Jwts.builder()
                        .subject(userPrincipal.getUsername())
                        .claim("userId", userPrincipal.getId())
                        .claim("empresaId", userPrincipal.getEmpresaId())
                        .claim("nombreCompleto", userPrincipal.getNombreCompleto())
                        .issuedAt(Date.from(Instant.now()))
                        .expiration(Date.from(Instant.now().plusMillis(jwtExpirationMs)))
                        .signWith(getSigningKey(), Jwts.SIG.HS256)
                        .compact();
            } else {
                // Fallback para User por defecto de Spring Security
                System.out.println("🎯 JWT - Usando User por defecto de Spring Security");
                String username = authentication.getName();
                
                return Jwts.builder()
                        .subject(username)
                        .claim("userId", 1L) // Valor por defecto
                        .claim("empresaId", null)
                        .claim("nombreCompleto", username)
                        .issuedAt(Date.from(Instant.now()))
                        .expiration(Date.from(Instant.now().plusMillis(jwtExpirationMs)))
                        .signWith(getSigningKey(), Jwts.SIG.HS256)
                        .compact();
            }
        } catch (Exception e) {
            System.out.println("❌ ERROR en generarJwtToken: " + e.getMessage());
            e.printStackTrace();
            throw e;
        }
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
                .signWith(getSigningKey(), Jwts.SIG.HS256)
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
            // Usar el método correcto para la versión actual de JJWT
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
