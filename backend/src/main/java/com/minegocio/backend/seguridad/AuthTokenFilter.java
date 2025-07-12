package com.minegocio.backend.seguridad;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtro JWT para autenticación en cada request
 */
public class AuthTokenFilter extends OncePerRequestFilter {
    
    private static final Logger logger = LoggerFactory.getLogger(AuthTokenFilter.class);

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private UsuarioDetallesService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                  FilterChain filterChain) throws ServletException, IOException {
        try {
            String requestPath = request.getRequestURI();
            
            // Skip authentication for public endpoints
            if (isPublicEndpoint(requestPath)) {
                System.out.println("Skipping auth for public endpoint: " + requestPath);
                filterChain.doFilter(request, response);
                return;
            }
            
            String jwt = parseJwt(request);
            System.out.println("JWT extraído: " + (jwt != null ? "Presente (longitud: " + jwt.length() + ")" : "Ausente"));
            
            if (jwt != null && jwtUtils != null && jwtUtils.validateJwtToken(jwt)) {
                String email = jwtUtils.getEmailFromJwtToken(jwt);
                System.out.println("Email extraído del JWT: " + email);

                UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                System.out.println("UserDetails cargado para: " + email);
                System.out.println("Authorities: " + userDetails.getAuthorities());
                
                // Verificar si es UsuarioPrincipal para obtener más info
                if (userDetails instanceof UsuarioPrincipal) {
                    UsuarioPrincipal principal = (UsuarioPrincipal) userDetails;
                    System.out.println("EmpresaId del usuario: " + principal.getEmpresaId());
                    System.out.println("Rol del usuario: " + principal.getUsuario().getRol());
                }
                
                UsernamePasswordAuthenticationToken authentication = 
                    new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);
                System.out.println("Autenticación establecida exitosamente para: " + email);
                System.out.println("Security Context: " + SecurityContextHolder.getContext().getAuthentication());
            } else {
                System.out.println("JWT inválido o ausente - no se estableció autenticación");
                if (jwt != null) {
                    System.out.println("Token presente pero inválido");
                } else {
                    System.out.println("No se encontró token en la petición");
                }
            }
        } catch (Exception e) {
            System.err.println("Error en AuthTokenFilter: " + e.getMessage());
            e.printStackTrace();
            logger.error("No se puede establecer la autenticación del usuario: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Extrae el token JWT del header Authorization
     */
    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");
        System.out.println("Authorization header: " + (headerAuth != null ? headerAuth.substring(0, Math.min(headerAuth.length(), 20)) + "..." : "null"));

        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            String token = headerAuth.substring(7);
            System.out.println("Token extraído correctamente, longitud: " + token.length());
            return token;
        }

        System.out.println("No se encontró token válido en Authorization header");
        return null;
    }

    /**
     * Verifica si el endpoint es público y no requiere autenticación
     */
    private boolean isPublicEndpoint(String requestPath) {
        return requestPath.startsWith("/api/publico/") ||
               requestPath.startsWith("/api/auth/") ||
               requestPath.startsWith("/api/debug/") ||
               requestPath.startsWith("/api/empresas/registro") ||
               requestPath.startsWith("/api/empresas/verificar-subdominio/") ||
               requestPath.startsWith("/h2-console/") ||
               requestPath.startsWith("/swagger-ui/") ||
               requestPath.startsWith("/v3/api-docs/");
    }
}
