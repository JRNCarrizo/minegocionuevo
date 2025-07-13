package com.minegocio.backend.controladores;

import com.minegocio.backend.servicios.CloudinaryService;
import com.minegocio.backend.seguridad.UsuarioPrincipal;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;


import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/archivos")
@CrossOrigin(origins = "*")
public class ArchivoController {

    @Autowired
    private CloudinaryService cloudinaryService;

    @GetMapping("/debug-auth")
    public ResponseEntity<?> debugAuth() {
        System.out.println("=== DEBUG AUTH STATUS ===");
        
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        System.out.println("Authentication: " + (authentication != null ? "Presente" : "Ausente"));
        System.out.println("Authenticated: " + (authentication != null ? authentication.isAuthenticated() : "N/A"));
        
        if (authentication != null) {
            System.out.println("Principal class: " + authentication.getPrincipal().getClass().getName());
            System.out.println("Principal: " + authentication.getPrincipal());
            
            if (authentication.getPrincipal() instanceof UsuarioPrincipal) {
                UsuarioPrincipal principal = (UsuarioPrincipal) authentication.getPrincipal();
                System.out.println("EmpresaId: " + principal.getEmpresaId());
                System.out.println("Email: " + principal.getUsername());
            }
        }
        
        System.out.println("=== FIN DEBUG AUTH ===");
        
        return ResponseEntity.ok(Map.of(
            "authentication", authentication != null ? "Presente" : "Ausente",
            "authenticated", authentication != null ? authentication.isAuthenticated() : false,
            "principalClass", authentication != null ? authentication.getPrincipal().getClass().getName() : "N/A",
            "empresaId", authentication != null && authentication.getPrincipal() instanceof UsuarioPrincipal ? 
                ((UsuarioPrincipal) authentication.getPrincipal()).getEmpresaId() : null
        ));
    }

    @GetMapping("/test")
    public ResponseEntity<?> testEndpoint() {
        System.out.println("=== TEST ENDPOINT HIT ===");
        return ResponseEntity.ok(Map.of(
            "mensaje", "Endpoint de archivos funcionando correctamente",
            "timestamp", System.currentTimeMillis()
        ));
    }

    @PostMapping("/test-fondo")
    public ResponseEntity<?> testSubirImagenFondo(
            @RequestParam("archivo") MultipartFile archivo,
            HttpServletRequest request) {
        
        System.out.println("=== TEST SUBIDA IMAGEN FONDO ===");
        System.out.println("Archivo recibido: " + (archivo != null ? archivo.getOriginalFilename() : "NULL"));
        System.out.println("Archivo vacío: " + (archivo != null ? archivo.isEmpty() : "NULL"));
        System.out.println("Tamaño archivo: " + (archivo != null ? archivo.getSize() : "NULL"));
        System.out.println("Content-Type: " + (archivo != null ? archivo.getContentType() : "NULL"));
        
        try {
            // Validar que el archivo no esté vacío
            if (archivo.isEmpty()) {
                System.out.println("ERROR: Archivo vacío");
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "El archivo no puede estar vacío"));
            }

