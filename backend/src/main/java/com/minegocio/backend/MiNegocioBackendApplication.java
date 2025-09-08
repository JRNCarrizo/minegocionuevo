package com.minegocio.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MiNegocioBackendApplication {

	public static void main(String[] args) {
		// Configurar el sistema para modo headless (sin interfaz gráfica)
		// Esto es necesario para que Apache POI funcione en entornos de producción como Railway
		System.setProperty("java.awt.headless", "true");
		System.setProperty("sun.java2d.headless", "true");
		System.setProperty("java.awt.graphicsenv", "sun.awt.X11GraphicsEnvironment");
		System.setProperty("sun.java2d.noddraw", "true");
		System.setProperty("sun.java2d.d3d", "false");
		System.setProperty("sun.java2d.opengl", "false");
		System.setProperty("sun.java2d.pmoffscreen", "false");
		System.setProperty("sun.java2d.xrender", "false");
		
		// Configuración adicional para Apache POI
		System.setProperty("org.apache.poi.util.POILogger", "org.apache.poi.util.NullLogger");
		
		SpringApplication.run(MiNegocioBackendApplication.class, args);
	}

}
