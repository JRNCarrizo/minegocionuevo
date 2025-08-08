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
            String method = request.getMethod();
            
            // Log general para todas las peticiones
            System.out.println("🌐 REQUEST RECIBIDA: " + method + " " + requestPath);
            
            System.out.println("=== AuthTokenFilter Debug ===");
            System.out.println("Request: " + method + " " + requestPath);
            
            // Log específico para endpoints de archivos
            if (requestPath.contains("/archivos")) {
                System.out.println("📁 Endpoint de archivos detectado: " + requestPath);
            }
            
            // Skip authentication for public endpoints
            if (isPublicEndpoint(requestPath)) {
                System.out.println("✅ Skipping auth for public endpoint: " + requestPath);
                filterChain.doFilter(request, response);
                return;
            }
            
            // Log específico para endpoints de estadísticas
            if (requestPath.contains("/estadisticas")) {
                System.out.println("📊 Endpoint de estadísticas detectado: " + requestPath);
            }
            
            // Skip authentication for OPTIONS requests (CORS preflight)
            if ("OPTIONS".equalsIgnoreCase(method)) {
                System.out.println("✅ Skipping auth for OPTIONS request");
                filterChain.doFilter(request, response);
                return;
            }
            
            String jwt = parseJwt(request);
            System.out.println("JWT extraído: " + (jwt != null ? "Presente (longitud: " + jwt.length() + ")" : "Ausente"));
            
            if (jwt != null && jwtUtils != null && jwtUtils.validateJwtToken(jwt)) {
                String email = jwtUtils.extractUsername(jwt);
                System.out.println("Email extraído del JWT: " + email);

                try {
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
                    System.out.println("✅ Autenticación establecida exitosamente para: " + email);
                } catch (Exception e) {
                    System.err.println("❌ Error al cargar usuario: " + e.getMessage());
                    logger.error("No se puede establecer la autenticación del usuario: {}", e.getMessage());
                    // Limpiar el contexto de seguridad si hay error
                    SecurityContextHolder.clearContext();
                    System.out.println("🧹 SecurityContext limpiado debido a error de usuario");
                }
            } else {
                System.out.println("JWT inválido o ausente - no se estableció autenticación");
                if (jwt != null) {
                    System.out.println("Token presente pero inválido");
                } else {
                    System.out.println("No se encontró token en la petición");
                }
                // No establecer autenticación, pero continuar con el filtro
            }
        } catch (Exception e) {
            System.err.println("❌ Error general en AuthTokenFilter: " + e.getMessage());
            e.printStackTrace();
            logger.error("Error general en AuthTokenFilter: {}", e.getMessage());
            // Continuar con el filtro incluso si hay error
        }

        System.out.println("=== Fin AuthTokenFilter ===");
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
        // Endpoints específicos de /api/auth/ que son públicos
        boolean isPublicAuth = requestPath.equals("/api/auth/login") ||
                              requestPath.equals("/api/auth/registrar-administrador") ||
                              requestPath.equals("/api/auth/verificar-token-admin") ||
                              requestPath.equals("/api/auth/recuperar-password") ||
                              requestPath.startsWith("/api/auth/validar-token/") ||
                              requestPath.equals("/api/auth/cambiar-password");
        
        boolean isPublic = requestPath.startsWith("/api/publico/") ||
                          isPublicAuth ||
                          requestPath.startsWith("/api/verificacion/") ||
                          requestPath.startsWith("/api/verificacion-cliente/") ||
                          requestPath.startsWith("/api/debug/") ||
                          requestPath.startsWith("/api/empresas/registro") ||
                          requestPath.startsWith("/api/empresas/verificar-subdominio/") ||
                          requestPath.startsWith("/api/archivos/test") || // Solo el endpoint de prueba es público
                          requestPath.startsWith("/h2-console/") ||
                          requestPath.startsWith("/swagger-ui/") ||
                          requestPath.startsWith("/v3/api-docs/") ||
                          requestPath.equals("/error") ||
                          requestPath.startsWith("/error") ||
                          // Endpoints de autenticación de clientes (Google login, recuperación de contraseña, etc.)
                          (requestPath.contains("/publico/") && requestPath.contains("/auth/"));
        
        System.out.println("🔍 Checking if endpoint is public: " + requestPath + " -> " + isPublic);
        return isPublic;
    }
}
