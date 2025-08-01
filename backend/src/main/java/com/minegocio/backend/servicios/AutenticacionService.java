package com.minegocio.backend.servicios;

import com.minegocio.backend.dto.JwtRespuestaDTO;
import com.minegocio.backend.dto.LoginDTO;
import com.minegocio.backend.entidades.Usuario;
import com.minegocio.backend.repositorios.UsuarioRepository;
import com.minegocio.backend.seguridad.JwtUtils;
import com.minegocio.backend.seguridad.UsuarioPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Servicio para la gestión de autenticación
 */
@Service
@Transactional
public class AutenticacionService {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    /**
     * Autentica un usuario y genera un token JWT
     */
    public JwtRespuestaDTO autenticarUsuario(LoginDTO loginDTO) {
        // El usuario debe ser email (no hay nombreUsuario en esta entidad)
        String email = loginDTO.getUsuario();
        String contrasena = loginDTO.getContrasena();

        System.out.println("=== DEBUG AUTENTICACION ===");
        System.out.println("Intentando autenticar email: " + email);

        // Buscar usuario por email
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);

        if (usuarioOpt.isEmpty()) {
            System.out.println("Usuario no encontrado: " + email);
            throw new RuntimeException("Credenciales inválidas");
        }

        Usuario usuarioEntity = usuarioOpt.get();
        System.out.println("Usuario encontrado - ID: " + usuarioEntity.getId());
        System.out.println("Usuario activo: " + usuarioEntity.getActivo());
        System.out.println("Email verificado: " + usuarioEntity.getEmailVerificado());

        if (!usuarioEntity.getActivo()) {
            System.out.println("Usuario no activo");
            throw new RuntimeException("Credenciales inválidas");
        }

        if (!usuarioEntity.getEmailVerificado()) {
            System.out.println("Email no verificado");
            throw new RuntimeException("EMAIL_NO_VERIFICADO");
        }

        System.out.println("Procediendo con autenticación Spring Security...");

        // DEBUG: Verificar contraseña manualmente antes de Spring Security
        boolean passwordMatches = passwordEncoder.matches(contrasena, usuarioEntity.getPassword());
        System.out.println("=== DEBUG CONTRASEÑA ===");
        System.out.println("Contraseña ingresada: " + contrasena);
        System.out.println("Hash almacenado: " + usuarioEntity.getPassword().substring(0, 20) + "...");
        System.out.println("Contraseña coincide: " + passwordMatches);
        System.out.println("========================");

        if (!passwordMatches) {
            System.out.println("CONTRASEÑA NO COINCIDE");
            throw new RuntimeException("Credenciales inválidas");
        }

        // Autenticar con Spring Security usando email como username
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(usuarioEntity.getEmail(), contrasena)
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        // Generar JWT
        String jwt = jwtUtils.generarJwtToken(authentication);

        // Obtener detalles del usuario autenticado
        // UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();

        // Crear respuesta
        return new JwtRespuestaDTO(
                jwt,
                usuarioEntity.getEmail(), // Usar email como nombreUsuario
                usuarioEntity.getEmail(),
                usuarioEntity.getNombre(),
                usuarioEntity.getApellidos(),
                List.of(usuarioEntity.getRol().name()),
                usuarioEntity.getEmpresa().getId(),
                usuarioEntity.getEmpresa().getNombre(),
                usuarioEntity.getEmpresa().getSubdominio()
        );
    }

    /**
     * Verifica si un nombre de usuario está disponible (no aplica en este modelo)
     */
    public boolean isNombreUsuarioDisponible(String nombreUsuario) {
        // En este modelo usamos email como identificador único
        return isEmailDisponible(nombreUsuario);
    }

    /**
     * Verifica si un email está disponible
     */
    public boolean isEmailDisponible(String email) {
        return !usuarioRepository.existsByEmail(email);
    }

    /**
     * Obtiene el usuario autenticado actualmente
     */
    public Optional<Usuario> obtenerUsuarioAutenticado() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication != null && authentication.isAuthenticated() && 
            authentication.getPrincipal() instanceof UsuarioPrincipal) {
            
            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            return usuarioRepository.findByEmail(usuarioPrincipal.getUsername());
        }
        
        return Optional.empty();
    }

    /**
     * Valida el token JWT
     */
    public boolean validarToken(String token) {
        return jwtUtils.validateJwtToken(token);
    }

    /**
     * Obtiene el nombre de usuario del token JWT
     */
    public String obtenerEmailDelToken(String token) {
        return jwtUtils.getEmailFromJwtToken(token);
    }

    /**
     * Obtiene un usuario por email (para debugging)
     */
    public Optional<Usuario> obtenerUsuarioPorEmail(String email) {
        return usuarioRepository.findByEmail(email);
    }

    /**
     * Obtiene un usuario por email
     */
    public Optional<Usuario> obtenerPorEmail(String email) {
        return usuarioRepository.findByEmail(email);
    }

    /**
     * Autentica un usuario con Google y genera un token JWT
     */
    public JwtRespuestaDTO autenticarUsuarioGoogle(String email, String name, String picture, String sub) {
        System.out.println("=== DEBUG GOOGLE AUTH ===");
        System.out.println("Intentando autenticar con Google email: " + email);

        // Buscar usuario por email
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);

        if (usuarioOpt.isEmpty()) {
            System.out.println("Usuario nuevo con Google: " + email);
            // Para usuarios nuevos, lanzamos una excepción especial
            throw new RuntimeException("USUARIO_NUEVO_GOOGLE");
        }

        Usuario usuarioEntity = usuarioOpt.get();
        System.out.println("Usuario encontrado - ID: " + usuarioEntity.getId());
        System.out.println("Usuario activo: " + usuarioEntity.getActivo());
        System.out.println("Email verificado: " + usuarioEntity.getEmailVerificado());

        if (!usuarioEntity.getActivo()) {
            System.out.println("Usuario no activo");
            throw new RuntimeException("Cuenta deshabilitada");
        }

        // Para Google, asumimos que el email ya está verificado
        // Podemos actualizar la información del usuario si es necesario
        if (usuarioEntity.getNombre() == null || usuarioEntity.getNombre().isEmpty()) {
            usuarioEntity.setNombre(name);
            usuarioRepository.save(usuarioEntity);
        }

        System.out.println("✓ Usuario autenticado con Google correctamente");

        // Generar token JWT
        String token = jwtUtils.generarJwtToken(
            usuarioEntity.getEmail(), 
            usuarioEntity.getId(), 
            usuarioEntity.getEmpresa() != null ? usuarioEntity.getEmpresa().getId() : null,
            usuarioEntity.getNombre() + " " + (usuarioEntity.getApellidos() != null ? usuarioEntity.getApellidos() : "")
        );

        // Obtener información de la empresa si existe
        String empresaNombre = null;
        String empresaSubdominio = null;
        Long empresaId = null;

        if (usuarioEntity.getEmpresa() != null) {
            empresaNombre = usuarioEntity.getEmpresa().getNombre();
            empresaSubdominio = usuarioEntity.getEmpresa().getSubdominio();
            empresaId = usuarioEntity.getEmpresa().getId();
        }

        return new JwtRespuestaDTO(
            token,
            usuarioEntity.getEmail(),
            usuarioEntity.getEmail(),
            usuarioEntity.getNombre(),
            usuarioEntity.getApellidos(),
            List.of(usuarioEntity.getRol().name()),
            empresaId,
            empresaNombre,
            empresaSubdominio
        );
    }
}
