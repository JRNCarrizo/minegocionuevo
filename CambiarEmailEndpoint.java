import java.sql.*;
import java.util.HashMap;
import java.util.Map;
import java.util.Scanner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Endpoint standalone para cambiar email de usuario en producción
 * Uso: java -cp ".:mysql-connector-java.jar:spring-security-crypto.jar" CambiarEmailEndpoint
 */
public class CambiarEmailEndpoint {
    
    // Configuración de la base de datos - AJUSTA ESTOS VALORES
    private static final String DB_URL = "jdbc:mysql://localhost:3306/minegocio_prod";
    private static final String DB_USER = "tu_usuario_db";
    private static final String DB_PASSWORD = "tu_password_db";
    
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        
        System.out.println("=== ENDPOINT PARA CAMBIAR EMAIL ===");
        System.out.println("Este endpoint permite cambiar el email de un usuario en producción");
        System.out.println();
        
        // Solicitar datos
        System.out.print("Email actual: ");
        String emailActual = scanner.nextLine().trim();
        
        System.out.print("Nuevo email: ");
        String nuevoEmail = scanner.nextLine().trim();
        
        System.out.print("Contraseña del usuario: ");
        String contrasena = scanner.nextLine().trim();
        
        System.out.println();
        System.out.println("Procesando cambio de email...");
        
        try {
            Map<String, Object> resultado = cambiarEmail(emailActual, nuevoEmail, contrasena);
            
            if ((Boolean) resultado.get("exito")) {
                System.out.println("✅ Email cambiado exitosamente!");
                System.out.println("Email anterior: " + emailActual);
                System.out.println("Email nuevo: " + nuevoEmail);
                System.out.println("Usuario ID: " + resultado.get("usuarioId"));
            } else {
                System.out.println("❌ Error: " + resultado.get("mensaje"));
            }
            
        } catch (Exception e) {
            System.out.println("❌ Error inesperado: " + e.getMessage());
            e.printStackTrace();
        }
        
        scanner.close();
    }
    
    /**
     * Método principal para cambiar el email
     */
    public static Map<String, Object> cambiarEmail(String emailActual, String nuevoEmail, String contrasena) {
        Map<String, Object> resultado = new HashMap<>();
        
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            
            // 1. Verificar que el usuario existe
            String sqlBuscar = "SELECT id, password, activo, email_verificado FROM usuarios WHERE email = ?";
            PreparedStatement stmtBuscar = conn.prepareStatement(sqlBuscar);
            stmtBuscar.setString(1, emailActual);
            
            ResultSet rs = stmtBuscar.executeQuery();
            
            if (!rs.next()) {
                resultado.put("exito", false);
                resultado.put("mensaje", "Usuario no encontrado con el email: " + emailActual);
                return resultado;
            }
            
            Long usuarioId = rs.getLong("id");
            String passwordHash = rs.getString("password");
            boolean activo = rs.getBoolean("activo");
            boolean emailVerificado = rs.getBoolean("email_verificado");
            
            // 2. Verificar que el usuario esté activo
            if (!activo) {
                resultado.put("exito", false);
                resultado.put("mensaje", "El usuario está deshabilitado");
                return resultado;
            }
            
            // 3. Verificar la contraseña
            BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
            if (!passwordEncoder.matches(contrasena, passwordHash)) {
                resultado.put("exito", false);
                resultado.put("mensaje", "Contraseña incorrecta");
                return resultado;
            }
            
            // 4. Verificar que el nuevo email no esté en uso
            String sqlVerificarNuevo = "SELECT COUNT(*) FROM usuarios WHERE email = ? AND id != ?";
            PreparedStatement stmtVerificar = conn.prepareStatement(sqlVerificarNuevo);
            stmtVerificar.setString(1, nuevoEmail);
            stmtVerificar.setLong(2, usuarioId);
            
            ResultSet rsVerificar = stmtVerificar.executeQuery();
            rsVerificar.next();
            int count = rsVerificar.getInt(1);
            
            if (count > 0) {
                resultado.put("exito", false);
                resultado.put("mensaje", "El nuevo email ya está en uso por otro usuario");
                return resultado;
            }
            
            // 5. Actualizar el email
            String sqlActualizar = "UPDATE usuarios SET email = ?, email_verificado = false WHERE id = ?";
            PreparedStatement stmtActualizar = conn.prepareStatement(sqlActualizar);
            stmtActualizar.setString(1, nuevoEmail);
            stmtActualizar.setLong(2, usuarioId);
            
            int filasActualizadas = stmtActualizar.executeUpdate();
            
            if (filasActualizadas > 0) {
                resultado.put("exito", true);
                resultado.put("mensaje", "Email actualizado correctamente");
                resultado.put("usuarioId", usuarioId);
                resultado.put("emailAnterior", emailActual);
                resultado.put("emailNuevo", nuevoEmail);
                resultado.put("emailVerificado", false); // Se marca como no verificado
            } else {
                resultado.put("exito", false);
                resultado.put("mensaje", "No se pudo actualizar el email");
            }
            
        } catch (SQLException e) {
            resultado.put("exito", false);
            resultado.put("mensaje", "Error de base de datos: " + e.getMessage());
        }
        
        return resultado;
    }
    
    /**
     * Método para verificar si un email está disponible
     */
    public static boolean verificarEmailDisponible(String email) {
        try (Connection conn = DriverManager.getConnection(DB_URL, DB_USER, DB_PASSWORD)) {
            String sql = "SELECT COUNT(*) FROM usuarios WHERE email = ?";
            PreparedStatement stmt = conn.prepareStatement(sql);
            stmt.setString(1, email);
            
            ResultSet rs = stmt.executeQuery();
            rs.next();
            int count = rs.getInt(1);
            
            return count == 0;
            
        } catch (SQLException e) {
            System.err.println("Error verificando email: " + e.getMessage());
            return false;
        }
    }
} 