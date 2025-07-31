package com.minegocio.backend.servicios;

import com.minegocio.backend.dto.RecuperacionPasswordDTO;
import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.TokenRecuperacion;
import com.minegocio.backend.entidades.Usuario;
import com.minegocio.backend.repositorios.TokenRecuperacionRepository;
import com.minegocio.backend.repositorios.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class RecuperacionPasswordService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private TokenRecuperacionRepository tokenRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    /**
     * Solicita la recuperación de contraseña
     */
    @Transactional
    public void solicitarRecuperacion(RecuperacionPasswordDTO.SolicitarRecuperacion request) {
        String email = request.getEmail().toLowerCase().trim();
        
        // Verificar si el usuario existe
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);
        if (usuarioOpt.isEmpty()) {
            // Por seguridad, no revelamos si el email existe o no
            System.out.println("Solicitud de recuperación para email no registrado: " + email);
            return;
        }

        Usuario usuario = usuarioOpt.get();
        
        // Obtener la empresa del usuario (puede ser null para super admin)
        Empresa empresa = usuario.getEmpresa();
        
        // Verificar si ya existe un token válido para este email
        Optional<TokenRecuperacion> tokenExistente = tokenRepository.findTokenValidoByEmail(email, LocalDateTime.now());
        if (tokenExistente.isPresent()) {
            System.out.println("Ya existe un token válido para: " + email);
            return;
        }

        // Generar nuevo token
        String token = generarTokenSeguro();
        LocalDateTime fechaExpiracion = LocalDateTime.now().plusHours(1); // Expira en 1 hora
        
        // Crear token con empresa (puede ser null para super admin)
        TokenRecuperacion tokenRecuperacion = new TokenRecuperacion(token, email, fechaExpiracion, empresa);
        tokenRepository.save(tokenRecuperacion);

        // Enviar email
        emailService.enviarEmailRecuperacion(email, token, usuario.getNombre());
        
        System.out.println("Token de recuperación generado para: " + email);
    }

    /**
     * Valida un token de recuperación
     */
    public boolean validarToken(String token) {
        Optional<TokenRecuperacion> tokenOpt = tokenRepository.findByToken(token);
        if (tokenOpt.isEmpty()) {
            return false;
        }

        TokenRecuperacion tokenRecuperacion = tokenOpt.get();
        return tokenRecuperacion.esValido();
    }

    /**
     * Cambia la contraseña usando un token válido
     */
    @Transactional
    public void cambiarPassword(RecuperacionPasswordDTO.CambiarPassword request) {
        // Validar que las contraseñas coincidan
        if (!request.passwordsCoinciden()) {
            throw new RuntimeException("Las contraseñas no coinciden");
        }

        // Buscar y validar el token
        Optional<TokenRecuperacion> tokenOpt = tokenRepository.findByToken(request.getToken());
        if (tokenOpt.isEmpty()) {
            throw new RuntimeException("Token inválido");
        }

        TokenRecuperacion tokenRecuperacion = tokenOpt.get();
        if (!tokenRecuperacion.esValido()) {
            throw new RuntimeException("Token expirado o ya usado");
        }

        // Buscar el usuario
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(tokenRecuperacion.getEmail());
        if (usuarioOpt.isEmpty()) {
            throw new RuntimeException("Usuario no encontrado");
        }

        Usuario usuario = usuarioOpt.get();

        // Cambiar la contraseña
        String nuevaPasswordHash = passwordEncoder.encode(request.getNuevaPassword());
        usuario.setPassword(nuevaPasswordHash);
        usuarioRepository.save(usuario);

        // Marcar el token como usado
        tokenRepository.marcarComoUsado(request.getToken());

        // Enviar email de confirmación
        emailService.enviarEmailConfirmacionCambio(usuario.getEmail(), usuario.getNombre());

        System.out.println("Contraseña cambiada exitosamente para: " + usuario.getEmail());
    }

    /**
     * Obtiene el email asociado a un token
     */
    public String obtenerEmailPorToken(String token) {
        Optional<TokenRecuperacion> tokenOpt = tokenRepository.findByToken(token);
        if (tokenOpt.isEmpty() || !tokenOpt.get().esValido()) {
            return null;
        }
        return tokenOpt.get().getEmail();
    }

    /**
     * Limpia tokens expirados y usados
     */
    @Transactional
    public void limpiarTokensAntiguos() {
        LocalDateTime fechaLimite = LocalDateTime.now().minusHours(24); // Tokens de más de 24 horas
        tokenRepository.eliminarTokensExpirados(fechaLimite);
        tokenRepository.eliminarTokensUsados();
        System.out.println("Limpieza de tokens antiguos completada");
    }

    /**
     * Genera un token seguro
     */
    private String generarTokenSeguro() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    /**
     * Getter para el repositorio de usuarios (para debug)
     */
    public UsuarioRepository getUsuarioRepository() {
        return usuarioRepository;
    }
} 