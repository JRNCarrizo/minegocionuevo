package com.minegocio.backend.controladores;

import com.minegocio.backend.dto.ClienteDTO;
import com.minegocio.backend.entidades.Empresa;
import com.minegocio.backend.servicios.ClienteService;
import com.minegocio.backend.servicios.EmpresaService;
import com.minegocio.backend.seguridad.JwtUtils;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.minegocio.backend.dto.ProductoFavoritoDTO;
import com.minegocio.backend.servicios.ProductoFavoritoService;
import com.minegocio.backend.servicios.EmailService;
import com.minegocio.backend.entidades.TokenRecuperacion;
import com.minegocio.backend.repositorios.TokenRecuperacionRepository;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Controlador para autenticación de clientes en el portal público
 */
@RestController
@RequestMapping("/api/publico/{subdominio}/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://*.localhost:5173", "https://*.localhost:5173", "https://negocio360-frontend.onrender.com", "https://www.negocio360.org"}, allowedHeaders = "*")
public class ClienteAuthController {

    @Autowired
    private ClienteService clienteService;
    
    @Autowired
    private EmpresaService empresaService;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtUtils jwtUtils;
    
    @Autowired
    private EmailService emailService;
    
    @Autowired
    private TokenRecuperacionRepository tokenRecuperacionRepository;

