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

    @Bean
    public AuthTokenFilter authenticationJwtTokenFilter() {
        return new AuthTokenFilter();
    }

    @Bean
    public DaoAuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> {
                auth.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll();
                auth.requestMatchers("/actuator/**").permitAll(); // Health checks para Railway
                auth.requestMatchers("/api/publico/**").permitAll()
                    .requestMatchers("/api/auth/**").permitAll()
                    .requestMatchers("/api/verificacion/**").permitAll()
                    .requestMatchers("/api/verificacion-cliente/**").permitAll()
                    .requestMatchers("/api/debug/**").permitAll()
                    .requestMatchers("/api/empresas/registro").permitAll()
                    .requestMatchers("/api/empresas/verificar-subdominio/**").permitAll()
                    .requestMatchers("/api/archivos/**").permitAll()
                    .requestMatchers("/h2-console/**").permitAll()
                    .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                    // Endpoints de autenticación de clientes (Google login, recuperación de contraseña, etc.)
                    .requestMatchers("/api/publico/*/auth/**").permitAll()
                    .requestMatchers("/api/super-admin/**").hasAnyRole("SUPER_ADMIN", "ADMINISTRADOR")
                    .requestMatchers("/api/admin/**").hasAnyRole("ADMINISTRADOR", "SUPER_ADMIN")
                    .requestMatchers("/api/empresas/**").hasAnyRole("ADMINISTRADOR", "SUPER_ADMIN")
                    .requestMatchers("/api/notificaciones/**").hasAnyRole("ADMINISTRADOR", "SUPER_ADMIN")
                    .requestMatchers("/api/historial-carga-productos/**").hasAnyRole("ADMINISTRADOR", "SUPER_ADMIN")
                    .anyRequest().authenticated();
            });

        // Deshabilitar frame options para H2 Console
        http.headers(headers -> headers.frameOptions(frameOptions -> frameOptions.sameOrigin()));

        http.authenticationProvider(authenticationProvider());
        
        // Agregar el filtro JWT después de la configuración de autorización
        http.addFilterBefore(authenticationJwtTokenFilter(), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
// nuevo
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList("*")); // Permitir todos los orígenes temporalmente
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(false); // Cambiar a false para evitar problemas con CORS
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
