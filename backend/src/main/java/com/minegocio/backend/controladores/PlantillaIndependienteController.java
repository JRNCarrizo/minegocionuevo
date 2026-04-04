package com.minegocio.backend.controladores;

import com.minegocio.backend.servicios.PlantillaCargaMasivaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * Controlador independiente para plantillas de Excel
 * Endpoints completamente públicos sin autenticación
 */
@RestController
@CrossOrigin(origins = "*")
public class PlantillaIndependienteController {

    @Autowired
    private PlantillaCargaMasivaService plantillaCargaMasivaService;

    /**
     * Endpoint para descargar plantilla pública
     */
    @GetMapping("/api/plantilla-publica")
    public void descargarPlantillaPublica(HttpServletResponse response) throws IOException {
        try {
            System.out.println("📥 Descargando plantilla pública desde PlantillaIndependienteController");
            
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment; filename=\"plantilla_importacion_productos_" + 
                LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + ".xlsx\"");
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            response.setHeader("Access-Control-Allow-Headers", "*");

            byte[] plantilla = plantillaCargaMasivaService.generarPlantillaCargaMasiva();
            response.getOutputStream().write(plantilla);
            response.getOutputStream().flush();
            
            System.out.println("✅ Plantilla pública generada exitosamente");
        } catch (Exception e) {
            System.err.println("❌ Error en PlantillaIndependienteController (pública): " + e.getMessage());
            e.printStackTrace();
            
            // Enviar error como JSON
            response.setContentType("application/json");
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\": \"Error al generar plantilla: " + e.getMessage() + "\"}");
        }
    }

    /**
     * Endpoint para descargar plantilla simple
     */
    @GetMapping("/api/plantilla-simple")
    public void descargarPlantillaSimple(HttpServletResponse response) throws IOException {
        try {
            System.out.println("📥 Descargando plantilla simple desde PlantillaIndependienteController");
            
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment; filename=\"plantilla_simple_" + 
                LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + ".xlsx\"");
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            response.setHeader("Access-Control-Allow-Headers", "*");

            byte[] plantilla = plantillaCargaMasivaService.generarPlantillaCargaMasiva();
            response.getOutputStream().write(plantilla);
            response.getOutputStream().flush();
            
            System.out.println("✅ Plantilla simple generada exitosamente");
        } catch (Exception e) {
            System.err.println("❌ Error en PlantillaIndependienteController (simple): " + e.getMessage());
            e.printStackTrace();
            
            // Enviar error como JSON
            response.setContentType("application/json");
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\": \"Error al generar plantilla: " + e.getMessage() + "\"}");
        }
    }

    /**
     * Endpoint para descargar plantilla final
     */
    @GetMapping("/api/plantilla-final")
    public void descargarPlantillaFinal(HttpServletResponse response) throws IOException {
        try {
            System.out.println("📥 Descargando plantilla final desde PlantillaIndependienteController");
            
            response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            response.setHeader("Content-Disposition", "attachment; filename=\"plantilla_final_" + 
                LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + ".xlsx\"");
            response.setHeader("Access-Control-Allow-Origin", "*");
            response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
            response.setHeader("Access-Control-Allow-Headers", "*");

            byte[] plantilla = plantillaCargaMasivaService.generarPlantillaCargaMasiva();
            response.getOutputStream().write(plantilla);
            response.getOutputStream().flush();
            
            System.out.println("✅ Plantilla final generada exitosamente");
        } catch (Exception e) {
            System.err.println("❌ Error en PlantillaIndependienteController (final): " + e.getMessage());
            e.printStackTrace();
            
            // Enviar error como JSON
            response.setContentType("application/json");
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            response.getWriter().write("{\"error\": \"Error al generar plantilla: " + e.getMessage() + "\"}");
        }
    }
}