    /**
     * Registro de nuevo cliente
     */
    @PostMapping("/registro")
    public ResponseEntity<?> registrarCliente(
            @PathVariable String subdominio,
            @Valid @RequestBody RegistroClienteDTO registroDTO) {
        try {
            System.out.println("=== DEBUG REGISTRO CLIENTE ===");
            System.out.println("Subdominio: " + subdominio);
            System.out.println("Datos recibidos: " + registroDTO);
            System.out.println("RegistroDTO detalles:");
            System.out.println("  Nombre: '" + registroDTO.getNombre() + "'");
            System.out.println("  Apellidos: '" + registroDTO.getApellidos() + "'");
            System.out.println("  Email: '" + registroDTO.getEmail() + "'");
            System.out.println("  Telefono: '" + registroDTO.getTelefono() + "'");
            System.out.println("  Password: " + (registroDTO.getPassword() != null ? "[PRESENTE]" : "[AUSENTE]"));
            System.out.println("==================================");
            
            // Verificar campos obligatorios antes de continuar
            if (registroDTO.getApellidos() == null || registroDTO.getApellidos().trim().isEmpty()) {
                System.out.println("ERROR: Apellidos es null o vacío");
                return ResponseEntity.badRequest().body(Map.of("error", "Los apellidos son obligatorios"));
            }
            
            // Verificar que la empresa existe
            Optional<Empresa> empresaOpt = empresaService.obtenerPorSubdominio(subdominio);
            System.out.println("Empresa encontrada: " + empresaOpt.isPresent());
            if (empresaOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of(
                    "error", "Empresa no encontrada"
                ));
            }
            
            Empresa empresa = empresaOpt.get();
            
            // Verificar que el email no esté en uso
            Optional<ClienteDTO> clienteExistente = clienteService.obtenerClientePorEmail(empresa.getId(), registroDTO.getEmail());
            if (clienteExistente.isPresent()) {
                return ResponseEntity.status(409).body(Map.of(
                    "error", "El email ya está registrado"
                ));
            }
            
            // Crear nuevo cliente
            System.out.println("Datos del RegistroDTO:");
            System.out.println("  Nombre: '" + registroDTO.getNombre() + "'");
            System.out.println("  Apellidos: '" + registroDTO.getApellidos() + "'");
            System.out.println("  Email: '" + registroDTO.getEmail() + "'");
            System.out.println("  Telefono: '" + registroDTO.getTelefono() + "'");
            System.out.println("  Password recibido: " + (registroDTO.getPassword() != null && !registroDTO.getPassword().isEmpty() ? "[PRESENTE]" : "[AUSENTE]"));
            
            String passwordEncriptado = passwordEncoder.encode(registroDTO.getPassword());
            System.out.println("  Password encriptado: " + (passwordEncriptado != null && !passwordEncriptado.isEmpty() ? "[PRESENTE - " + passwordEncriptado.length() + " chars]" : "[AUSENTE]"));
            
            ClienteDTO nuevoClienteDTO = new ClienteDTO();
            nuevoClienteDTO.setNombre(registroDTO.getNombre());
            nuevoClienteDTO.setApellidos(registroDTO.getApellidos());
            nuevoClienteDTO.setEmail(registroDTO.getEmail());
            nuevoClienteDTO.setTelefono(registroDTO.getTelefono());
            nuevoClienteDTO.setPassword(passwordEncriptado);
            nuevoClienteDTO.setActivo(false); // Inactivo hasta verificar email
            nuevoClienteDTO.setEmailVerificado(false);
            String tokenGenerado = UUID.randomUUID().toString();
            nuevoClienteDTO.setTokenVerificacion(tokenGenerado);
            
            System.out.println("Datos del ClienteDTO creado:");
            System.out.println("  Nombre: '" + nuevoClienteDTO.getNombre() + "'");
            System.out.println("  Apellidos: '" + nuevoClienteDTO.getApellidos() + "'");
            System.out.println("  Email: '" + nuevoClienteDTO.getEmail() + "'");
            System.out.println("  Password en ClienteDTO: " + (nuevoClienteDTO.getPassword() != null && !nuevoClienteDTO.getPassword().isEmpty() ? "[PRESENTE - " + nuevoClienteDTO.getPassword().length() + " chars]" : "[AUSENTE]"));
            System.out.println("  Token generado: '" + tokenGenerado + "'");
            
            ClienteDTO clienteCreado = clienteService.crearCliente(empresa.getId(), nuevoClienteDTO);
            
            // Enviar email de verificación
            try {
                System.out.println("=== DEBUG ENVÍO EMAIL ===");
                System.out.println("Email: " + clienteCreado.getEmail());
                System.out.println("Nombre: " + clienteCreado.getNombre());
                System.out.println("Token para email: '" + clienteCreado.getTokenVerificacion() + "'");
                System.out.println("Subdominio: " + empresa.getSubdominio());
                
                emailService.enviarEmailVerificacionCliente(
                    clienteCreado.getEmail(),
                    clienteCreado.getNombre(),
                    clienteCreado.getTokenVerificacion(),
                    empresa.getSubdominio()
                );
            } catch (Exception e) {
                System.err.println("Error enviando email de verificación al cliente: " + e.getMessage());
                // No lanzar excepción para no fallar el registro
            }
            
            return ResponseEntity.status(201).body(Map.of(
                "mensaje", "Cliente registrado exitosamente. Por favor, verifica tu email para activar tu cuenta.",
                "requiereVerificacion", true,
                "cliente", Map.of(
                    "id", clienteCreado.getId(),
                    "nombre", clienteCreado.getNombre(),
                    "apellidos", clienteCreado.getApellidos(),
                    "email", clienteCreado.getEmail()
                )
            ));
            
        } catch (Exception e) {
            System.out.println("ERROR REGISTRO CLIENTE: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "error", "Error interno del servidor",
                "detalle", e.getMessage()
            ));
        }
    }

    /**
     * Login de cliente
     */
    @PostMapping("/login")
    public ResponseEntity<?> loginCliente(
            @PathVariable String subdominio,
            @Valid @RequestBody LoginClienteDTO loginDTO) {
        try {
            // Verificar que la empresa existe
            Optional<Empresa> empresaOpt = empresaService.obtenerPorSubdominio(subdominio);
            if (empresaOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of(
                    "error", "Empresa no encontrada"
                ));
            }
            
            Empresa empresa = empresaOpt.get();
            
            // Buscar cliente por email
            Optional<ClienteDTO> clienteOpt = clienteService.obtenerClientePorEmail(empresa.getId(), loginDTO.getEmail());
            if (clienteOpt.isEmpty()) {
                return ResponseEntity.status(401).body(Map.of(
                    "error", "Credenciales inválidas"
                ));
            }
            
            ClienteDTO cliente = clienteOpt.get();
            
            // DEBUG: Información del cliente encontrado
            System.out.println("=== DEBUG LOGIN - Cliente encontrado ===");
            System.out.println("ID: " + cliente.getId());
            System.out.println("Email: " + cliente.getEmail());
            System.out.println("Nombre: " + cliente.getNombre());
            System.out.println("Activo: " + cliente.getActivo());
            System.out.println("Password almacenado: " + (cliente.getPassword() != null && !cliente.getPassword().isEmpty() ? "[PRESENTE - " + cliente.getPassword().length() + " chars]" : "[AUSENTE O VACÍO]"));
            System.out.println("Password recibido: " + (loginDTO.getPassword() != null && !loginDTO.getPassword().isEmpty() ? "[PRESENTE - " + loginDTO.getPassword().length() + " chars]" : "[AUSENTE O VACÍO]"));
            
            // Verificar contraseña
            if (!passwordEncoder.matches(loginDTO.getPassword(), cliente.getPassword())) {
                System.out.println("ERROR: Las contraseñas no coinciden");
                System.out.println("Password raw: '" + loginDTO.getPassword() + "'");
                System.out.println("Password hash: '" + cliente.getPassword() + "'");
                return ResponseEntity.status(401).body(Map.of(
                    "error", "Credenciales inválidas"
                ));
            }
            
            System.out.println("✓ Contraseña verificada correctamente");
            
            // Verificar que el cliente esté activo
            if (!cliente.getActivo()) {
                return ResponseEntity.status(401).body(Map.of(
                    "error", "Cuenta deshabilitada"
                ));
            }
            
            // Verificar que el email esté verificado
            if (!cliente.getEmailVerificado()) {
                return ResponseEntity.status(403).body(Map.of(
                    "error", "EMAIL_NO_VERIFICADO",
                    "mensaje", "Debes verificar tu email antes de poder iniciar sesión"
                ));
            }
            
            // Generar token JWT
            String token = generarTokenCliente(cliente, empresa);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Login exitoso",
                "token", token,
                "cliente", Map.of(
                    "id", cliente.getId(),
                    "nombre", cliente.getNombre(),
                    "apellidos", cliente.getApellidos(),
                    "email", cliente.getEmail()
                ),
                "empresa", Map.of(
                    "nombre", empresa.getNombre(),
                    "subdominio", empresa.getSubdominio()
                )
            ));
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "error", "Error interno del servidor",
                "detalle", e.getMessage()
            ));
        }
    }

    /**
     * Login de cliente con Google
     */
    @PostMapping("/google/login")
    public ResponseEntity<?> loginClienteGoogle(
            @PathVariable String subdominio,
            @RequestBody Map<String, Object> googleData) {
        try {
            String email = (String) googleData.get("email");
            String name = (String) googleData.get("name");
            String picture = (String) googleData.get("picture");
            String sub = (String) googleData.get("sub");

            System.out.println("=== DEBUG GOOGLE LOGIN CLIENTE ===");
            System.out.println("Subdominio: " + subdominio);
            System.out.println("Email: " + email);
            System.out.println("Name: " + name);
            System.out.println("Sub: " + sub);

            // Verificar que la empresa existe
            Optional<Empresa> empresaOpt = empresaService.obtenerPorSubdominio(subdominio);
            if (empresaOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of(
                    "error", "Empresa no encontrada"
                ));
            }
            
            Empresa empresa = empresaOpt.get();
            
            // Buscar cliente por email
            Optional<ClienteDTO> clienteOpt = clienteService.obtenerClientePorEmail(empresa.getId(), email);
            ClienteDTO cliente;
            
            if (clienteOpt.isEmpty()) {
                // Cliente no existe, crearlo automáticamente con Google
                System.out.println("Cliente no encontrado, creando nuevo cliente con Google");
                
                // Extraer nombre y apellidos del nombre completo de Google
                String[] nombreCompleto = name != null ? name.split(" ", 2) : new String[]{"Usuario", "Google"};
                String nombre = nombreCompleto[0];
                String apellidos = nombreCompleto.length > 1 ? nombreCompleto[1] : "";
                
                // Crear nuevo cliente DTO
                ClienteDTO nuevoClienteDTO = new ClienteDTO();
                nuevoClienteDTO.setNombre(nombre);
                nuevoClienteDTO.setApellidos(apellidos);
                nuevoClienteDTO.setEmail(email);
                nuevoClienteDTO.setTelefono("");
                nuevoClienteDTO.setPassword(""); // No se necesita password para Google
                nuevoClienteDTO.setActivo(true); // Activo inmediatamente
                nuevoClienteDTO.setEmailVerificado(true); // Verificado automáticamente por Google
                nuevoClienteDTO.setTokenVerificacion(null); // No necesita token de verificación
                
                // Crear el cliente
                cliente = clienteService.crearCliente(empresa.getId(), nuevoClienteDTO);
                System.out.println("Nuevo cliente creado con Google: " + cliente.getId());
                
            } else {
                // Cliente existe, verificar que esté activo y marcar como verificado si no lo está
                cliente = clienteOpt.get();
                
                if (!cliente.getActivo()) {
                    return ResponseEntity.status(401).body(Map.of(
                        "error", "Cuenta deshabilitada"
                    ));
                }
                
                // Si el cliente no está verificado, marcarlo como verificado automáticamente
                if (!cliente.getEmailVerificado()) {
                    System.out.println("Cliente encontrado pero no verificado, marcando como verificado por Google");
                    cliente = clienteService.marcarClienteComoVerificado(empresa.getId(), cliente.getId());
                }
            }
            
            // Generar token JWT
            String token = generarTokenCliente(cliente, empresa);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Login exitoso con Google",
                "token", token,
                "cliente", Map.of(
                    "id", cliente.getId(),
                    "nombre", cliente.getNombre(),
                    "apellidos", cliente.getApellidos(),
                    "email", cliente.getEmail()
                ),
                "empresa", Map.of(
                    "nombre", empresa.getNombre(),
                    "subdominio", empresa.getSubdominio()
                )
            ));
            
        } catch (Exception e) {
            System.err.println("Error en login Google: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "error", "Error interno del servidor",
                "detalle", e.getMessage()
            ));
        }
    }

    /**
     * Obtener perfil del cliente logueado
     */
    @GetMapping("/perfil")
    public ResponseEntity<?> obtenerPerfil(
            @PathVariable String subdominio,
            @RequestHeader("Authorization") String authHeader) {
        try {
            System.out.println("=== DEBUG OBTENER PERFIL CLIENTE ===");
            System.out.println("Subdominio: " + subdominio);
            System.out.println("AuthHeader: " + (authHeader != null ? authHeader.substring(0, Math.min(20, authHeader.length())) + "..." : "null"));
            
            // Extraer y validar token
            if (!authHeader.startsWith("Bearer ")) {
                System.out.println("ERROR: Token no comienza con 'Bearer '");
                return ResponseEntity.status(401).body(Map.of("error", "Token inválido"));
            }
            
            String token = authHeader.substring(7);
            System.out.println("Token extraído: " + token.substring(0, Math.min(20, token.length())) + "...");
            
            // Validar token JWT
            if (!jwtUtils.validateJwtToken(token)) {
                System.out.println("ERROR: Token JWT inválido");
                return ResponseEntity.status(401).body(Map.of("error", "Token inválido o expirado"));
            }
            
            // Extraer información del token
            Long clienteId = jwtUtils.getUserIdFromJwtToken(token);
            Long empresaId = jwtUtils.getEmpresaIdFromJwtToken(token);
            System.out.println("ClienteId extraído del token: " + clienteId);
            System.out.println("EmpresaId extraído del token: " + empresaId);
            
            // Verificar que la empresa coincida con el subdominio
            Optional<Empresa> empresaOpt = empresaService.obtenerPorSubdominio(subdominio);
            if (empresaOpt.isEmpty() || !empresaOpt.get().getId().equals(empresaId)) {
                System.out.println("ERROR: Empresa no coincide - Subdominio: " + subdominio + ", EmpresaId del token: " + empresaId);
                return ResponseEntity.status(401).body(Map.of("error", "Token no válido para esta empresa"));
            }
            
            System.out.println("Empresa encontrada: " + empresaOpt.get().getNombre() + " (ID: " + empresaOpt.get().getId() + ")");
            
            // Obtener información actualizada del cliente
            Optional<ClienteDTO> clienteOpt = clienteService.obtenerClientePorId(empresaId, clienteId);
            if (clienteOpt.isEmpty()) {
                System.out.println("ERROR: Cliente no encontrado - ClienteId: " + clienteId + ", EmpresaId: " + empresaId);
                return ResponseEntity.status(404).body(Map.of("error", "Cliente no encontrado"));
            }
            
            ClienteDTO cliente = clienteOpt.get();
            System.out.println("Cliente encontrado: " + cliente.getNombre() + " " + cliente.getApellidos() + " (ID: " + cliente.getId() + ")");
            
            var respuesta = Map.of(
                "cliente", Map.of(
                    "id", cliente.getId(),
                    "nombre", cliente.getNombre(),
                    "apellidos", cliente.getApellidos(),
                    "email", cliente.getEmail(),
                    "telefono", cliente.getTelefono()
                ),
                "empresa", Map.of(
                    "nombre", empresaOpt.get().getNombre(),
                    "subdominio", empresaOpt.get().getSubdominio()
                )
            );
            
            System.out.println("Respuesta enviada: " + respuesta);
            System.out.println("=== FIN DEBUG OBTENER PERFIL CLIENTE ===");
            
            return ResponseEntity.ok(respuesta);
            
        } catch (Exception e) {
            System.err.println("ERROR en obtenerPerfil: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "error", "Error interno del servidor",
                "detalle", e.getMessage()
            ));
        }
    }

    /**
     * Generar token JWT específico para clientes
     */
    private String generarTokenCliente(ClienteDTO cliente, Empresa empresa) {
        // Generar token JWT real para el cliente
        return jwtUtils.generarJwtToken(
            cliente.getEmail(), 
            cliente.getId(), 
            empresa.getId(), 
            cliente.getNombre() + " " + (cliente.getApellidos() != null ? cliente.getApellidos() : "")
        );
    }

    /**
     * DTO para registro de cliente
     */
    public static class RegistroClienteDTO {
        @NotBlank(message = "El nombre es obligatorio")
        @Size(min = 2, max = 100, message = "El nombre debe tener entre 2 y 100 caracteres")
        private String nombre;
        
        @NotBlank(message = "Los apellidos son obligatorios")
        @Size(max = 100, message = "Los apellidos no pueden tener más de 100 caracteres")
        private String apellidos;
        
        @NotBlank(message = "El email es obligatorio")
        @Email(message = "El email debe tener un formato válido")
        private String email;
        
        @Size(max = 20, message = "El teléfono no puede tener más de 20 caracteres")
        private String telefono;
        
        @NotBlank(message = "La contraseña es obligatoria")
        @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
        private String password;

        // Getters y setters
        public String getNombre() { return nombre; }
        public void setNombre(String nombre) { this.nombre = nombre; }

        public String getApellidos() { return apellidos; }
        public void setApellidos(String apellidos) { this.apellidos = apellidos; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getTelefono() { return telefono; }
        public void setTelefono(String telefono) { this.telefono = telefono; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    /**
     * DTO para login de cliente
     */
    public static class LoginClienteDTO {
        @NotBlank(message = "El email es obligatorio")
        @Email(message = "El email debe tener un formato válido")
        private String email;
        
        @NotBlank(message = "La contraseña es obligatoria")
        private String password;

        // Getters y setters
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }
    
    /**
     * Endpoint de debug para verificar que el controlador funciona
     */
    @GetMapping("/debug")
    public ResponseEntity<?> debug(@PathVariable String subdominio) {
        return ResponseEntity.ok(Map.of(
            "mensaje", "Controlador funcionando",
            "subdominio", subdominio,
            "timestamp", System.currentTimeMillis()
        ));
    }
    
    /**
     * Endpoint para listar empresas (debug)
     */
    @GetMapping("/empresas")
    public ResponseEntity<?> listarEmpresas() {
        try {
            List<Empresa> empresas = empresaService.obtenerTodasLasEmpresas();
            return ResponseEntity.ok(Map.of(
                "total", empresas.size(),
                "empresas", empresas.stream().map(e -> {
                    return Map.of(
                        "id", e.getId(),
                        "nombre", e.getNombre(),
                        "subdominio", e.getSubdominio(),
                        "activa", e.getActiva()
                    );
                }).toList()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "error", "Error al obtener empresas",
                "detalle", e.getMessage()
            ));
        }
    }
    
    /**
     * Endpoint de prueba simple
     */
    @GetMapping("/ping")
    public ResponseEntity<?> ping() {
        return ResponseEntity.ok(Map.of(
            "mensaje", "pong",
            "timestamp", System.currentTimeMillis()
        ));
    }
    
    /**
     * ENDPOINT TEMPORAL PARA DEBUG - Resetear contraseña de cliente
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetearPassword(
            @PathVariable String subdominio,
            @RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String nuevaPassword = request.get("password");
            
            if (email == null || nuevaPassword == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email y password son requeridos"));
            }
            
            // Verificar que la empresa existe
            Optional<Empresa> empresaOpt = empresaService.obtenerPorSubdominio(subdominio);
            if (empresaOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Empresa no encontrada"));
            }
            
            Empresa empresa = empresaOpt.get();
            
            // Buscar cliente por email
            Optional<ClienteDTO> clienteOpt = clienteService.obtenerClientePorEmail(empresa.getId(), email);
            if (clienteOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Cliente no encontrado"));
            }
            
            ClienteDTO cliente = clienteOpt.get();
            
            // Actualizar contraseña
            cliente.setPassword(passwordEncoder.encode(nuevaPassword));
            ClienteDTO clienteActualizado = clienteService.actualizarCliente(empresa.getId(), cliente.getId(), cliente);
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Contraseña actualizada exitosamente",
                "cliente", Map.of(
                    "id", clienteActualizado.getId(),
                    "email", clienteActualizado.getEmail(),
                    "nombre", clienteActualizado.getNombre()
                )
            ));
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "error", "Error interno del servidor",
                "detalle", e.getMessage()
            ));
        }
    }
    
    /**
     * Solicitar recuperación de contraseña
     */
    @PostMapping("/solicitar-recuperacion")
    public ResponseEntity<?> solicitarRecuperacionPassword(
            @PathVariable String subdominio,
            @RequestBody Map<String, String> request) {
        try {
            // Limpiar tokens expirados antes de procesar
            limpiarTokensExpirados();
            
            String email = request.get("email");
            
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "El email es requerido"));
            }
            
            // Verificar que la empresa existe
            Optional<Empresa> empresaOpt = empresaService.obtenerPorSubdominio(subdominio);
            if (empresaOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Empresa no encontrada"));
            }
            
            Empresa empresa = empresaOpt.get();
            
            // Buscar cliente por email
            Optional<ClienteDTO> clienteOpt = clienteService.obtenerClientePorEmail(empresa.getId(), email);
            if (clienteOpt.isEmpty()) {
                // Por seguridad, no revelamos si el email existe o no
                return ResponseEntity.ok(Map.of("mensaje", "Si el email existe en nuestra base de datos, recibirás un enlace de recuperación"));
            }
            
            ClienteDTO cliente = clienteOpt.get();
            
            // Generar token de recuperación
            String token = UUID.randomUUID().toString();
            
            // Guardar token en la base de datos
            TokenRecuperacion tokenRecuperacion = new TokenRecuperacion();
            tokenRecuperacion.setToken(token);
            tokenRecuperacion.setEmail(cliente.getEmail());
            tokenRecuperacion.setEmpresa(empresa);
            tokenRecuperacion.setFechaCreacion(LocalDateTime.now());
            tokenRecuperacion.setFechaExpiracion(LocalDateTime.now().plusHours(1));
            tokenRecuperacion.setUsado(false);
            
            tokenRecuperacionRepository.save(tokenRecuperacion);
            
            // Enviar email con enlace de recuperación
            System.out.println("=== ENVIANDO EMAIL DE RECUPERACIÓN ===");
            System.out.println("Email del cliente: " + cliente.getEmail());
            System.out.println("Nombre del cliente: " + cliente.getNombre());
            System.out.println("Subdominio: " + subdominio);
            System.out.println("Token generado: " + token);
            
            emailService.enviarEmailRecuperacionCliente(
                cliente.getEmail(), 
                token, 
                cliente.getNombre(), 
                subdominio
            );
            
            System.out.println("✅ Email enviado exitosamente");
            
            return ResponseEntity.ok(Map.of("mensaje", "Si el email existe en nuestra base de datos, recibirás un enlace de recuperación"));
            
        } catch (Exception e) {
            System.err.println("Error al solicitar recuperación de contraseña: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error interno del servidor"));
        }
    }
    
    /**
     * Validar token de recuperación
     */
    @GetMapping("/validar-token/{token}")
    public ResponseEntity<?> validarTokenRecuperacion(
            @PathVariable String subdominio,
            @PathVariable String token) {
        try {
            // Verificar que la empresa existe
            Optional<Empresa> empresaOpt = empresaService.obtenerPorSubdominio(subdominio);
            if (empresaOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Empresa no encontrada"));
            }
            
            Empresa empresa = empresaOpt.get();
            
            // Buscar token en la base de datos
            Optional<TokenRecuperacion> tokenOpt = tokenRecuperacionRepository.findByTokenAndEmpresaAndUsadoFalse(token, empresa);
            if (tokenOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("valido", false, "error", "Token inválido o expirado"));
            }
            
            TokenRecuperacion tokenRecuperacion = tokenOpt.get();
            
            // Verificar si el token ha expirado
            if (tokenRecuperacion.getFechaExpiracion().isBefore(LocalDateTime.now())) {
                return ResponseEntity.badRequest().body(Map.of("valido", false, "error", "Token expirado"));
            }
            
            return ResponseEntity.ok(Map.of(
                "valido", true,
                "email", tokenRecuperacion.getEmail()
            ));
            
        } catch (Exception e) {
            System.err.println("Error al validar token: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error interno del servidor"));
        }
    }
    
    /**
     * Cambiar contraseña con token
     */
    @PostMapping("/cambiar-password-token")
    public ResponseEntity<?> cambiarPasswordConToken(
            @PathVariable String subdominio,
            @RequestBody Map<String, String> request) {
        try {
            String token = request.get("token");
            String nuevaPassword = request.get("password");
            
            if (token == null || nuevaPassword == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Token y nueva contraseña son requeridos"));
            }
            
            // Verificar que la empresa existe
            Optional<Empresa> empresaOpt = empresaService.obtenerPorSubdominio(subdominio);
            if (empresaOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Empresa no encontrada"));
            }
            
            Empresa empresa = empresaOpt.get();
            
            // Buscar token en la base de datos
            Optional<TokenRecuperacion> tokenOpt = tokenRecuperacionRepository.findByTokenAndEmpresaAndUsadoFalse(token, empresa);
            if (tokenOpt.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Token inválido o expirado"));
            }
            
            TokenRecuperacion tokenRecuperacion = tokenOpt.get();
            
            // Verificar si el token ha expirado
            if (tokenRecuperacion.getFechaExpiracion().isBefore(LocalDateTime.now())) {
                return ResponseEntity.badRequest().body(Map.of("error", "Token expirado"));
            }
            
            // Buscar cliente por email
            Optional<ClienteDTO> clienteOpt = clienteService.obtenerClientePorEmail(empresa.getId(), tokenRecuperacion.getEmail());
            if (clienteOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Cliente no encontrado"));
            }
            
            ClienteDTO cliente = clienteOpt.get();
            
            // Actualizar contraseña
            cliente.setPassword(passwordEncoder.encode(nuevaPassword));
            ClienteDTO clienteActualizado = clienteService.actualizarCliente(empresa.getId(), cliente.getId(), cliente);
            
            // Marcar token como usado
            tokenRecuperacion.setUsado(true);
            tokenRecuperacionRepository.save(tokenRecuperacion);
            
            // Enviar email de confirmación
            emailService.enviarEmailConfirmacionCambioCliente(
                cliente.getEmail(), 
                cliente.getNombre()
            );
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Contraseña actualizada exitosamente",
                "cliente", Map.of(
                    "id", clienteActualizado.getId(),
                    "email", clienteActualizado.getEmail(),
                    "nombre", clienteActualizado.getNombre()
                )
            ));
            
        } catch (Exception e) {
            System.err.println("Error al cambiar contraseña con token: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error interno del servidor"));
        }
    }

    /**
     * ENDPOINT TEMPORAL PARA DEBUG - Listar todos los clientes
     */
    @GetMapping("/list-clientes")
    public ResponseEntity<?> listarClientes(@PathVariable String subdominio) {
        try {
            // Verificar que la empresa existe
            Optional<Empresa> empresaOpt = empresaService.obtenerPorSubdominio(subdominio);
            if (empresaOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Empresa no encontrada"));
            }
            
            Empresa empresa = empresaOpt.get();
            
            // Obtener todos los clientes de la empresa
            List<ClienteDTO> clientes = clienteService.obtenerTodosLosClientes(empresa.getId());
            
            return ResponseEntity.ok(Map.of(
                "empresa", empresa.getNombre(),
                "totalClientes", clientes.size(),
                "clientes", clientes.stream().map(c -> Map.of(
                    "id", c.getId(),
                    "nombre", c.getNombre(),
                    "apellidos", c.getApellidos(),
                    "email", c.getEmail(),
                    "activo", c.getActivo(),
                    "tienePassword", c.getPassword() != null && !c.getPassword().isEmpty()
                )).toList()
            ));
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "error", "Error interno del servidor",
                "detalle", e.getMessage()
            ));
        }
    }
    
    /**
     * ENDPOINT TEMPORAL PARA DEBUG - Actualizar contraseñas de todos los clientes
     */
    @PostMapping("/fix-passwords")
    public ResponseEntity<?> arreglarPasswords(@PathVariable String subdominio) {
        try {
            // Verificar que la empresa existe
            Optional<Empresa> empresaOpt = empresaService.obtenerPorSubdominio(subdominio);
            if (empresaOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Empresa no encontrada"));
            }
            
            Empresa empresa = empresaOpt.get();
            List<ClienteDTO> clientes = clienteService.obtenerTodosLosClientes(empresa.getId());
            
            int actualizados = 0;
            for (ClienteDTO cliente : clientes) {
                if (cliente.getPassword() == null || cliente.getPassword().isEmpty()) {
                    // Generar password temporal
                    String passwordTemporal = "cliente" + cliente.getId();
                    String passwordEncriptado = passwordEncoder.encode(passwordTemporal);
                    
                    ClienteDTO clienteActualizado = new ClienteDTO();
                    clienteActualizado.setId(cliente.getId());
                    clienteActualizado.setPassword(passwordEncriptado);
                    
                    clienteService.actualizarCliente(empresa.getId(), cliente.getId(), clienteActualizado);
                    actualizados++;
                }
            }
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Passwords arreglados",
                "clientesActualizados", actualizados,
                "totalClientes", clientes.size()
            ));
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ============================================
    // ENDPOINTS PARA PRODUCTOS FAVORITOS
    // ============================================

    @Autowired
    private ProductoFavoritoService productoFavoritoService;

    /**
     * Obtener productos favoritos del cliente
     */
    @GetMapping("/favoritos")
    public ResponseEntity<?> obtenerFavoritos(
            @PathVariable String subdominio,
            @RequestHeader("Authorization") String authHeader) {
        try {
            System.out.println("=== DEBUG OBTENER FAVORITOS ===");
            System.out.println("Subdominio: " + subdominio);
            
            // Validar token
            if (!authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of("error", "Token inválido"));
            }
            
            String token = authHeader.substring(7);
            if (!jwtUtils.validateJwtToken(token)) {
                return ResponseEntity.status(401).body(Map.of("error", "Token inválido o expirado"));
            }
            
            // Extraer información del token
            Long clienteId = jwtUtils.getUserIdFromJwtToken(token);
            Long empresaId = jwtUtils.getEmpresaIdFromJwtToken(token);
            
            // Verificar que la empresa existe y coincide
            Optional<Empresa> empresaOpt = empresaService.obtenerPorSubdominio(subdominio);
            if (empresaOpt.isEmpty() || !empresaOpt.get().getId().equals(empresaId)) {
                return ResponseEntity.status(401).body(Map.of("error", "Token no válido para esta empresa"));
            }
            
            // Obtener favoritos
            List<ProductoFavoritoDTO> favoritos = productoFavoritoService.obtenerFavoritos(clienteId, empresaId);
            
            System.out.println("Favoritos encontrados: " + favoritos.size());
            System.out.println("=== FIN DEBUG OBTENER FAVORITOS ===");
            
            return ResponseEntity.ok(Map.of(
                "favoritos", favoritos,
                "total", favoritos.size()
            ));
            
        } catch (Exception e) {
            System.err.println("ERROR en obtenerFavoritos: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "error", "Error interno del servidor",
                "detalle", e.getMessage()
            ));
        }
    }

    /**
     * Agregar producto a favoritos
     */
    @PostMapping("/favoritos/{productoId}")
    public ResponseEntity<?> agregarFavorito(
            @PathVariable String subdominio,
            @PathVariable Long productoId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            System.out.println("=== DEBUG AGREGAR FAVORITO ===");
            System.out.println("Subdominio: " + subdominio);
            System.out.println("ProductoId: " + productoId);
            
            // Validar token
            if (!authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of("error", "Token inválido"));
            }
            
            String token = authHeader.substring(7);
            if (!jwtUtils.validateJwtToken(token)) {
                return ResponseEntity.status(401).body(Map.of("error", "Token inválido o expirado"));
            }
            
            // Extraer información del token
            Long clienteId = jwtUtils.getUserIdFromJwtToken(token);
            Long empresaId = jwtUtils.getEmpresaIdFromJwtToken(token);
            
            // Verificar que la empresa existe y coincide
            Optional<Empresa> empresaOpt = empresaService.obtenerPorSubdominio(subdominio);
            if (empresaOpt.isEmpty() || !empresaOpt.get().getId().equals(empresaId)) {
                return ResponseEntity.status(401).body(Map.of("error", "Token no válido para esta empresa"));
            }
            
            // Agregar favorito
            ProductoFavoritoDTO favorito = productoFavoritoService.agregarFavorito(clienteId, productoId, empresaId);
            
            System.out.println("Favorito agregado exitosamente");
            System.out.println("=== FIN DEBUG AGREGAR FAVORITO ===");
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Producto agregado a favoritos",
                "favorito", favorito
            ));
            
        } catch (Exception e) {
            System.err.println("ERROR en agregarFavorito: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "error", "Error interno del servidor",
                "detalle", e.getMessage()
            ));
        }
    }

    /**
     * Remover producto de favoritos
     */
    @DeleteMapping("/favoritos/{productoId}")
    public ResponseEntity<?> removerFavorito(
            @PathVariable String subdominio,
            @PathVariable Long productoId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            System.out.println("=== DEBUG REMOVER FAVORITO ===");
            System.out.println("Subdominio: " + subdominio);
            System.out.println("ProductoId: " + productoId);
            
            // Validar token
            if (!authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of("error", "Token inválido"));
            }
            
            String token = authHeader.substring(7);
            if (!jwtUtils.validateJwtToken(token)) {
                return ResponseEntity.status(401).body(Map.of("error", "Token inválido o expirado"));
            }
            
            // Extraer información del token
            Long clienteId = jwtUtils.getUserIdFromJwtToken(token);
            Long empresaId = jwtUtils.getEmpresaIdFromJwtToken(token);
            
            // Verificar que la empresa existe y coincide
            Optional<Empresa> empresaOpt = empresaService.obtenerPorSubdominio(subdominio);
            if (empresaOpt.isEmpty() || !empresaOpt.get().getId().equals(empresaId)) {
                return ResponseEntity.status(401).body(Map.of("error", "Token no válido para esta empresa"));
            }
            
            // Remover favorito
            productoFavoritoService.removerFavorito(clienteId, productoId, empresaId);
            
            System.out.println("Favorito removido exitosamente");
            System.out.println("=== FIN DEBUG REMOVER FAVORITO ===");
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Producto removido de favoritos"
            ));
            
        } catch (Exception e) {
            System.err.println("ERROR en removerFavorito: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "error", "Error interno del servidor",
                "detalle", e.getMessage()
            ));
        }
    }

    /**
     * Verificar si un producto es favorito
     */
    @GetMapping("/favoritos/{productoId}/verificar")
    public ResponseEntity<?> verificarFavorito(
            @PathVariable String subdominio,
            @PathVariable Long productoId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            // Validar token
            if (!authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of("error", "Token inválido"));
            }
            
            String token = authHeader.substring(7);
            if (!jwtUtils.validateJwtToken(token)) {
                return ResponseEntity.status(401).body(Map.of("error", "Token inválido o expirado"));
            }
            
            // Extraer información del token
            Long clienteId = jwtUtils.getUserIdFromJwtToken(token);
            Long empresaId = jwtUtils.getEmpresaIdFromJwtToken(token);
            
            // Verificar que la empresa existe y coincide
            Optional<Empresa> empresaOpt = empresaService.obtenerPorSubdominio(subdominio);
            if (empresaOpt.isEmpty() || !empresaOpt.get().getId().equals(empresaId)) {
                return ResponseEntity.status(401).body(Map.of("error", "Token no válido para esta empresa"));
            }
            
            // Verificar si es favorito
            boolean esFavorito = productoFavoritoService.esFavorito(clienteId, productoId, empresaId);
            
            return ResponseEntity.ok(Map.of(
                "esFavorito", esFavorito
            ));
            
        } catch (Exception e) {
            System.err.println("ERROR en verificarFavorito: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "error", "Error interno del servidor",
                "detalle", e.getMessage()
            ));
        }
    }

    /**
     * Actualizar perfil del cliente
     */
    @PutMapping("/perfil/{clienteId}")
    public ResponseEntity<?> actualizarPerfil(
            @PathVariable String subdominio,
            @PathVariable Long clienteId,
            @Valid @RequestBody ActualizarPerfilDTO actualizarDTO,
            @RequestHeader("Authorization") String authHeader) {
        try {
            System.out.println("=== DEBUG ACTUALIZAR PERFIL CLIENTE ===");
            System.out.println("Subdominio: " + subdominio);
            System.out.println("ClienteId: " + clienteId);
            System.out.println("Datos recibidos: " + actualizarDTO);
            
            // Validar token
            if (!authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of("error", "Token inválido"));
            }
            
            String token = authHeader.substring(7);
            if (!jwtUtils.validateJwtToken(token)) {
                return ResponseEntity.status(401).body(Map.of("error", "Token inválido o expirado"));
            }
            
            // Verificar que el cliente del token coincide con el clienteId de la URL
            Long clienteIdToken = jwtUtils.getUserIdFromJwtToken(token);
            Long empresaId = jwtUtils.getEmpresaIdFromJwtToken(token);
            
            if (!clienteId.equals(clienteIdToken)) {
                return ResponseEntity.status(403).body(Map.of("error", "No tienes permisos para actualizar este perfil"));
            }
            
            // Verificar que la empresa existe y coincide
            Optional<Empresa> empresaOpt = empresaService.obtenerPorSubdominio(subdominio);
            if (empresaOpt.isEmpty() || !empresaOpt.get().getId().equals(empresaId)) {
                return ResponseEntity.status(401).body(Map.of("error", "Token no válido para esta empresa"));
            }
            
            // Verificar que el cliente existe
            Optional<ClienteDTO> clienteOpt = clienteService.obtenerClientePorId(empresaId, clienteId);
            if (clienteOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Cliente no encontrado"));
            }
            
            ClienteDTO clienteExistente = clienteOpt.get();
            
            // Verificar que el email no esté en uso por otro cliente
            if (!actualizarDTO.getEmail().equals(clienteExistente.getEmail())) {
                Optional<ClienteDTO> clienteConEmail = clienteService.obtenerClientePorEmail(empresaId, actualizarDTO.getEmail());
                if (clienteConEmail.isPresent() && !clienteConEmail.get().getId().equals(clienteId)) {
                    return ResponseEntity.status(409).body(Map.of("error", "El email ya está en uso por otro cliente"));
                }
            }
            
            // Actualizar cliente preservando datos existentes
            ClienteDTO clienteActualizado = new ClienteDTO();
            clienteActualizado.setId(clienteId);
            clienteActualizado.setNombre(actualizarDTO.getNombre());
            clienteActualizado.setApellidos(actualizarDTO.getApellidos());
            clienteActualizado.setEmail(actualizarDTO.getEmail());
            clienteActualizado.setTelefono(actualizarDTO.getTelefono());
            
            // Preservar otros campos existentes
            clienteActualizado.setDireccion(clienteExistente.getDireccion());
            clienteActualizado.setCiudad(clienteExistente.getCiudad());
            clienteActualizado.setCodigoPostal(clienteExistente.getCodigoPostal());
            clienteActualizado.setPais(clienteExistente.getPais());
            clienteActualizado.setPassword(clienteExistente.getPassword()); // Preservar contraseña actual
            
            ClienteDTO resultado = clienteService.actualizarCliente(empresaId, clienteId, clienteActualizado);
            
            System.out.println("Perfil actualizado exitosamente");
            System.out.println("=== FIN DEBUG ACTUALIZAR PERFIL CLIENTE ===");
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Perfil actualizado correctamente",
                "cliente", Map.of(
                    "id", resultado.getId(),
                    "nombre", resultado.getNombre(),
                    "apellidos", resultado.getApellidos(),
                    "email", resultado.getEmail(),
                    "telefono", resultado.getTelefono()
                )
            ));
            
        } catch (Exception e) {
            System.err.println("ERROR en actualizarPerfil: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "error", "Error interno del servidor",
                "detalle", e.getMessage()
            ));
        }
    }

    /**
     * Cambiar contraseña del cliente
     */
    @PutMapping("/password/{clienteId}")
    public ResponseEntity<?> cambiarPassword(
            @PathVariable String subdominio,
            @PathVariable Long clienteId,
            @Valid @RequestBody CambiarPasswordDTO passwordDTO,
            @RequestHeader("Authorization") String authHeader) {
        try {
            System.out.println("=== DEBUG CAMBIAR PASSWORD CLIENTE ===");
            System.out.println("Subdominio: " + subdominio);
            System.out.println("ClienteId: " + clienteId);
            
            // Validar token
            if (!authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(401).body(Map.of("error", "Token inválido"));
            }
            
            String token = authHeader.substring(7);
            if (!jwtUtils.validateJwtToken(token)) {
                return ResponseEntity.status(401).body(Map.of("error", "Token inválido o expirado"));
            }
            
            // Verificar que el cliente del token coincide con el clienteId de la URL
            Long clienteIdToken = jwtUtils.getUserIdFromJwtToken(token);
            Long empresaId = jwtUtils.getEmpresaIdFromJwtToken(token);
            
            if (!clienteId.equals(clienteIdToken)) {
                return ResponseEntity.status(403).body(Map.of("error", "No tienes permisos para cambiar la contraseña de este cliente"));
            }
            
            // Verificar que la empresa existe y coincide
            Optional<Empresa> empresaOpt = empresaService.obtenerPorSubdominio(subdominio);
            if (empresaOpt.isEmpty() || !empresaOpt.get().getId().equals(empresaId)) {
                return ResponseEntity.status(401).body(Map.of("error", "Token no válido para esta empresa"));
            }
            
            // Verificar que el cliente existe
            Optional<ClienteDTO> clienteOpt = clienteService.obtenerClientePorId(empresaId, clienteId);
            if (clienteOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Cliente no encontrado"));
            }
            
            ClienteDTO clienteExistente = clienteOpt.get();
            
            // Verificar contraseña actual
            if (!passwordEncoder.matches(passwordDTO.getPasswordActual(), clienteExistente.getPassword())) {
                return ResponseEntity.status(400).body(Map.of("error", "La contraseña actual es incorrecta"));
            }
            
            // Actualizar solo la contraseña preservando todos los demás datos
            String nuevaPasswordEncriptada = passwordEncoder.encode(passwordDTO.getPasswordNueva());
            
            ClienteDTO clienteActualizado = new ClienteDTO();
            clienteActualizado.setId(clienteId);
            clienteActualizado.setNombre(clienteExistente.getNombre());
            clienteActualizado.setApellidos(clienteExistente.getApellidos());
            clienteActualizado.setEmail(clienteExistente.getEmail());
            clienteActualizado.setTelefono(clienteExistente.getTelefono());
            clienteActualizado.setDireccion(clienteExistente.getDireccion());
            clienteActualizado.setCiudad(clienteExistente.getCiudad());
            clienteActualizado.setCodigoPostal(clienteExistente.getCodigoPostal());
            clienteActualizado.setPais(clienteExistente.getPais());
            clienteActualizado.setPassword(nuevaPasswordEncriptada);
            
            clienteService.actualizarCliente(empresaId, clienteId, clienteActualizado);
            
            System.out.println("Contraseña cambiada exitosamente");
            System.out.println("=== FIN DEBUG CAMBIAR PASSWORD CLIENTE ===");
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Contraseña cambiada correctamente"
            ));
            
        } catch (Exception e) {
            System.err.println("ERROR en cambiarPassword: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of(
                "error", "Error interno del servidor",
                "detalle", e.getMessage()
            ));
        }
    }

    /**
     * DTO para actualizar perfil
     */
    public static class ActualizarPerfilDTO {
        @NotBlank(message = "El nombre es obligatorio")
        @Size(min = 2, max = 100, message = "El nombre debe tener entre 2 y 100 caracteres")
        private String nombre;
        
        @Size(max = 100, message = "Los apellidos no pueden tener más de 100 caracteres")
        private String apellidos;
        
        @NotBlank(message = "El email es obligatorio")
        @Email(message = "El email debe tener un formato válido")
        private String email;
        
        @Size(max = 20, message = "El teléfono no puede tener más de 20 caracteres")
        private String telefono;
        
        // Getters y setters
        public String getNombre() { return nombre; }
        public void setNombre(String nombre) { this.nombre = nombre; }
        
        public String getApellidos() { return apellidos; }
        public void setApellidos(String apellidos) { this.apellidos = apellidos; }
        
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        
        public String getTelefono() { return telefono; }
        public void setTelefono(String telefono) { this.telefono = telefono; }
    }

    /**
     * DTO para cambiar contraseña
     */
    public static class CambiarPasswordDTO {
        @NotBlank(message = "La contraseña actual es obligatoria")
        private String passwordActual;
        
        @NotBlank(message = "La nueva contraseña es obligatoria")
        @Size(min = 6, message = "La nueva contraseña debe tener al menos 6 caracteres")
        private String passwordNueva;
        
        // Getters y setters
        public String getPasswordActual() { return passwordActual; }
        public void setPasswordActual(String passwordActual) { this.passwordActual = passwordActual; }
        
        public String getPasswordNueva() { return passwordNueva; }
        public void setPasswordNueva(String passwordNueva) { this.passwordNueva = passwordNueva; }
    }

    /**
     * Limpiar tokens expirados (método interno)
     */
    private void limpiarTokensExpirados() {
        try {
            tokenRecuperacionRepository.eliminarTokensExpirados(LocalDateTime.now());
            System.out.println("Tokens expirados limpiados automáticamente");
        } catch (Exception e) {
            System.err.println("Error al limpiar tokens expirados: " + e.getMessage());
        }
    }
    
    /**
     * Endpoint de prueba para verificar el envío de emails
     */
    @PostMapping("/test-email")
    public ResponseEntity<?> testEmail(@PathVariable String subdominio) {
        try {
            System.out.println("=== TEST EMAIL ===");
            System.out.println("Probando envío de email...");
            
            emailService.enviarEmailRecuperacionCliente(
                "test@example.com", 
                "test-token-123", 
                "Usuario Test", 
                subdominio
            );
            
            return ResponseEntity.ok(Map.of("mensaje", "Email de prueba enviado correctamente"));
        } catch (Exception e) {
            System.err.println("Error en test de email: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Error al enviar email de prueba: " + e.getMessage()));
        }
    }
}