            // Validar tipo de contenido
            String contentType = archivo.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                System.out.println("ERROR: Tipo de contenido no válido: " + contentType);
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Solo se permiten archivos de imagen"));
            }

            // Validar tamaño del archivo (máximo 5MB)
            if (archivo.getSize() > 5 * 1024 * 1024) {
                System.out.println("ERROR: Archivo demasiado grande: " + archivo.getSize());
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "El archivo no puede ser mayor a 5MB"));
            }

            // Obtener empresaId del contexto de seguridad
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                System.out.println("ERROR: Usuario no autenticado");
                return ResponseEntity.status(401)
                    .body(Map.of("error", "Usuario no autenticado"));
            }

            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) authentication.getPrincipal();
            Long empresaId = usuarioPrincipal.getEmpresaId();
            
            if (empresaId == null) {
                System.out.println("ERROR: No se pudo obtener el ID de la empresa");
                return ResponseEntity.status(400)
                    .body(Map.of("error", "No se pudo identificar la empresa"));
            }

            System.out.println("EmpresaId obtenido del contexto: " + empresaId);
            System.out.println("Subiendo imagen de fondo a Cloudinary...");
            
            // Subir imagen a Cloudinary con tipo "fondo"
            String urlImagen = cloudinaryService.subirImagen(archivo, empresaId, "fondo");
            System.out.println("Imagen de fondo subida exitosamente: " + urlImagen);

            return ResponseEntity.ok(Map.of(
                "url", urlImagen,
                "tipo", "fondo",
                "empresaId", empresaId,
                "mensaje", "Imagen de fondo subida exitosamente en modo prueba"
            ));

        } catch (IOException e) {
            System.err.println("Error al subir archivo: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Error al subir el archivo: " + e.getMessage()));
        } catch (Exception e) {
            System.err.println("Error inesperado al subir archivo: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Error inesperado al subir el archivo"));
        }
    }

    @PostMapping("/subir")
    public ResponseEntity<?> subirArchivo(
            @RequestParam("archivo") MultipartFile archivo,
            @RequestParam("tipo") String tipo,
            HttpServletRequest request) {
        
        System.out.println("=== DEBUG SUBIDA ARCHIVO ===");
        System.out.println("Tipo recibido: '" + tipo + "'");
        System.out.println("Archivo recibido: " + (archivo != null ? archivo.getOriginalFilename() : "NULL"));
        System.out.println("Archivo vacío: " + (archivo != null ? archivo.isEmpty() : "NULL"));
        System.out.println("Tamaño archivo: " + (archivo != null ? archivo.getSize() : "NULL"));
        System.out.println("Content-Type: " + (archivo != null ? archivo.getContentType() : "NULL"));
        System.out.println("==================================");
        
        try {
            // Validar tipo de archivo
            if (!tipo.matches("^(logo|producto|fondo)$")) {
                System.out.println("ERROR: Tipo de archivo no válido: " + tipo);
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Tipo de archivo no válido. Tipos permitidos: logo, producto, fondo"));
            }

            // Validar que el archivo no esté vacío
            if (archivo.isEmpty()) {
                System.out.println("ERROR: Archivo vacío");
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "El archivo no puede estar vacío"));
            }

            // Validar tipo de contenido
            String contentType = archivo.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                System.out.println("ERROR: Tipo de contenido no válido: " + contentType);
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Solo se permiten archivos de imagen"));
            }

            // Validar tamaño del archivo (máximo 5MB)
            if (archivo.getSize() > 5 * 1024 * 1024) {
                System.out.println("ERROR: Archivo demasiado grande: " + archivo.getSize());
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "El archivo no puede ser mayor a 5MB"));
            }

            // Obtener empresaId del contexto de seguridad
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                System.out.println("ERROR: Usuario no autenticado");
                return ResponseEntity.status(401)
                    .body(Map.of("error", "Usuario no autenticado. Por favor, inicia sesión nuevamente."));
            }

            Object principal = authentication.getPrincipal();
            if (!(principal instanceof UsuarioPrincipal)) {
                System.out.println("ERROR: Principal no es UsuarioPrincipal: " + principal.getClass().getName());
                return ResponseEntity.status(401)
                    .body(Map.of("error", "Tipo de autenticación no válido. Por favor, inicia sesión nuevamente."));
            }

            UsuarioPrincipal usuarioPrincipal = (UsuarioPrincipal) principal;
            Long empresaId = usuarioPrincipal.getEmpresaId();
            
            if (empresaId == null) {
                System.out.println("ERROR: No se pudo obtener el ID de la empresa");
                return ResponseEntity.status(400)
                    .body(Map.of("error", "No se pudo identificar la empresa. Por favor, inicia sesión nuevamente."));
            }

            System.out.println("EmpresaId obtenido del contexto: " + empresaId);
            System.out.println("Subiendo imagen a Cloudinary con tipo: " + tipo);
            // Subir imagen a Cloudinary con el tipo específico
            String urlImagen = cloudinaryService.subirImagen(archivo, empresaId, tipo);
            System.out.println("Imagen subida exitosamente: " + urlImagen);

            return ResponseEntity.ok(Map.of(
                "url", urlImagen,
                "tipo", tipo,
                "mensaje", "Archivo subido exitosamente"
            ));

        } catch (IOException e) {
            System.err.println("Error al subir archivo: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Error al subir el archivo: " + e.getMessage()));
        } catch (Exception e) {
            System.err.println("Error inesperado al subir archivo: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                .body(Map.of("error", "Error inesperado al subir el archivo: " + e.getMessage()));
        }
    }
} 