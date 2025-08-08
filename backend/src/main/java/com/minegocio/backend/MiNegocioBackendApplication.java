package com.minegocio.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MiNegocioBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(MiNegocioBackendApplication.class, args);
	}

}
