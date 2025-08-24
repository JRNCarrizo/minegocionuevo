package com.minegocio.backend.controladores;

import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.TokenRecuperacionRepository;
import com.minegocio.backend.repositorios.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;
import org.springframework.security.core.Authentication;
import com.minegocio.backend.seguridad.UsuarioPrincipal;

/**
 * Controlador temporal para debugging y limpieza de datos
 * SOLO PARA DESARROLLO - ELIMINAR EN PRODUCCIÓN
 */
@RestController
@RequestMapping("/api/debug")
@CrossOrigin(origins = "*", maxAge = 3600)
public class DebugController {

    @Autowired
    private EmpresaRepository empresaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private TokenRecuperacionRepository tokenRepository;

    /**
     * Endpoint para verificar el estado de autenticación del usuario actual
     */
    @GetMapping("/auth-status")
    public ResponseEntity<Map<String, Object>> getAuthStatus(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();
        
        if (authentication != null && authentication.isAuthenticated()) {
            response.put("authenticated", true);
            response.put("principal", authentication.getPrincipal().toString());
            response.put("authorities", authentication.getAuthorities().stream()
                    .map(Object::toString)
                    .collect(Collectors.toList()));
            
            if (authentication.getPrincipal() instanceof UsuarioPrincipal) {
                UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
                response.put("userId", usuarioPrincipal.getId());
                response.put("username", usuarioPrincipal.getUsername());
                response.put("empresaId", usuarioPrincipal.getEmpresaId());
                response.put("rol", usuarioPrincipal.getAuthorities().stream()
                        .map(Object::toString)
                        .collect(Collectors.toList()));
            }
        } else {
            response.put("authenticated", false);
            response.put("message", "No hay usuario autenticado");
        }
        
        return ResponseEntity.ok(response);
    }
}
