package com.minegocio.backend.controladores;

import com.minegocio.backend.dto.PermisoUsuarioDTO;
import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.entidades.Usuario;
import com.minegocio.backend.repositorios.EmpresaRepository;
import com.minegocio.backend.repositorios.UsuarioRepository;
import com.minegocio.backend.seguridad.JwtUtils;
import com.minegocio.backend.servicios.PermisoUsuarioService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Controlador para la gestión de permisos de usuario
 */
@RestController
@RequestMapping("/api/permisos")
@CrossOrigin(origins = "*", maxAge = 3600)
public class PermisoUsuarioController {

    @Autowired
    private PermisoUsuarioService permisoUsuarioService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private EmpresaRepository empresaRepository;

    @Autowired
    private JwtUtils jwtUtils;

    /**
     * Obtiene los permisos de un usuario específico
     */
    @GetMapping("/usuario/{usuarioId}")
    @Transactional(readOnly = true)
    public ResponseEntity<?> obtenerPermisosUsuario(
            @PathVariable Long usuarioId,
            HttpServletRequest request) {
        try {
            // Validar token y obtener empresa del usuario actual
            Empresa empresa = obtenerEmpresaDelUsuarioAutenticado(request);
            if (empresa == null) {
                return ResponseEntity.status(401).body(Map.of("error", "No autorizado"));
            }

            // Buscar el usuario
            Optional<Usuario> usuarioOpt = usuarioRepository.findById(usuarioId);
            if (usuarioOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Usuario no encontrado"));
            }

            Usuario usuario = usuarioOpt.get();

            // Verificar que el usuario pertenece a la empresa
            if (!usuario.getEmpresa().getId().equals(empresa.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "No tienes permisos para acceder a este usuario"));
            }

            // Obtener permisos
            Map<String, Boolean> permisos = permisoUsuarioService.obtenerPermisos(usuario);

            PermisoUsuarioDTO dto = new PermisoUsuarioDTO(
                usuario.getId(),
                usuario.getNombreCompleto(),
                usuario.getEmail(),
                permisos
            );

            return ResponseEntity.ok(Map.of(
                "mensaje", "Permisos obtenidos exitosamente",
                "permisos", dto
            ));

        } catch (Exception e) {
            System.err.println("❌ Error obteniendo permisos: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error interno del servidor"));
        }
    }

    /**
     * Actualiza los permisos de un usuario
     */
    @PutMapping("/usuario/{usuarioId}")
    @Transactional
    public ResponseEntity<?> actualizarPermisosUsuario(
            @PathVariable Long usuarioId,
            @RequestBody Map<String, Boolean> permisos,
            HttpServletRequest request) {
        try {
            // Validar token y obtener empresa del usuario actual
            Empresa empresa = obtenerEmpresaDelUsuarioAutenticado(request);
            if (empresa == null) {
                return ResponseEntity.status(401).body(Map.of("error", "No autorizado"));
            }

            // Buscar el usuario
            Optional<Usuario> usuarioOpt = usuarioRepository.findById(usuarioId);
            if (usuarioOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Usuario no encontrado"));
            }

            Usuario usuario = usuarioOpt.get();

            // Verificar que el usuario pertenece a la empresa
            if (!usuario.getEmpresa().getId().equals(empresa.getId())) {
                return ResponseEntity.status(403).body(Map.of("error", "No tienes permisos para modificar este usuario"));
            }

            // Verificar que no es el administrador principal
            if (usuario.getRol() == Usuario.RolUsuario.ADMINISTRADOR) {
                return ResponseEntity.status(400).body(Map.of("error", "No se pueden modificar los permisos del administrador principal"));
            }

            // Actualizar permisos
            permisoUsuarioService.asignarPermisos(usuario, permisos);

            return ResponseEntity.ok(Map.of(
                "mensaje", "Permisos actualizados exitosamente"
            ));

        } catch (Exception e) {
            System.err.println("❌ Error actualizando permisos: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error interno del servidor"));
        }
    }

    /**
     * Obtiene las funcionalidades disponibles
     */
    @GetMapping("/funcionalidades")
    public ResponseEntity<?> obtenerFuncionalidades() {
        try {
            Map<String, String> funcionalidades = new HashMap<>();
            
            for (com.minegocio.backend.entidades.PermisoUsuario.Funcionalidad func : 
                 com.minegocio.backend.entidades.PermisoUsuario.Funcionalidad.values()) {
                funcionalidades.put(func.name(), func.getDescripcion());
            }

            return ResponseEntity.ok(Map.of(
                "mensaje", "Funcionalidades obtenidas exitosamente",
                "funcionalidades", funcionalidades
            ));

        } catch (Exception e) {
            System.err.println("❌ Error obteniendo funcionalidades: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error interno del servidor"));
        }
    }

    // Método auxiliar
    private Empresa obtenerEmpresaDelUsuarioAutenticado(HttpServletRequest request) {
        try {
            String authHeader = request.getHeader("Authorization");
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return null;
            }

            String token = authHeader.substring(7);
            if (!jwtUtils.validateJwtToken(token)) {
                return null;
            }

            String email = jwtUtils.getEmailFromJwtToken(token);
            Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);
            
            return usuarioOpt.map(Usuario::getEmpresa).orElse(null);
        } catch (Exception e) {
            System.err.println("❌ Error obteniendo empresa del usuario: " + e.getMessage());
            return null;
        }
    }
}
