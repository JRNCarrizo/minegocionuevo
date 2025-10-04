package com.minegocio.backend.controladores;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;

import java.util.Map;

/**
 * Controlador temporal para arreglar problemas de base de datos
 * ELIMINAR DESPUÉS DE USAR
 */
@RestController
@RequestMapping("/api/publico/database-fix")
@CrossOrigin(origins = "*")
public class DatabaseFixController {

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Endpoint temporal para agregar la columna eliminado a detalle_conteo
     * ELIMINAR DESPUÉS DE USAR
     */
    @PostMapping("/add-eliminado-column")
    @Transactional
    public ResponseEntity<?> addEliminadoColumn() {
        try {
            System.out.println("🔧 Ejecutando fix para agregar columna eliminado...");
            
            // Verificar si la columna ya existe
            String checkColumnQuery = """
                SELECT COUNT(*) 
                FROM information_schema.columns 
                WHERE table_name = 'detalle_conteo' 
                AND column_name = 'eliminado'
                AND table_schema = 'public'
                """;
            
            Long columnExists = (Long) entityManager.createNativeQuery(checkColumnQuery).getSingleResult();
            
            if (columnExists > 0) {
                System.out.println("✅ Columna eliminado ya existe");
                return ResponseEntity.ok(Map.of(
                    "mensaje", "Columna eliminado ya existe",
                    "status", "success"
                ));
            }
            
            // Agregar la columna eliminado
            String addColumnQuery = """
                ALTER TABLE detalle_conteo 
                ADD COLUMN eliminado BOOLEAN NOT NULL DEFAULT FALSE
                """;
            
            entityManager.createNativeQuery(addColumnQuery).executeUpdate();
            System.out.println("✅ Columna eliminado agregada exitosamente");
            
            // Crear índices
            String createIndex1Query = """
                CREATE INDEX IF NOT EXISTS idx_detalle_conteo_eliminado 
                ON detalle_conteo(eliminado)
                """;
            
            String createIndex2Query = """
                CREATE INDEX IF NOT EXISTS idx_detalle_conteo_sector_eliminado 
                ON detalle_conteo(conteo_sector_id, eliminado)
                """;
            
            entityManager.createNativeQuery(createIndex1Query).executeUpdate();
            entityManager.createNativeQuery(createIndex2Query).executeUpdate();
            System.out.println("✅ Índices creados exitosamente");
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Columna eliminado agregada exitosamente",
                "status", "success",
                "acciones", new String[]{
                    "Columna eliminado agregada",
                    "Índice idx_detalle_conteo_eliminado creado",
                    "Índice idx_detalle_conteo_sector_eliminado creado"
                }
            ));
            
        } catch (Exception e) {
            System.err.println("❌ Error ejecutando fix: " + e.getMessage());
            e.printStackTrace();
            
            return ResponseEntity.status(500).body(Map.of(
                "error", "Error ejecutando fix: " + e.getMessage(),
                "status", "error"
            ));
        }
    }
    
    /**
     * Endpoint para verificar el estado de la tabla detalle_conteo
     */
    @GetMapping("/check-table-structure")
    public ResponseEntity<?> checkTableStructure() {
        try {
            System.out.println("🔍 Verificando estructura de tabla detalle_conteo...");
            
            String query = """
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'detalle_conteo' 
                AND table_schema = 'public'
                ORDER BY ordinal_position
                """;
            
            @SuppressWarnings("unchecked")
            java.util.List<Object[]> results = entityManager.createNativeQuery(query).getResultList();
            
            java.util.List<Map<String, Object>> columns = new java.util.ArrayList<>();
            for (Object[] row : results) {
                columns.add(Map.of(
                    "column_name", row[0],
                    "data_type", row[1],
                    "is_nullable", row[2],
                    "column_default", row[3] != null ? row[3] : "NULL"
                ));
            }
            
            return ResponseEntity.ok(Map.of(
                "mensaje", "Estructura de tabla obtenida",
                "status", "success",
                "columns", columns
            ));
            
        } catch (Exception e) {
            System.err.println("❌ Error verificando estructura: " + e.getMessage());
            e.printStackTrace();
            
            return ResponseEntity.status(500).body(Map.of(
                "error", "Error verificando estructura: " + e.getMessage(),
                "status", "error"
            ));
        }
    }
}
