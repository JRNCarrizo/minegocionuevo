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

/**
 * Controlador para autenticación de clientes en el portal público
 */
@RestController
@RequestMapping("/api/publico/{subdominio}/auth")
@CrossOrigin(origins = {"http://localhost:5173", "http://*.localhost:5173", "https://*.localhost:5173"}, allowedHeaders = "*")
public class ClienteAuthController {

    @Autowired
    private ClienteService clienteService;
    
    @Autowired
    private EmpresaService empresaService;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtUtils jwtUtils;

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
            nuevoClienteDTO.setActivo(true);
            nuevoClienteDTO.setEmailVerificado(true); // Por simplicidad, por ahora no requiere verificación
            
            System.out.println("Datos del ClienteDTO creado:");
            System.out.println("  Nombre: '" + nuevoClienteDTO.getNombre() + "'");
            System.out.println("  Apellidos: '" + nuevoClienteDTO.getApellidos() + "'");
            System.out.println("  Email: '" + nuevoClienteDTO.getEmail() + "'");
            System.out.println("  Password en ClienteDTO: " + (nuevoClienteDTO.getPassword() != null && !nuevoClienteDTO.getPassword().isEmpty() ? "[PRESENTE - " + nuevoClienteDTO.getPassword().length() + " chars]" : "[AUSENTE]"));
            
            ClienteDTO clienteCreado = clienteService.crearCliente(empresa.getId(), nuevoClienteDTO);
            
            // Generar token JWT para el cliente
            String token = generarTokenCliente(clienteCreado, empresa);
            
            return ResponseEntity.status(201).body(Map.of(
                "mensaje", "Cliente registrado exitosamente",
                "token", token,
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
            
            int clientesActualizados = 0;
            String passwordPorDefecto = "123456"; // Contraseña por defecto
            
            for (ClienteDTO cliente : clientes) {
                if (cliente.getPassword() == null || cliente.getPassword().trim().isEmpty()) {
                    cliente.setPassword(passwordEncoder.encode(passwordPorDefecto));
                    clienteService.actualizarCliente(empresa.getId(), cliente.getId(), cliente);
                    clientesActualizados++;
                }
            }
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Contraseñas actualizadas",
                "clientesActualizados", clientesActualizados,
                "passwordPorDefecto", passwordPorDefecto
            ));
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "error", "Error interno del servidor",
                "detalle", e.getMessage()
            ));
        }
    }
}
