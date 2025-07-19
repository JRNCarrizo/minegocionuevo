package com.minegocio.backend.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Utilidad para generar hashes de contraseñas
 * Solo usar para desarrollo/testing
 */
public class GenerarHashPassword {
    
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        // Contraseña del super admin: 32691240Jor (sin punto al final)
        String password = "32691240Jor";
        String hashedPassword = encoder.encode(password);
        
        System.out.println("=== HASH DE CONTRASEÑA SUPER ADMIN ===");
        System.out.println("Contraseña original: " + password);
        System.out.println("Hash generado: " + hashedPassword);
        System.out.println("======================================");
        
        // Verificar que funciona
        boolean matches = encoder.matches(password, hashedPassword);
        System.out.println("Verificación: " + matches);
        
        // También probar con punto al final
        String passwordWithDot = "32691240Jor.";
        String hashedPasswordWithDot = encoder.encode(passwordWithDot);
        System.out.println("\n=== CON PUNTO AL FINAL ===");
        System.out.println("Contraseña con punto: " + passwordWithDot);
        System.out.println("Hash generado: " + hashedPasswordWithDot);
        System.out.println("Verificación: " + encoder.matches(passwordWithDot, hashedPasswordWithDot));
    }
}
