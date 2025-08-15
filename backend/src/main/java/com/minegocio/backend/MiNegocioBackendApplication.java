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
		
		SpringApplication.run(MiNegocioBackendApplication.class, args);
	}

}
