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
            
            // Solo log para endpoints importantes, no para todos
            if (requestPath.contains("/plantilla-importacion") || requestPath.contains("/auth/") || 
                requestPath.contains("/reporte-stock") || requestPath.contains("/reportes/") ||
                requestPath.contains("/direct/") || requestPath.contains("/public/") ||
                requestPath.contains("/files/") || requestPath.contains("/ultra/") ||
                requestPath.contains("/stock-general") || requestPath.contains("/remitos-ingreso")) {
                System.out.println("🌐 REQUEST RECIBIDA: " + method + " " + requestPath);
            }
            
            // Skip authentication for public endpoints
            if (isPublicEndpoint(requestPath)) {
                System.out.println("✅ SKIPPING AUTH for public endpoint: " + requestPath);
                filterChain.doFilter(request, response);
                return;
            }
            
            // Skip authentication for OPTIONS requests (CORS preflight)
            if ("OPTIONS".equalsIgnoreCase(method)) {
                filterChain.doFilter(request, response);
                return;
            }
            
            String jwt = parseJwt(request);
            
            // Log específico para remitos-ingreso
            if (requestPath.contains("/remitos-ingreso")) {
                System.out.println("🔍 === DEBUG REMITOS-INGRESO ===");
                System.out.println("🔍 JWT presente: " + (jwt != null ? "SÍ" : "NO"));
                System.out.println("🔍 JWT válido: " + (jwt != null && jwtUtils != null && jwtUtils.validateJwtToken(jwt) ? "SÍ" : "NO"));
                if (jwt != null) {
                    System.out.println("🔍 JWT (primeros 50 chars): " + jwt.substring(0, Math.min(50, jwt.length())) + "...");
                }
            }
            
            if (jwt != null && jwtUtils != null && jwtUtils.validateJwtToken(jwt)) {
                String email = jwtUtils.extractUsername(jwt);
                
                try {
                    UserDetails userDetails = userDetailsService.loadUserByUsername(email);
                    
                    // Verificar si es UsuarioPrincipal para obtener más info
                    if (userDetails instanceof UsuarioPrincipal) {
                        UsuarioPrincipal principal = (UsuarioPrincipal) userDetails;
                        System.out.println("EmpresaId del usuario: " + principal.getEmpresaId());
                        System.out.println("Rol del usuario: " + principal.getUsuario().getRol());
                        System.out.println("Authorities del usuario: " + principal.getAuthorities());
                    }
                    
                    UsernamePasswordAuthenticationToken authentication = 
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                    authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                    SecurityContextHolder.getContext().setAuthentication(authentication);
                    System.out.println("✅ Autenticación establecida exitosamente para: " + email);
                    System.out.println("✅ Authorities establecidos: " + userDetails.getAuthorities());
                } catch (Exception e) {
                    System.err.println("❌ Error al cargar usuario: " + e.getMessage());
                    logger.error("No se puede establecer la autenticación del usuario: {}", e.getMessage());
                    // Limpiar el contexto de seguridad si hay error
                    SecurityContextHolder.clearContext();
                }
            }
        } catch (Exception e) {
            System.err.println("❌ Error general en AuthTokenFilter: " + e.getMessage());
            System.err.println("❌ Stack trace: " + e.toString());
            logger.error("Error general en AuthTokenFilter: {}", e.getMessage());
            logger.error("Stack trace completo: ", e);
            // Continuar con el filtro incluso si hay error
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Extrae el token JWT del header Authorization
     */
    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");

        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }

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
        
        // Verificar si es un endpoint público
        boolean isPublic = requestPath.equals("/api/plantilla-publica") || // Plantilla completamente pública
                          requestPath.equals("/api/plantilla-simple") || // Plantilla simple con CORS explícito
                          requestPath.startsWith("/api/reportes/") || // Controlador de reportes completamente público
                          requestPath.startsWith("/api/api/reportes/") || // Temporal: manejar URL duplicada
                          requestPath.startsWith("/api/publico/") ||
                          isPublicAuth ||
                          requestPath.startsWith("/api/verificacion/") ||
                          requestPath.startsWith("/api/verificacion-cliente/") ||
                          requestPath.startsWith("/api/debug/") ||
                          requestPath.startsWith("/api/empresas/registro") ||
                          requestPath.startsWith("/api/empresas/verificar-subdominio/") ||
                          requestPath.matches("/api/empresas/\\d+/productos/plantilla-importacion") || // Plantilla de importación pública
                          requestPath.matches("/api/empresas/\\d+/productos/test-plantilla") || // Endpoint de prueba público
                          requestPath.matches("/api/empresas/\\d+/productos/reporte-stock") || // Reporte de stock público
                          requestPath.matches("/api/empresas/\\d+/productos/reporte-stock-directo") || // Reporte de stock directo público
                          requestPath.matches("/api/empresas/\\d+/productos/reporte-inventario-dia") || // Reporte de inventario público
                          requestPath.matches("/api/empresas/\\d+/productos/reporte-diferencias-dia") || // Reporte de diferencias público
                          requestPath.startsWith("/api/archivos/test") || // Solo el endpoint de prueba es público
                          requestPath.startsWith("/h2-console/") ||
                          requestPath.startsWith("/swagger-ui/") ||
                          requestPath.startsWith("/v3/api-docs/") ||
                          requestPath.equals("/error") ||
                          requestPath.startsWith("/error") ||
                          // Endpoints de autenticación de clientes (Google login, recuperación de contraseña, etc.)
                          (requestPath.contains("/publico/") && requestPath.contains("/auth/"));
        
        // Log para debug de reportes
        if (requestPath.contains("/reportes/")) {
            System.out.println("🔍 DEBUG REPORTES - Path: " + requestPath);
            System.out.println("🔍 DEBUG REPORTES - startsWith /api/reportes/: " + requestPath.startsWith("/api/reportes/"));
            System.out.println("🔍 DEBUG REPORTES - isPublic: " + isPublic);
        }
        
        return isPublic;
    }
}
