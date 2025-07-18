package com.minegocio.backend.controladores;

import com.minegocio.backend.dto.JwtRespuestaDTO;
import com.minegocio.backend.dto.LoginDTO;
import com.minegocio.backend.servicios.AutenticacionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controlador REST para la autenticación de usuarios
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*", maxAge = 3600)
public class AutenticacionController {

    @Autowired
    private AutenticacionService autenticacionService;

    /**
     * Autentica un usuario y devuelve un token JWT
     */
    @PostMapping("/login")
    public ResponseEntity<?> autenticarUsuario(@Valid @RequestBody LoginDTO loginDTO) {
        try {
            JwtRespuestaDTO jwtRespuesta = autenticacionService.autenticarUsuario(loginDTO);
            return ResponseEntity.ok(jwtRespuesta);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Credenciales inválidas"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error interno del servidor"));
        }
    }

    /**
     * Valida un token JWT
     */
    @PostMapping("/validar-token")
    public ResponseEntity<?> validarToken(@RequestParam String token) {
        try {
            boolean valido = autenticacionService.validarToken(token);
            
            if (valido) {
                String email = autenticacionService.obtenerEmailDelToken(token);
                return ResponseEntity.ok(Map.of(
                    "valido", true,
                    "email", email
                ));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("valido", false));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("valido", false));
        }
    }

    /**
     * Verifica disponibilidad de email
     */
    @GetMapping("/verificar-email")
    public ResponseEntity<?> verificarEmail(@RequestParam String email) {
        try {
            boolean disponible = autenticacionService.isEmailDisponible(email);
            return ResponseEntity.ok(Map.of("disponible", disponible));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error verificando email"));
        }
    }

    /**
     * Cierra sesión (invalidar token en el cliente)
     */
    @PostMapping("/logout")
    public ResponseEntity<?> cerrarSesion() {
        // En implementaciones JWT stateless, el logout se maneja en el cliente
        // eliminando el token del almacenamiento local
        return ResponseEntity.ok(Map.of("message", "Sesión cerrada exitosamente"));
    }

    /**
     * Debug endpoint para verificar datos del usuario
     */
    @GetMapping("/debug-usuario")
    public ResponseEntity<?> debugUsuario(@RequestParam String email) {
        try {
            var usuario = autenticacionService.obtenerUsuarioPorEmail(email);
            if (usuario.isPresent()) {
                var u = usuario.get();
                return ResponseEntity.ok(Map.of(
                    "encontrado", true,
                    "id", u.getId(),
                    "email", u.getEmail(),
                    "activo", u.getActivo(),
                    "emailVerificado", u.getEmailVerificado(),
                    "rol", u.getRol(),
                    "empresaId", u.getEmpresa() != null ? u.getEmpresa().getId() : null
                ));
            } else {
                return ResponseEntity.ok(Map.of("encontrado", false));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Endpoint de prueba para verificar la autenticación
     */
    @PostMapping("/test-login")
    public ResponseEntity<?> testLogin(@Valid @RequestBody LoginDTO loginDTO) {
        try {
            System.out.println("=== TEST LOGIN ===");
            System.out.println("Email: " + loginDTO.getUsuario());
            System.out.println("Contraseña: " + loginDTO.getContrasena());
            
            JwtRespuestaDTO jwtRespuesta = autenticacionService.autenticarUsuario(loginDTO);
            
            System.out.println("✅ Login exitoso");
            System.out.println("Token: " + jwtRespuesta.getToken().substring(0, 20) + "...");
            System.out.println("Usuario: " + jwtRespuesta.getNombreUsuario());
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Login exitoso",
                "token", jwtRespuesta.getToken(),
                "user", Map.of(
                    "email", jwtRespuesta.getEmail(),
                    "nombre", jwtRespuesta.getNombre(),
                    "apellidos", jwtRespuesta.getApellidos(),
                    "roles", jwtRespuesta.getRoles(),
                    "empresaId", jwtRespuesta.getEmpresaId(),
                    "empresaNombre", jwtRespuesta.getEmpresaNombre()
                )
            ));
        } catch (RuntimeException e) {
            System.out.println("❌ Error en login: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                        "success", false,
                        "error", e.getMessage()
                    ));
        } catch (Exception e) {
            System.out.println("❌ Error inesperado: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                        "success", false,
                        "error", "Error interno del servidor"
                    ));
        }
    }
}
