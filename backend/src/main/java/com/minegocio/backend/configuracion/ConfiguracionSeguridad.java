package com.minegocio.backend.configuracion;

import com.minegocio.backend.seguridad.AuthTokenFilter;
import com.minegocio.backend.seguridad.UsuarioDetallesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.http.HttpMethod;

import java.util.Arrays;

/**
 * Configuración de seguridad principal
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
public class ConfiguracionSeguridad {

    @Autowired
    private UsuarioDetallesService userDetailsService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Bean
    public AuthTokenFilter authenticationJwtTokenFilter() {
        return new AuthTokenFilter();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder);
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> {
                // Endpoints completamente públicos
                auth.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll();
                auth.requestMatchers("/actuator/**").permitAll();
                auth.requestMatchers("/h2-console/**").permitAll();
                
                // Endpoints de autenticación
                auth.requestMatchers("/api/auth/**").permitAll();
                auth.requestMatchers("/api/verificacion/**").permitAll();
                auth.requestMatchers("/api/verificacion-cliente/**").permitAll();
                auth.requestMatchers("/api/debug/**").permitAll();
                
                // Endpoints de plantillas y reportes públicos
                auth.requestMatchers("/api/plantilla-**").permitAll();
                auth.requestMatchers("/api/reporte-**").permitAll();
                auth.requestMatchers("/api/files/**").permitAll();
                auth.requestMatchers("/api/direct/**").permitAll();
                auth.requestMatchers("/api/public/**").permitAll();
                auth.requestMatchers("/api/reportes/**").permitAll();
                auth.requestMatchers("/download/**").permitAll();
                auth.requestMatchers("/excel/**").permitAll();
                auth.requestMatchers("/plantilla/**").permitAll();
                auth.requestMatchers("/template/**").permitAll();
                auth.requestMatchers("/public/**").permitAll();
                auth.requestMatchers("/direct/**").permitAll();
                auth.requestMatchers("/files/**").permitAll();
                auth.requestMatchers("/ultra/**").permitAll();
                
                // Endpoints de empresas públicos
                auth.requestMatchers("/api/empresas/registro").permitAll();
                auth.requestMatchers("/api/empresas/verificar-subdominio/**").permitAll();
                auth.requestMatchers("/api/empresas/crear-empresa").permitAll();
                auth.requestMatchers("/api/empresas/publico/**").permitAll();
                auth.requestMatchers("/api/empresas/*/productos/plantilla-**").permitAll();
                auth.requestMatchers("/api/empresas/*/productos/reporte-**").permitAll();
                auth.requestMatchers("/api/empresas/*/productos/test-**").permitAll();
                
                // Endpoints de super admin públicos
                auth.requestMatchers("/api/super-admin/crear-super-admin").permitAll();
                auth.requestMatchers("/api/super-admin/suscripciones/crear-datos-prueba").permitAll();
                auth.requestMatchers("/api/super-admin/suscripciones/debug/**").permitAll();
                
                // Endpoints de suscripciones
                auth.requestMatchers("/api/suscripciones/debug/**").permitAll();
                auth.requestMatchers("/api/suscripciones/mi-suscripcion").authenticated();
                auth.requestMatchers("/api/suscripciones/mi-suscripcion-simple").authenticated();
                auth.requestMatchers("/api/suscripciones/mi-consumo").authenticated();
                
                // Endpoints que requieren autenticación
                auth.requestMatchers("/api/empresas/**").hasAnyRole("ADMINISTRADOR", "SUPER_ADMIN");
                auth.requestMatchers("/api/admin/**").hasAnyRole("ADMINISTRADOR", "SUPER_ADMIN");
                auth.requestMatchers("/api/super-admin/**").hasAnyRole("SUPER_ADMIN", "ADMINISTRADOR");
                auth.requestMatchers("/api/administradores/**").hasAnyRole("ADMINISTRADOR", "SUPER_ADMIN");
                auth.requestMatchers("/api/notificaciones/**").hasAnyRole("ADMINISTRADOR", "SUPER_ADMIN");
                auth.requestMatchers("/api/historial-carga-productos/**").hasAnyRole("ADMINISTRADOR", "SUPER_ADMIN");
                
                // Cualquier otra solicitud requiere autenticación
                auth.anyRequest().authenticated();
            });

        // Deshabilitar frame options para H2 Console
        http.headers(headers -> headers.frameOptions(frameOptions -> frameOptions.sameOrigin()));

        http.authenticationProvider(authenticationProvider());
        
        // Agregar el filtro JWT después de la configuración de autorización
        http.addFilterBefore(authenticationJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(false);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
