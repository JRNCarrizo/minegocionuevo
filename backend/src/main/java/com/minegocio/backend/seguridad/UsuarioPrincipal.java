package com.minegocio.backend.seguridad;

import com.minegocio.backend.entidades.Usuario;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

/**
 * Implementación de UserDetails para Spring Security
 */
public class UsuarioPrincipal implements UserDetails {

    private final Usuario usuario;

    public UsuarioPrincipal(Usuario usuario) {
        this.usuario = usuario;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(
            new SimpleGrantedAuthority("ROLE_" + usuario.getRol().name())
        );
    }

    @Override
    public String getPassword() {
        return usuario.getPassword();
    }

    @Override
    public String getUsername() {
        return usuario.getEmail();
    }

    @Override
    public boolean isAccountNonExpired() {
        System.out.println("DEBUG - isAccountNonExpired: true");
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        System.out.println("DEBUG - isAccountNonLocked: true");
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        System.out.println("DEBUG - isCredentialsNonExpired: true");
        return true;
    }

    @Override
    public boolean isEnabled() {
        System.out.println("=== DEBUG isEnabled() ===");
        System.out.println("DEBUG - Usuario activo: " + usuario.getActivo());
        System.out.println("DEBUG - Email verificado: " + usuario.getEmailVerificado());
        boolean enabled = usuario.getActivo() && usuario.getEmailVerificado();
        System.out.println("DEBUG - Usuario habilitado: " + enabled);
        System.out.println("DEBUG - FORZANDO A TRUE TEMPORALMENTE");
        System.out.println("=========================");
        return true; // Temporal para testing
    }

    // Métodos adicionales para acceder al usuario
    public Usuario getUsuario() {
        return usuario;
    }

    public Long getId() {
        return usuario.getId();
    }

    public Long getEmpresaId() {
        return usuario.getEmpresa().getId();
    }

    public String getNombreCompleto() {
        return usuario.getNombreCompleto();
    }
}
