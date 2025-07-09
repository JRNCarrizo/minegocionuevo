package com.minegocio.backend.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Utilidad para generar hashes de contraseña BCrypt
 */
public class GenerarHashPassword {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        
        String password = "admin123";
        String hash = encoder.encode(password);
        
        System.out.println("==== GENERADOR DE HASH BCRYPT ====");
        System.out.println("Contraseña: " + password);
        System.out.println("Hash BCrypt: " + hash);
        System.out.println();
        
        // Verificar que el hash funciona
        boolean matches = encoder.matches(password, hash);
        System.out.println("Verificación: " + (matches ? "✅ CORRECTO" : "❌ ERROR"));
        System.out.println();
        
        System.out.println("SQL para actualizar:");
        System.out.println("UPDATE usuarios SET password = '" + hash + "' WHERE email = 'admin@demo.com';");
    }
}
