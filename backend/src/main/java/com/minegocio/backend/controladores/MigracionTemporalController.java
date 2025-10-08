package com.minegocio.backend.controladores;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;
import java.util.HashMap;
import java.util.Map;

/**
 * ⚠️ CONTROLADOR TEMPORAL - ELIMINAR DESPUÉS DE USAR
 * Endpoint para aplicar migración de constraint CHECK en producción
 */
@RestController
@RequestMapping("/api/publico")
@CrossOrigin(origins = "*")
public class MigracionTemporalController {

    @Autowired
    private DataSource dataSource;

    /**
     * Endpoint temporal para aplicar fix de constraint CHECK
     * URL: /api/publico/fix-constraint-completado-sin-conteo
     * ⚠️ TEMPORAL: Endpoint PÚBLICO - ELIMINAR INMEDIATAMENTE DESPUÉS DE USAR
     */
    @GetMapping("/fix-constraint-completado-sin-conteo")
    // @PreAuthorize("hasRole('ADMINISTRADOR')") // Comentado temporalmente para acceso directo
    public ResponseEntity<?> fixConstraintCompletadoSinConteo() {
        Map<String, Object> response = new HashMap<>();
        
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            
            System.out.println("🔧 Iniciando fix de constraint CHECK...");
            
            // Verificar si el constraint existe
            String checkConstraint = 
                "SELECT constraint_name FROM information_schema.table_constraints " +
                "WHERE constraint_name = 'conteo_sector_estado_check' " +
                "AND table_name = 'conteo_sector'";
            
            var rs = stmt.executeQuery(checkConstraint);
            boolean constraintExists = rs.next();
            rs.close();
            
            if (constraintExists) {
                // Eliminar constraint existente
                System.out.println("📋 Eliminando constraint existente...");
                stmt.execute("ALTER TABLE conteo_sector DROP CONSTRAINT conteo_sector_estado_check");
                System.out.println("✅ Constraint anterior eliminado");
            } else {
                System.out.println("ℹ️ No se encontró constraint previo");
            }
            
            // Crear nuevo constraint con todos los estados
            System.out.println("📋 Creando nuevo constraint...");
            String createConstraint = 
                "ALTER TABLE conteo_sector " +
                "ADD CONSTRAINT conteo_sector_estado_check " +
                "CHECK (estado IN (" +
                "'PENDIENTE'," +
                "'EN_PROGRESO'," +
                "'ESPERANDO_VERIFICACION'," +
                "'CON_DIFERENCIAS'," +
                "'COMPLETADO'," +
                "'COMPLETADO_SIN_CONTEO'," +
                "'CANCELADO'" +
                "))";
            
            stmt.execute(createConstraint);
            System.out.println("✅ Nuevo constraint creado con COMPLETADO_SIN_CONTEO");
            
            response.put("success", true);
            response.put("message", "✅ Constraint CHECK actualizado correctamente");
            response.put("constraintExisted", constraintExists);
            response.put("estados", new String[]{
                "PENDIENTE", "EN_PROGRESO", "ESPERANDO_VERIFICACION",
                "CON_DIFERENCIAS", "COMPLETADO", "COMPLETADO_SIN_CONTEO", "CANCELADO"
            });
            response.put("warning", "⚠️ IMPORTANTE: Elimina este endpoint después de usarlo");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("❌ Error aplicando fix: " + e.getMessage());
            e.printStackTrace();
            
            response.put("success", false);
            response.put("error", e.getMessage());
            response.put("message", "❌ Error al aplicar el fix");
            
            return ResponseEntity.status(500).body(response);
        }
    }
}

