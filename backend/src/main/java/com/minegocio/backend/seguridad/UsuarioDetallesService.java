package com.minegocio.backend.seguridad;

import com.minegocio.backend.entidades.Usuario;
import com.minegocio.backend.repositorios.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Servicio para cargar detalles del usuario para Spring Security
 */
@Service
public class UsuarioDetallesService implements UserDetailsService {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Override
    @Transactional
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        System.out.println("=== DEBUG loadUserByUsername ===");
        System.out.println("DEBUG - Buscando usuario con email: " + email);
        
        Usuario usuario = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado con email: " + email));

        System.out.println("DEBUG - Usuario encontrado: " + usuario.getId());
        System.out.println("DEBUG - Usuario activo: " + usuario.getActivo());
        System.out.println("DEBUG - Email verificado: " + usuario.getEmailVerificado());
        System.out.println("DEBUG - Rol: " + usuario.getRol());
        
        UsuarioPrincipal principal = new UsuarioPrincipal(usuario);
        System.out.println("DEBUG - UsuarioPrincipal creado");
        System.out.println("===============================");
        
        return principal;
    }

    /**
     * Carga un usuario por su ID
     */
    @Transactional
    public UserDetails loadUserById(Long id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado con ID: " + id));

        return new UsuarioPrincipal(usuario);
    }
}
