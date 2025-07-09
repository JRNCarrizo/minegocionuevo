package com.minegocio.backend.controladores;

import com.minegocio.backend.entidades.Usuario;
import com.minegocio.backend.repositorios.UsuarioRepository;
import com.minegocio.backend.seguridad.UsuarioPrincipal;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/debug")
@CrossOrigin(origins = "*")
public class DebugController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Lista todos los usuarios en la base de datos
     */
    @GetMapping("/usuarios")
    public ResponseEntity<?> listarUsuarios() {
        try {
            List<Usuario> usuarios = usuarioRepository.findAll();
            
            List<Map<String, Object>> usuariosInfo = usuarios.stream()
                .map(u -> {
                    Map<String, Object> info = new HashMap<>();
                    info.put("id", u.getId());
                    info.put("nombre", u.getNombre());
                    info.put("apellidos", u.getApellidos());
                    info.put("email", u.getEmail());
                    info.put("activo", u.getActivo());
                    info.put("emailVerificado", u.getEmailVerificado());
                    info.put("rol", u.getRol());
                    info.put("empresaId", u.getEmpresa() != null ? u.getEmpresa().getId() : null);
                    info.put("empresaNombre", u.getEmpresa() != null ? u.getEmpresa().getNombre() : null);
                    return info;
                })
                .collect(Collectors.toList());

            return ResponseEntity.ok(Map.of(
                "total", usuarios.size(),
                "usuarios", usuariosInfo
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Verifica un usuario específico por email
     */
    @GetMapping("/usuario/{email}")
    public ResponseEntity<?> verificarUsuario(@PathVariable String email) {
        try {
            var usuarioOpt = usuarioRepository.findByEmail(email);
            
            if (usuarioOpt.isPresent()) {
                Usuario u = usuarioOpt.get();
                Map<String, Object> resultado = new HashMap<>();
                resultado.put("encontrado", true);
                resultado.put("id", u.getId());
                resultado.put("nombre", u.getNombre());
                resultado.put("apellidos", u.getApellidos());
                resultado.put("email", u.getEmail());
                resultado.put("activo", u.getActivo());
                resultado.put("emailVerificado", u.getEmailVerificado());
                resultado.put("rol", u.getRol());
                resultado.put("empresaId", u.getEmpresa() != null ? u.getEmpresa().getId() : null);
                resultado.put("empresaNombre", u.getEmpresa() != null ? u.getEmpresa().getNombre() : null);
                resultado.put("fechaCreacion", u.getFechaCreacion());
                resultado.put("fechaActualizacion", u.getFechaActualizacion());
                
                return ResponseEntity.ok(resultado);
            } else {
                return ResponseEntity.ok(Map.of("encontrado", false, "email", email));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Verifica una contraseña contra un hash
     */
    @PostMapping("/verificar-password")
    public ResponseEntity<?> verificarPassword(@RequestBody Map<String, String> datos) {
        try {
            String email = datos.get("email");
            String password = datos.get("password");
            
            var usuarioOpt = usuarioRepository.findByEmail(email);
            
            if (usuarioOpt.isPresent()) {
                Usuario usuario = usuarioOpt.get();
                boolean coincide = passwordEncoder.matches(password, usuario.getPassword());
                
                return ResponseEntity.ok(Map.of(
                    "email", email,
                    "passwordCoincide", coincide,
                    "hashEnBD", usuario.getPassword().substring(0, 20) + "...",
                    "algoritmo", usuario.getPassword().startsWith("$2a$") ? "BCrypt" : "Desconocido"
                ));
            } else {
                return ResponseEntity.ok(Map.of("encontrado", false, "email", email));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Información del sistema
     */
    @GetMapping("/info")
    public ResponseEntity<?> informacionSistema() {
        try {
            long totalUsuarios = usuarioRepository.count();
            
            return ResponseEntity.ok(Map.of(
                "totalUsuarios", totalUsuarios,
                "timestamp", System.currentTimeMillis(),
                "passwordEncoder", passwordEncoder.getClass().getSimpleName()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Genera un hash BCrypt para una contraseña
     */
    @PostMapping("/generar-hash")
    public ResponseEntity<?> generarHash(@RequestBody Map<String, String> datos) {
        try {
            String password = datos.get("password");
            if (password == null || password.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Password requerido"));
            }
            
            String hash = passwordEncoder.encode(password);
            boolean verificacion = passwordEncoder.matches(password, hash);
            
            Map<String, Object> resultado = new HashMap<>();
            resultado.put("password", password);
            resultado.put("hash", hash);
            resultado.put("verificacion", verificacion);
            resultado.put("sqlUpdate", "UPDATE usuarios SET password = '" + hash + "' WHERE email = 'admin@demo.com';");
            
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Genera un hash BCrypt para una contraseña
     */
    @GetMapping("/generar-hash/{password}")
    public ResponseEntity<?> generarHash(@PathVariable String password) {
        try {
            String hash = passwordEncoder.encode(password);
            return ResponseEntity.ok(Map.of(
                "password", password,
                "hash", hash,
                "algoritmo", "BCrypt"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Actualiza la contraseña de un usuario
     */
    @PostMapping("/actualizar-password")
    public ResponseEntity<?> actualizarPassword(@RequestBody Map<String, String> datos) {
        try {
            String email = datos.get("email");
            String nuevaPassword = datos.get("password");
            
            var usuarioOpt = usuarioRepository.findByEmail(email);
            
            if (usuarioOpt.isPresent()) {
                Usuario usuario = usuarioOpt.get();
                String nuevoHash = passwordEncoder.encode(nuevaPassword);
                usuario.setPassword(nuevoHash);
                usuarioRepository.save(usuario);
                
                return ResponseEntity.ok(Map.of(
                    "mensaje", "Contraseña actualizada correctamente",
                    "email", email,
                    "nuevoHash", nuevoHash.substring(0, 20) + "..."
                ));
            } else {
                return ResponseEntity.status(404).body(Map.of("error", "Usuario no encontrado: " + email));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Endpoint simple para verificar que el servidor responde
     */
    @GetMapping("/ping")
    public ResponseEntity<?> ping() {
        return ResponseEntity.ok(Map.of(
            "mensaje", "Servidor funcionando correctamente",
            "timestamp", System.currentTimeMillis()
        ));
    }

    /**
     * Verifica el estado de autenticación actual
     */
    @GetMapping("/auth-status")
    public ResponseEntity<?> verificarAutenticacion() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            
            Map<String, Object> resultado = new HashMap<>();
            resultado.put("authenticated", auth != null && auth.isAuthenticated());
            
            if (auth != null) {
                resultado.put("name", auth.getName());
                resultado.put("authorities", auth.getAuthorities().toString());
                resultado.put("principal", auth.getPrincipal().getClass().getSimpleName());
                
                if (auth.getPrincipal() instanceof UsuarioPrincipal) {
                    UsuarioPrincipal principal = (UsuarioPrincipal) auth.getPrincipal();
                    resultado.put("userId", principal.getId());
                    resultado.put("empresaId", principal.getEmpresaId());
                    resultado.put("nombreCompleto", principal.getNombreCompleto());
                    resultado.put("rol", principal.getUsuario().getRol());
                    resultado.put("email", principal.getUsername());
                }
            }
            
            return ResponseEntity.ok(resultado);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Reset de emergencia para la contraseña del usuario admin
     */
    @PostMapping("/reset-admin")
    public ResponseEntity<?> resetearAdmin() {
        try {
            // Buscar el usuario admin
            Optional<Usuario> adminOpt = usuarioRepository.findByEmail("admin@demo.com");
            
            if (adminOpt.isPresent()) {
                Usuario admin = adminOpt.get();
                
                // Generar nuevo hash para admin123
                String nuevaPassword = "admin123";
                String nuevoHash = passwordEncoder.encode(nuevaPassword);
                
                // Actualizar la contraseña
                admin.setPassword(nuevoHash);
                usuarioRepository.save(admin);
                
                return ResponseEntity.ok(Map.of(
                    "mensaje", "Contraseña del admin reseteada exitosamente",
                    "email", "admin@demo.com",
                    "password", "admin123",
                    "nota", "Usar estas credenciales para iniciar sesión"
                ));
            } else {
                return ResponseEntity.status(404).body(Map.of("error", "Usuario admin no encontrado"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Verifica si una contraseña coincide con el hash del usuario
     */
    @PostMapping("/verificar-password-usuario")
    public ResponseEntity<?> verificarPasswordUsuario(@RequestBody Map<String, String> datos) {
        try {
            String email = datos.get("email");
            String password = datos.get("password");
            
            if (email == null || password == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Se requieren email y password"));
            }
            
            Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(email);
            
            if (usuarioOpt.isPresent()) {
                Usuario usuario = usuarioOpt.get();
                String hashAlmacenado = usuario.getPassword();
                
                // Verificar la contraseña
                boolean coincide = passwordEncoder.matches(password, hashAlmacenado);
                
                return ResponseEntity.ok(Map.of(
                    "email", email,
                    "password", password,
                    "hashAlmacenado", hashAlmacenado.substring(0, 20) + "...",
                    "coincide", coincide,
                    "mensaje", coincide ? "La contraseña es correcta" : "La contraseña no coincide"
                ));
            } else {
                return ResponseEntity.status(404).body(Map.of("error", "Usuario no encontrado: " + email));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Verifica y corrige la contraseña del usuario admin si es necesario
     */
    @PostMapping("/fix-admin-password")
    public ResponseEntity<?> corregirPasswordAdmin() {
        try {
            Optional<Usuario> adminOpt = usuarioRepository.findByEmail("admin@demo.com");
            
            if (adminOpt.isPresent()) {
                Usuario admin = adminOpt.get();
                String passwordTextoPlano = "admin123";
                
                // Verificar si la contraseña actual funciona
                boolean passwordActualFunciona = passwordEncoder.matches(passwordTextoPlano, admin.getPassword());
                
                Map<String, Object> resultado = new HashMap<>();
                resultado.put("email", admin.getEmail());
                resultado.put("passwordActualFunciona", passwordActualFunciona);
                resultado.put("hashActual", admin.getPassword().substring(0, 20) + "...");
                
                if (!passwordActualFunciona) {
                    // Generar nuevo hash
                    String nuevoHash = passwordEncoder.encode(passwordTextoPlano);
                    admin.setPassword(nuevoHash);
                    usuarioRepository.save(admin);
                    
                    resultado.put("accion", "Contraseña corregida");
                    resultado.put("nuevoHash", nuevoHash.substring(0, 20) + "...");
                    
                    // Verificar que el nuevo hash funciona
                    boolean nuevoHashFunciona = passwordEncoder.matches(passwordTextoPlano, nuevoHash);
                    resultado.put("nuevoHashFunciona", nuevoHashFunciona);
                } else {
                    resultado.put("accion", "Contraseña ya funciona correctamente");
                }
                
                return ResponseEntity.ok(resultado);
            } else {
                return ResponseEntity.status(404).body(Map.of("error", "Usuario admin no encontrado"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
